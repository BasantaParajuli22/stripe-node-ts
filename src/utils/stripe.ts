import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // apiVersion: "2024-06-20", 
});


//for creating metered bill for use of api
// Set your secret key. Remember to switch to your live secret key in production.
// // See your keys here: https://dashboard.stripe.com/apikeys
export async function createUsageRecord(stripeCustomerId: string){
  const meterEvent = await stripe.billing.meterEvents.create({
    event_name: 'api_requests',
    payload: {
      stripe_customer_id: stripeCustomerId,
      value: "1",
    },
  });
}

export default stripe;