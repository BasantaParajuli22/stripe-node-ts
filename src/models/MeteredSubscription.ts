import mongoose from "mongoose";

export interface IMeteredSubscription extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  stripeCustomerId: string;
  subscriptionId: string;
  subscriptionItemId: string;
  status: "active" | "trialing" | "canceled";
  usageUnit: string; // "chapter", "page", etc.
  currentUsage: number;
  createdAt: Date;
  updatedAt: Date;
}

const MeteredSubscriptionSchema = new mongoose.Schema<IMeteredSubscription>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    stripeCustomerId: { type: String, required: true },
    subscriptionId: { type: String, required: true },
    subscriptionItemId: { type: String, required: true },
    status: { type: String, enum:["active", "trialing", "canceled"], required: true },
    usageUnit: { type: String, required: true },
    currentUsage: { type: Number, required: true },
  },
  { timestamps: true }
);

const MeteredSubscription = mongoose.model<IMeteredSubscription>("MeteredSubscription", MeteredSubscriptionSchema);
export default MeteredSubscription;