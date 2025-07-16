import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // apiVersion: "2024-06-20", 
});

//for usaged based billing read docs
// https://docs.stripe.com/billing/subscriptions/usage-based/implementation-guide?dashboard-or-api=api


// create a meter to track all api requests 
//and we use meter to sum all usaged evernts to bill 
export async function meterCreate(stripeCustomerId: string) {
  const meter = await stripe.billing.meters.create({
    display_name: 'api_requests ',
    event_name: 'api_requests',
    default_aggregation: {
      formula: 'sum',
    },
    customer_mapping: {
      event_payload_key: stripeCustomerId,
      type: 'by_id',
    },
    value_settings: {
      event_payload_key: "value",
    },
  });
  return meter;
}

//create a pricing model
//1 dollar per 100 units 
export async function createPrices() {
  const price = await stripe.prices.create({
    currency: 'usd',
    unit_amount: 1,
    billing_scheme: 'per_unit',
    transform_quantity: {
      divide_by: 100,
      round: 'up',
    },
    recurring: {
      usage_type: 'metered',
      interval: 'month',
      meter: '{{METER_ID}}', //get meter and then meter.id
    },
    product_data: {
      name: 'api requests',
    },
  });
  return price;
}

//create customer
export async function createCustomer(name: string) {
  const customer = await stripe.customers.create({
    name: name,
  });
}

//create a sub using the cusomerId 
export async function createSubscription(customerId: string) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [
      { //get price from above from or stripe dashboard
        price: 'Price_xxxxxxxxxxxxxx',
      },
    ],
  });
}

//for testing customers usaged based bill by sending a meter event  
export async function recordUsage(stripeCustomerId: string){
  const meterEvent = await stripe.billing.meterEvents.create({
    event_name: 'api_requests',
    payload: {
      stripe_customer_id: stripeCustomerId,
      value: "1",
    },
  });
}

export async function previewInvoice(stripeCustomerId: string){
  const invoice = await stripe.invoices.createPreview({
    subscription: stripeCustomerId,
  });
}

export default stripe;