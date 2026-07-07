import type { NextRequest } from "next/server";
import { ValidationError } from "@/lib/api/errors";
import { success } from "@/lib/api/response";
import { parseBody, parseParams, parseQuery } from "@/lib/api/validate";
import type { MobileSessionContext } from "@/lib/mobile/require-mobile";
import { getStripeClient } from "@/lib/stripe/client";
import {
  checkoutSchema,
  listSubscriptionPurchasesQuerySchema,
  subscriptionPurchaseIdParamSchema,
} from "./subscription-purchase.schema";
import { subscriptionPurchaseService } from "./subscription-purchase.service";

export const subscriptionPurchaseController = {
  async config() {
    const config = await subscriptionPurchaseService.getMobileConfig();
    return success(config);
  },

  async listForAdmin(req: NextRequest) {
    const query = parseQuery(
      req.nextUrl.searchParams,
      listSubscriptionPurchasesQuerySchema,
    );
    const result = await subscriptionPurchaseService.listForAdmin(query);
    return success(result.data, { meta: result.meta });
  },

  async checkout(req: NextRequest, session: MobileSessionContext) {
    const body = await parseBody(req, checkoutSchema);
    const result = await subscriptionPurchaseService.createCheckout(
      session,
      body,
    );
    return success(result, { status: 201 });
  },

  async status(id: string, session: MobileSessionContext) {
    const purchase = await subscriptionPurchaseService.getStatusForSession(
      id,
      session,
    );
    return success(purchase);
  },

  async webhook(req: NextRequest) {
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

    if (!signature || !webhookSecret) {
      throw new ValidationError("Missing Stripe webhook signature");
    }

    const rawBody = await req.text();
    const stripe = getStripeClient();

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch {
      throw new ValidationError("Invalid Stripe webhook signature");
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        await subscriptionPurchaseService.handlePaymentIntentSucceeded(
          event.data.object.id,
        );
        break;
      }
      case "payment_intent.payment_failed": {
        await subscriptionPurchaseService.handlePaymentIntentFailed(
          event.data.object.id,
          event.data.object.last_payment_error?.message,
        );
        break;
      }
      default:
        break;
    }

    return success({ received: true });
  },

  parseId(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, subscriptionPurchaseIdParamSchema).id;
  },
};
