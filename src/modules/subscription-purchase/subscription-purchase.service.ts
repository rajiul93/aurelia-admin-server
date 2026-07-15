import { NotFoundError, ValidationError } from "@/lib/api/errors";
import { auditService } from "@/lib/audit";
import { devicePricingTierRepository } from "@/modules/device-pricing-tier/device-pricing-tier.repository";
import { toDevicePricingTierDtoList } from "@/modules/device-pricing-tier/device-pricing-tier.mapper";
import { subscriptionPlanRepository } from "@/modules/subscription-plan/subscription-plan.repository";
import { toSubscriptionPlanDtoList } from "@/modules/subscription-plan/subscription-plan.mapper";
import type { MobileSessionContext } from "@/lib/mobile/require-mobile";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe/client";
import {
  toSubscriptionPurchaseDto,
  toSubscriptionPurchaseDtoList,
} from "./subscription-purchase.mapper";
import { computePrice } from "./subscription-purchase.pricing";
import { subscriptionPurchaseRepository } from "./subscription-purchase.repository";
import type {
  CheckoutInput,
  ListSubscriptionPurchasesQuery,
} from "./subscription-purchase.schema";

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export const subscriptionPurchaseService = {
  async getMobileConfig() {
    const [plans, tiers, settings] = await Promise.all([
      subscriptionPlanRepository.findMany(),
      devicePricingTierRepository.findMany(),
      subscriptionPurchaseRepository.getPricingSettings(),
    ]);

    return {
      plans: toSubscriptionPlanDtoList(plans.filter((plan) => plan.isActive)),
      deviceTiers: toDevicePricingTierDtoList(
        tiers.filter((tier) => tier.isActive),
      ),
      currency: settings.currency,
      multiDeviceDiscountEnabled: settings.multiDeviceDiscountEnabled,
      multiDeviceDiscountPercent:
        settings.multiDeviceDiscountPercent.toNumber(),
      maxDevicesPerPurchase: settings.maxDevicesPerPurchase,
    };
  },

  async listForAdmin(query: ListSubscriptionPurchasesQuery) {
    const { records, total } = await subscriptionPurchaseRepository.findMany(
      query,
    );

    return {
      data: toSubscriptionPurchaseDtoList(records),
      meta: { page: query.page, limit: query.limit, total },
    };
  },

  async getStatusForSession(id: string, session: MobileSessionContext) {
    const purchase = await subscriptionPurchaseRepository.findById(id);

    // A purchase belongs to the grant that made it. Matching on email alone is
    // not enough now that a grant may have none — an absent email must never
    // match another absent email.
    if (!purchase || purchase.tourAccessId !== session.tourAccessId) {
      throw new NotFoundError("Purchase not found");
    }

    return toSubscriptionPurchaseDto(purchase);
  },

  async createCheckout(session: MobileSessionContext, input: CheckoutInput) {
    // Stripe needs an email for the receipt. Phone-only grants have none until
    // the buyer supplies one at checkout.
    const email = input.email ?? session.email;

    if (!email) {
      throw new ValidationError(
        "An email address is required to complete the purchase.",
      );
    }

    const plan = await subscriptionPurchaseRepository.getActivePlan(
      input.planId,
    );
    if (!plan) {
      throw new NotFoundError("Subscription plan not found");
    }

    const settings = await subscriptionPurchaseRepository.getPricingSettings();

    const tours = await subscriptionPurchaseRepository.findPublishedTours(
      input.tourIds,
    );
    const foundIds = new Set(tours.map((tour) => tour.id));
    const missingOrUnpublished = input.tourIds.filter(
      (tourId) => !foundIds.has(tourId),
    );
    if (missingOrUnpublished.length > 0) {
      throw new ValidationError(
        `These tours are not available for purchase: ${missingOrUnpublished.join(", ")}`,
      );
    }

    const price = computePrice({
      basePrice: plan.basePrice.toNumber(),
      deviceCount: input.deviceCount,
      maxDevicesPerPurchase: settings.maxDevicesPerPurchase,
      multiDeviceDiscountEnabled: settings.multiDeviceDiscountEnabled,
      multiDeviceDiscountPercent:
        settings.multiDeviceDiscountPercent.toNumber(),
    });

    const purchase = await subscriptionPurchaseRepository.create({
      email,
      plan: { connect: { id: plan.id } },
      deviceCount: input.deviceCount,
      basePriceAtPurchase: price.basePrice,
      deviceSurchargeAtPurchase: price.deviceSurcharge,
      discountPercentAtPurchase: price.discountPercent,
      totalAmount: price.totalAmount,
      currency: settings.currency,
      tourAccess: { connect: { id: session.tourAccessId } },
      tours: {
        create: input.tourIds.map((tourId) => ({ tourId })),
      },
    });

    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(price.totalAmount * 100),
      currency: settings.currency.toLowerCase(),
      metadata: { purchaseId: purchase.id },
      // The mobile Payment Sheet has no return URL, so redirect-based
      // methods (iDEAL, Klarna, ...) would fail — cards only.
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
    });

    await subscriptionPurchaseRepository.update(purchase.id, {
      stripePaymentIntentId: paymentIntent.id,
    });

    return {
      purchaseId: purchase.id,
      clientSecret: paymentIntent.client_secret,
      amount: price.totalAmount,
      currency: settings.currency,
    };
  },

  async handlePaymentIntentSucceeded(paymentIntentId: string) {
    const purchase =
      await subscriptionPurchaseRepository.findByStripePaymentIntentId(
        paymentIntentId,
      );

    if (!purchase || purchase.status !== "PENDING") {
      return;
    }

    await prisma.$transaction(async (tx) => {
      const [access, plan, purchaseTours] = await Promise.all([
        purchase.tourAccessId
          ? tx.tourAccess.findUnique({ where: { id: purchase.tourAccessId } })
          : null,
        tx.subscriptionPlan.findUnique({ where: { id: purchase.planId } }),
        tx.subscriptionPurchaseTour.findMany({
          where: { purchaseId: purchase.id },
          select: { tourId: true },
        }),
      ]);

      if (!access || !plan) {
        await tx.subscriptionPurchase.update({
          where: { id: purchase.id },
          data: {
            status: "FAILED",
            failureReason: "Linked tour access or plan no longer exists",
          },
        });
        return;
      }

      const now = new Date();
      const newExpiresAt = addDays(
        access.expiresAt > now ? access.expiresAt : now,
        plan.durationInDays,
      );

      await tx.tourAccess.update({
        where: { id: access.id },
        data: {
          expiresAt: newExpiresAt,
          maxDevices: Math.max(access.maxDevices, purchase.deviceCount),
          // A phone-only buyer supplied an email at checkout; keep it so their
          // receipts and any later purchase resolve to this same grant.
          ...(access.email ? {} : { email: purchase.email }),
          allowSubscriptionFeatures: true,
          status: "ACTIVE",
          tours: {
            createMany: {
              data: purchaseTours.map((entry) => ({ tourId: entry.tourId })),
              skipDuplicates: true,
            },
          },
        },
      });

      await tx.subscriptionPurchase.update({
        where: { id: purchase.id },
        data: { status: "PAID", paidAt: now },
      });
    });

    await auditService.log({
      module: "subscription-purchase",
      actionType: "PAYMENT",
      entityId: purchase.id,
      newValue: { status: "PAID", stripePaymentIntentId: paymentIntentId },
    });
  },

  async handlePaymentIntentFailed(paymentIntentId: string, reason?: string) {
    const purchase =
      await subscriptionPurchaseRepository.findByStripePaymentIntentId(
        paymentIntentId,
      );

    if (!purchase || purchase.status !== "PENDING") {
      return;
    }

    await subscriptionPurchaseRepository.update(purchase.id, {
      status: "FAILED",
      failureReason: reason ?? "Payment failed",
    });
  },
};
