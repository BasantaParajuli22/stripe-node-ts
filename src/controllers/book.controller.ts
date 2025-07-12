import { Request, Response } from "express";
import Book from "../models/Book";
import stripe, { createUsageRecord } from "../utils/stripe";
import User from "../models/User";
import MeteredSubscription from "../models/MeteredSubscription";

// Create book
export async function createBook(req: Request, res: Response): Promise<void>{
  try {
    const { title, description, price, quantity } = req.body;
    const book = new Book({ title, description, price, quantity });
    await book.save();
    res.status(201).json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ success: false, message: "Book creation failed" });
  }
};

// Get all books
export async function getAllBooks(req: Request, res: Response): Promise<void>{
  try {
    const books = await Book.find();
    res.status(200).json({ success: true, data: books });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch books" });
  }
};

//adding metered billing everytime u access book by id
// Get book by ID
export async function getBookById (req: Request, res: Response): Promise<void>{
  try {
    //get userId from jwt and verify id
    const {userId} = req.body;
    const user = await User.findOne({_id: userId});
    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }
    //find book by params id
    const book = await Book.findById(req.params.id);
    if (!book){
      res.status(404).json({ success: false, message: "Book not found" });
      return;
    }

    //to access this api need to have active 
    const sub = await MeteredSubscription.findOne( {userId});
     if (!sub || !sub.subscriptionItemId) {
      res.status(403).json({ success: false, message: "No sub or s" });
      return;
    }
    if ( !["active", "trialing"].includes(sub.status) ){
      res.status(403).json({ success: false, message: "No active or trailing metered subscription" });
      return;
    }

    try {//for recording pf usage 
      const usageRecord = await createUsageRecord(sub.stripeCustomerId);
      // console.log("Usage recorded:", usageRecord.id);
    } catch (error: any) {
      console.error("Failed to record usage:", error.message);
    }

    res.status(200).json({ success: true, data: book });
  } catch (error: any) {
    console.error("Error in getBookById:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch book" });
  }
};
