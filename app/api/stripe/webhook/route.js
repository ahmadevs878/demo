import { NextResponse } from "next/server";
import stripe from "../../../../lib/stripe";
import { completeOrderPayment } from "../../../../lib/orderFulfillment";

export async function POST(request) {
  const body = await request.text(); // raw body zaroori hai
  const signature = request.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.log("Webhook signature error:", error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      console.log("Webhook: orderId missing in session metadata");
      return NextResponse.json({ received: true });
    }

    try {
      await completeOrderPayment({ orderId, stripeSessionId: session.id });
    } catch (error) {
      // Order na milne par ya koi aur issue par Stripe ko 200 hi bhejte hain
      // taake wo infinite retry na kare — lekin log zaroor rakhte hain
      console.log("Order completion failed:", error.message);
    }
  }

  return NextResponse.json({ received: true });
}