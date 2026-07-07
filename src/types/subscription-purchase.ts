export type SubscriptionPurchaseStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type SubscriptionPurchase = {
  id: string;
  email: string;
  plan: { id: string; name: string; durationInDays: number };
  deviceCount: number;
  basePriceAtPurchase: number;
  deviceSurchargeAtPurchase: number;
  discountPercentAtPurchase: number;
  totalAmount: number;
  currency: string;
  status: SubscriptionPurchaseStatus;
  tourAccessId: string | null;
  tours: { id: string; slug: string }[];
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};
