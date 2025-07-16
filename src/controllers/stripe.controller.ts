import { Request, Response } from "express";
import stripe from "../utils/stripe";
import * as bookService from "../services/book.service";
import User from "../models/User";
import MeteredSubscription from "../models/MeteredSubscription";
import Subscription from "../models/Subscription";

//for one time checkOut or payment
export async function createCheckoutSession(req: Request, res: Response): Promise<void>{
    const {bookId, quantity, userId} = req.body;
    if( !bookId || typeof bookId !== "string"){
        res.status(404).json({ success: false, message: "bookId is required" }  );
        return;
    }
    if( !quantity || typeof quantity !== "number"){
        res.status(404).json({ success: false, message: "quantity is required and should be number" });
        return;
    }

    //verify userId from jwt and check if exists or not
    const book = await bookService.findBookById(bookId);
    if (!book) {
        res.status(404).json({ success: false, message: "Book not found" });
        return;
    }
    try {
        const createSession = await stripe.checkout.sessions.create({
            mode: "payment",
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        unit_amount: book.price*100, //its in dollars so convert to cents 

                        product_data: {
                            name: book.title,
                            description: book.description,
                        }, 
                    },
                    quantity: quantity, //user req quantity
                },
            ],
            payment_method_types: ['card'],
            automatic_tax: {enabled: false},
            success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`,
            metadata:{  
                bookId: book._id.toString(),
                book_name: book.title,
                userId: userId.toString(),
            }
        })
        res.status(200).json({
            success: true,
            message: "checkout has been success",
            url: createSession.url,
        });
        return;
    } catch (error: any) {
        console.error("Stripe error:", error.message);
        res.status(500).json({
            success: false,
            message: "Checkout creation failed",
            error: error.message,
        });
        return;
    }
}


// 7 days free and then pay monthly to use
//for later
//what if user cancel after 6 days everytime what happens
//what if user pays and pays again does it add up or not?
export async function createSubscription(req: Request, res: Response): Promise<void>{
    const {userId} = req.body;
    //verify if email exists in db or not 
    // const user = await User.findOne({_id: userId});
    // if (!user) {
    //     res.status(404).json({ success: false, message: "user not found" });
    //     return;
    // }
   
    try {
        const createSession = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [
                {
                    price: "price_1RjazyDm76dRJMzfwAujsFn5", //pro sub price from stripe dashboard
                    quantity: 1, //subscription will be
                },
            ],
            payment_method_types: ['card'],
            automatic_tax: {enabled: false},
            success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`, //route for both payment cancel 
            subscription_data: {
                trial_period_days: 7, //trial limit
                metadata: { 
                    plan: "pro",
                    // userId: user._id.toString(),
                     userId: userId.toString(),//for now 
                }, 
            },
        });
        res.status(200).json({
            success: true,
            message: "checkout has been success",
            url: createSession.url,
        });
        return;
    } catch (error: any) {
        console.error("Stripe error:", error.message);
        res.status(500).json({
            success: false,
            message: "subscription creation failed",
            error: error.message,
        });
        return;
    }
}

//another concept
//this concept contradicts above one //use properly
//both uses same Subscription model
//free for all 
//but pay for some features monthly
//same as 7days free trial and pay  but trial has no limit
export async function unlockPremiumFeatures(req: Request, res: Response): Promise<void>{
    const {userId} = req.body;
    //verify if email exists in db or not 
    // const user = await User.findOne({_id: userId});
    // if (!user) {
    //     res.status(404).json({ success: false, message: "user not found" });
    //     return;
    // }
   
    try {
        const createSession = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [
                {
                    price: "price_1RjazyDm76dRJMzfwAujsFn5", //pro sub price from stripe dashboard
                    quantity: 1, //subscription will be
                },
            ],
            payment_method_types: ['card'],
            automatic_tax: {enabled: false},
            success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`, //route for both payment cancel 
            subscription_data: { //no trial limit
                metadata: { 
                    plan: "pro", //for now naming diff plan
                    // userId: user._id.toString(),
                    userId: userId.toString(),//for now 
                }, 
            },
        });
        res.status(200).json({
            success: true,
            message: "checkout has been success",
            url: createSession.url,
        });
        return;
    } catch (error: any) {
        console.error("Stripe error:", error.message);
        res.status(500).json({
            success: false,
            message: "subscription creation failed",
            error: error.message,
        });
        return;
    }
}

// price_1RjssuDm76dRJMzfqeXg6Crm
//for metered based subscription
//pay per unit 
export async function createMeteredBilling(req: Request, res: Response): Promise<void>{
    const {userId} = req.body;//get this from jwt
    const user = await User.findOne({_id: userId});
    if (!user) {
        res.status(404).json({ success: false, message: "user not found" });
        return;
    }
    
    //find existing metered sub // if not found create new one
    let existingSub = await MeteredSubscription.findOne( {userId, status: { $in: ["active", "trialing"]} });
    if (existingSub) { //if already created cannot create new one
        res.status(400).json({
            success: false,
            message: "User already has an active/trialing metered subscription." 
        });
        return;
    }
   
    try {
        //create a stripe customer using loggedin users email
        const customer = await stripe.customers.create({
            email: user.email,
             metadata: {
                userId: userId.toString() // Add userId to customer metadata
            }
        }); //create stripe customer

        //create a stripe.subscriptions with a metered price (billing is based on usage)
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [
                {
                    price: "price_1RjssuDm76dRJMzfqeXg6Crm", //metered price from stripe dashboard
                },
            ],
            payment_behavior: "default_incomplete",
            expand: ["latest_invoice.payment_intent"],
            automatic_tax: {enabled: false},
            metadata: {
                userId: userId.toString(),
                plan: "metered",
            }
        });

        //create a  metered subscription for user
        //this will act as meter
        // const subscriptionItemId = subscription.items.data[0].id;
        const sub = await MeteredSubscription.create({
            userId: subscription.metadata?.userId,
            stripeCustomerId: customer.id,
            subscriptionId: subscription.id,
            subscriptionItemId: subscription.items.data[0].id,
            status: subscription.status,
            usageUnit: "chapter",
            currentUsage: 0
        })    

        //create a stripe.checkout.sessions so the user can complete payment setup details
        //in webhook this will be  case "customer.subscription.created": 
        const createSession = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer: customer.id,
            line_items: [
                {
                    price: "price_1RjssuDm76dRJMzfqeXg6Crm", //metered price from stripe dashboard
                },  //quantity is set stripe usage_records itself
            ],
            payment_method_types: ['card'],
            automatic_tax: {enabled: false},
            success_url: `${process.env.FRONTEND_URL}/dashboard`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`, //route for both payment cancel 
            metadata: {
                plan: "metered",
                userId: userId.toString(),
            },  //add meta data to know which sub plan is this 
        });

        res.status(200).json({
            success: true,
            message: "checkout has been success",
            url: createSession.url,
        });
        return;
    } catch (error: any) {
        console.error("Stripe error:", error.message);
        res.status(500).json({
            success: false,
            message: "subscription creation failed",
            error: error.message,
        });
        return;
    }
}