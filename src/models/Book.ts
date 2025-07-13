import mongoose from "mongoose";

export interface IBook extends mongoose.Document {
  _id: mongoose.Types.ObjectId,
  title: string;
  description: string;
  content: string;
  price: number;
  quantity: number;
}

const BookSchema = new mongoose.Schema<IBook>({
  title: { type: String, required: true },
  description: { type: String, default:"not provided" },
  content: { type: String, default:"not provided" },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
});

const Book = mongoose.model<IBook>("Book", BookSchema);
export default Book;
