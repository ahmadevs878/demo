import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import stripe from "../../../../lib/stripe";
import { fulfillOrder, calculateOrderAmount, getFullAddress, createPendingOrder } from "../../../../lib/orderFulfillment";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);

    const { address, items, paymentMethod } = await request.json();
    if (!address || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid data' });
    }

    const { finalAmount, productDetails } = await calculateOrderAmount(items);

    // ===== COD FLOW — bilkul waisa hi, turant fulfill =====
    if (paymentMethod === "COD" || !paymentMethod) {
      const { emailSent } = await fulfillOrder({
        userId,
        address,
        items,
        amount: finalAmount,
        productDetails,
        paymentMethod: "COD",
        isPaid: false,
        stripeSessionId: null,
      });

      return NextResponse.json({ success: true, message: 'Order Placed', emailSent });
    }

    // ===== STRIPE FLOW — naya pending-order approach =====
    if (paymentMethod === "Stripe") {
      const addressId = typeof address === "string" ? address : address._id;
      const origin = request.headers.get("origin");

      // Step 1: DB mein turant ek "Pending Payment" order bana do
      const pendingOrder = await createPendingOrder({
        userId,
        address: addressId,
        items,
        amount: finalAmount,
      });

      const line_items = productDetails.map((p) => ({
        price_data: {
          currency: process.env.NEXT_PUBLIC_CURRENCYS || "usd",
          product_data: { name: p.name },
          unit_amount: Math.round(p.price * 100),
        },
        quantity: p.quantity,
      }));

      const session = await stripe.checkout.sessions.create({
        line_items,
        mode: "payment",
        success_url: `${origin}/order-placed?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/cart`,
        metadata: {
          // Sirf chota orderId jaayega - 500-char metadata limit ka koi masla nahi
          orderId: pendingOrder._id.toString(),
        },
      });

      // Session id order mein save kar do (webhook fallback lookup ke liye)
      pendingOrder.stripeSessionId = session.id;
      await pendingOrder.save();

      return NextResponse.json({ success: true, url: session.url });
    }

    return NextResponse.json({ success: false, message: 'Invalid payment method' });

  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false, message: error.message });
  }
}