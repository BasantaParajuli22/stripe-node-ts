import { Request, Response } from "express";
import Book from "../models/Book";
import stripe, { recordUsage } from "../utils/stripe";
import User from "../models/User";
import MeteredSubscription from "../models/MeteredSubscription";
import Subscription from "../models/Subscription";

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

//charge based on usage
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
      res.status(403).json({ success: false, message: "No sub or subscriptionItemId found" });
      return;
    }
    if ( !["active", "trialing"].includes(sub.status) ){
      res.status(403).json({ success: false, message: "No active or trailing metered subscription" });
      return;
    }

    try { 
      // //not recording properly for now??
      //for recording of usage 
      const usageRecord = await recordUsage(sub.stripeCustomerId,);
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


//forusers who has unlock premium
//get content based on premium or not
//if user has pro plan and active status //show premium content
//else free content
export async function getBookContentByBookId(req: Request, res: Response): Promise<void> {
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

  try {
  const sub = await Subscription.findOne( {userId});
  if(sub?.plan === "pro" && sub?.status ==="active"){

    //show premium contents
    //like show full contents //contents with music 
    //show contents early for pro users like 
    //uploaded contents could be viewed instantly no 24 hr delay
    //eg
    // const fullContent = book

    res.status(200).json({
      display: "for pro user full content",
      success: true,
      title: book.title,
      content: book.content //provide full content
    });
  }else{
    //show free contents
    //like show preview only //no music
    //show contents late // put them on timer u can read 1 chapter per hour 
    //or when uploaded if contents uploaded time is less than 24 hr users cant see contents
    //eg
    const previewContent = book.content.substring(0,100);//not full content
    res.status(200).json({
      display: "for basic user preview content",
      success: true,
      title: book.title,
      book: previewContent,
    })
  }
  }catch(error: any){
    res.status(500).json({ message: "Server error" });
  }
}
