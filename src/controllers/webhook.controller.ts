import { Request, Response } from "express";
import Stripe from "stripe";
import stripe from "../utils/stripe";
import Order from "../models/Orders";
import Subscription from "../models/Subscription";
import MeteredSubscription from "../models/MeteredSubscription";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

// This must be raw body middleware
export async function handleStripeWebhook(req: Request, res: Response): Promise<void>{
  
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle event
  //there are other events that may occured 
  //handle accordingly 
  switch (event.type) {

    //this is for when something is purchased
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;

      // You can access metadata here if passed during session creation
      //  Store session ID, email, or reduce book quantity here
      // (Use session.client_reference_id or metadata.bookId if passed)
      let bookId = session.metadata?.bookId as string;
      const userId = session.metadata?.userId as string;
      console.log(" Payment successful session id :", session.id);
      console.log(" Payment successful meta data bookId:", bookId);

      if(bookId && userId){ //this is for one time purchased where we buy book by user
        await createOrder(userId, bookId, session);
      }//when creating metered sub //no book here //user buys but not book 
      await createOrder(userId, bookId = "metered", session);

      break;


    //for monthly subscription
    case "customer.subscription.created":
      const subscription = event.data.object as Stripe.Subscription;
      console.log("Subscription created");
      console.log("Plan:", subscription.metadata?.plan);
      console.log("Customer:", subscription.customer);

      if (subscription.metadata?.plan === "metered") {
        // await saveMeteredSubscriptionToDB(subscription); already created in controller only update now
        await updateMeteredSubscriptionToDB(subscription.id, subscription.status);
      }else{
        //this is also monthly sub but fixed charge
        await saveSubscriptionToDB(subscription);
      }
      break;


    case "invoice.paid":
      const paidInvoice = event.data.object as Stripe.Invoice;
      console.log("Subscription invoice paid");

      if ("subscription" in paidInvoice && paidInvoice.subscription) {

        const subId = paidInvoice.subscription.toString();
        const meteredSub = await MeteredSubscription.findOne( {subId});

        if(meteredSub){//if it is in metered sub then update accordingly
          await updateMeteredSubscriptionToDB(subId , "active");
        }else{
          await updateSubscriptionToDB(subId , "active");
        }
      
      } else {    
        console.warn("Invoice paid but has no subscription attached.");
      }
      break;

    case "invoice.payment_failed":
      const failedInvoice = event.data.object as Stripe.Invoice;
      console.log("Subscription invoice paid");

      if ("subscription" in failedInvoice && failedInvoice.subscription) {

        const subId = failedInvoice.subscription.toString();
        const meteredSub = await MeteredSubscription.findOne( {subId});

        if(meteredSub){//if it is in metered sub then update accordingly
          await updateMeteredSubscriptionToDB(subId , "canceled");
        }else{
          await updateSubscriptionToDB(subId , "canceled");
        } 
        
      }       
      console.warn("Invoice failed ");

      break;

    //create for other events too
  default:
    console.log(`Unhandled event type ${event.type}`);
  }
  res.status(200).send("Received");
};



//to create order after purchased and payment is made
async function createOrder(userId: string, bookId: string, session: Stripe.Checkout.Session  ){
    const existing = await Order.findOne({ session_id: session.id });
    if (existing) {
      console.log("Duplicate session, skipping order save.");
      return;
    }
   try {
    await Order.create({
        userId: userId,
        bookId: bookId,
        stripeSessionId: session.id,
        paymentIntentId: session.payment_intent,
        customerEmail: session.customer_email || "not provided",
        amountTotal: session.amount_total || 0,
        paid: session.payment_status === 'paid' ? true : false,
      });
    console.log("Order saved to DB");
  } catch (err: any) {
    console.error("Failed to save order:", err.message);
  }
}

//store subscription info 
async function saveSubscriptionToDB(subscription: Stripe.Subscription){
  try {
    //create sub 
    await Subscription.create({
      userId: subscription.metadata?.userId,
      stripeCustomerId: subscription.customer,    
      subscriptionId: subscription.id,
      status: subscription.status,
      plan: subscription.metadata?.plan || "basic",
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined
    });

    console.log("Subscription saved to DB");
  } catch (err: any) {
    console.error("Failed to save subscription:", err.message);
  }
}

//update subscription info 
async function updateSubscriptionToDB(subscriptionId: string, status: string) {
  try {
    await Subscription.findOneAndUpdate(
      { subscriptionId: subscriptionId  },
      { status: status },
      { new: true }
    );
    console.log("Subscription updated in DB");
  } catch (err: any) {
    console.error("Failed to update subscription:", err.message);
  }
}


//for metered sub
//store subscription info 
// async function saveMeteredSubscriptionToDB(subscription: Stripe.Subscription){
//   try {

//     // Extract the subscription item ID from the first item
//     await MeteredSubscription.create({
//       userId: subscription.metadata?.userId,
//       stripeCustomerId: subscription.customer,    
//       subscriptionId: subscription.id,
//       subscriptionItemId: subscription.items.data[0].id,
//       status: subscription.status,
//       plan: subscription.metadata?.plan || "metered",
//       usageUnit: "chapter",
//       currentUsage: 0, //first initialize
//     });

//     console.log("Subscription saved to DB");
//   } catch (err: any) {
//     console.error("Failed to save subscription:", err.message);
//   }
// }

// Also add update function for metered subscriptions
async function updateMeteredSubscriptionToDB(subscriptionId: string, status: string) {
  try {
    await MeteredSubscription.findOneAndUpdate(
      { subscriptionId: subscriptionId },
      { status: status },
      { new: true }
    );
    console.log("Metered Subscription updated in DB");
  } catch (err: any) {
    console.error("Failed to update metered subscription:", err.message);
  }
}