import Stripe from "stripe";

// Single shared Stripe instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default stripe;