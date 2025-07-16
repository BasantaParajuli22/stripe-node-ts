import mongoose from "mongoose";

//for 7 days free then monthly subscription 
export interface ISubscription extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  stripeCustomerId: string;
  subscriptionId: string;
  status: "active" | "trialing" | "canceled";  // "active", "trialing", "canceled"
  plan: "basic" | "pro";                       // "pro", "basic"
  trialEndsAt?: Date;     //when does users free trial ends
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new mongoose.Schema<ISubscription>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    stripeCustomerId: { type: String, required: true },
    subscriptionId: { type: String, required: true, unique: true },
    status: { type: String, enum:["active", "trialing", "canceled"], required: true },
    plan: { type: String, enum: ["basic", "pro"], default: "basic" },
    trialEndsAt: { type: Date, required: false}, //not required for now bcz user upgrade or unlock to pro instant 
  },

  { timestamps: true }
);

const Subscription = mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
export default Subscription;