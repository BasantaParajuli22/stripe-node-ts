import mongoose from "mongoose";

export interface IOrder extends mongoose.Document {
  _id: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId;
  bookId: mongoose.Types.ObjectId;
  stripeSessionId: string;
  paymentIntentId?: string;
  customerEmail?: string;
  amountTotal: number;
  paid?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new mongoose.Schema<IOrder>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    stripeSessionId: { type: String, required: true },
    paymentIntentId: { type: String},
    customerEmail: { type: String},
    amountTotal: { type: Number, required: true },
    paid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Order =  mongoose.model<IOrder>("Order", OrderSchema);
export default Order;