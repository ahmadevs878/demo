import { clerkClient } from "@clerk/nextjs/server";
import connectDB from "../config/db"; // ⚠️ path check kar lein - jahan bhi aapka db.js hai
import Product from "../models/Product";
import User from "../models/User";
import Address from "../models/address";
import Order from "../models/Order";
import { inngest } from "../config/inngest";
import transporter from "./nodemailer";

// Address ko hamesha DB se poora fetch karo
export async function getFullAddress(address) {
  try {
    const addressId = typeof address === "string" ? address : address._id;
    if (addressId) {
      const dbAddress = await Address.findById(addressId).lean();
      if (dbAddress) return dbAddress;
    }
  } catch (addressError) {
    console.log("Address fetch failed, using payload address instead:", addressError);
  }
  return address;
}

// Amount + productDetails calculate karo (for...of loop wala fix bhi yahan hai)
export async function calculateOrderAmount(items) {
  let amount = 0;
  const productDetails = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    const subtotal = product.offerPrice * item.quantity;
    amount += subtotal;
    productDetails.push({
      name: product.name,
      price: product.offerPrice,
      quantity: item.quantity,
      subtotal,
    });
  }

  const finalAmount = amount + Math.floor(amount * 0.02);
  return { finalAmount, productDetails };
}

// ===== COD FLOW (purana, bilkul waisa hi — koi change nahi) =====
// Order fulfill karo: inngest event + cart clear + owner email
export async function fulfillOrder({ userId, address, items, amount, productDetails, paymentMethod, isPaid, stripeSessionId }) {
  const fullAddress = await getFullAddress(address);

  await inngest.send({
    name: 'order/created',
    data: {
      userId,
      address: fullAddress,
      items,
      amount,
      date: Date.now(),
      paymentMethod,
      isPaid,
      stripeSessionId,
    }
  });

  // cart clear
  const user = await User.findById(userId);
  user.cartItems = {};
  await user.save();

  // customer email/name Clerk se
  let customerEmail = "Not available";
  let customerName = user?.name || "Customer";
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    customerEmail = clerkUser.emailAddresses?.[0]?.emailAddress || "Not available";
  } catch (clerkError) {
    console.log("Clerk user fetch failed:", clerkError);
  }

  // owner ko email
  let emailSent = true;
  try {
    await sendOwnerOrderEmail({ address: fullAddress, productDetails, amount, customerName, customerEmail, paymentMethod });
  } catch (emailError) {
    console.log("Owner email failed:", emailError);
    emailSent = false;
  }

  return { emailSent };
}

// ===== NAYA STRIPE FLOW =====

// Step 1: order/create route se call hoga — turant DB mein "Pending Payment" order bana do
// Sirf order._id metadata mein jayega, 500-char limit ka koi masla nahi hoga
export async function createPendingOrder({ userId, address, items, amount }) {
  await connectDB();

  const order = await Order.create({
    userId,
    items, // [{ product: id, quantity }]
    amount,
    address, // string id (jaisa schema expect karta hai)
    date: Date.now(),
    paymentMethod: "Stripe",
    isPaid: false,
    status: "Pending Payment",
  });

  return order;
}

// Step 2: webhook se call hoga — payment confirm hone ke baad order ko "paid" mark karo
export async function completeOrderPayment({ orderId, stripeSessionId }) {
  await connectDB();

  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error(`Order not found for id: ${orderId}`);
  }

  // agar Stripe dobara wahi webhook bhej de (retry), dobara process na karein
  if (order.isPaid) {
    console.log(`Order ${orderId} already marked as paid — skipping duplicate webhook`);
    return { alreadyProcessed: true, emailSent: false };
  }

  order.isPaid = true;
  order.status = "Order Placed";
  order.stripeSessionId = stripeSessionId;
  await order.save();

  // email ke liye product details aur address dobara nikalo
  const { productDetails } = await calculateOrderAmount(order.items);
  const fullAddress = await getFullAddress(order.address);

  // cart clear
  const user = await User.findById(order.userId);
  if (user) {
    user.cartItems = {};
    await user.save();
  }

  // customer email/name Clerk se
  let customerEmail = "Not available";
  let customerName = user?.name || "Customer";
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(order.userId);
    customerEmail = clerkUser.emailAddresses?.[0]?.emailAddress || "Not available";
  } catch (clerkError) {
    console.log("Clerk user fetch failed:", clerkError);
  }

  // owner ko email
  let emailSent = true;
  try {
    await sendOwnerOrderEmail({
      address: fullAddress,
      productDetails,
      amount: order.amount,
      customerName,
      customerEmail,
      paymentMethod: "Stripe",
    });
  } catch (emailError) {
    console.log("Owner email failed:", emailError);
    emailSent = false;
  }

  return { emailSent };
}

async function sendOwnerOrderEmail({ address, productDetails, amount, customerName, customerEmail, paymentMethod }) {
  const productRows = productDetails
    .map(
      (p) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;">${p.name}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${p.quantity}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">Rs. ${p.price}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">Rs. ${p.subtotal}</td>
      </tr>`
    )
    .join("");

  const phone = address.phoneNumber || address.phone || address.mobile || "Not provided";

  const htmlContent = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;">
    <div style="background:#ea580c;padding:20px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:20px;">🛒 New Order Received</h1>
    </div>

    <div style="padding:20px;background:#f9fafb;">
      <p style="font-size:14px;color:#555;margin:4px 0;">Date: <strong>${new Date().toLocaleString()}</strong></p>
      <p style="font-size:14px;color:#555;margin:4px 0;">Payment: <strong>${paymentMethod === "Stripe" ? "Paid via Stripe ✅" : "Cash on Delivery"}</strong></p>
    </div>

    <div style="padding:20px;">
      <h3 style="color:#333;border-bottom:2px solid #ea580c;padding-bottom:8px;">👤 Customer Details</h3>
      <p style="margin:4px 0;">Name: <strong>${customerName}</strong></p>
      <p style="margin:4px 0;">Email: <strong>${customerEmail}</strong></p>
      <p style="margin:4px 0;">Phone: <strong>${phone}</strong></p>
    </div>

    <div style="padding:20px;">
      <h3 style="color:#333;border-bottom:2px solid #ea580c;padding-bottom:8px;">📍 Delivery Address</h3>
      <p style="margin:4px 0;"><strong>${address.fullName}</strong></p>
      <p style="margin:4px 0;">${address.area}, ${address.city}</p>
      <p style="margin:4px 0;">${address.state} - ${address.pincode}</p>
    </div>

    <div style="padding:20px;">
      <h3 style="color:#333;border-bottom:2px solid #ea580c;padding-bottom:8px;">🧾 Order Items</h3>
      <table style="width:100%;border-collapse:collapse;margin-top:10px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:10px;text-align:left;">Product</th>
            <th style="padding:10px;text-align:center;">Qty</th>
            <th style="padding:10px;text-align:right;">Price</th>
            <th style="padding:10px;text-align:right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${productRows}</tbody>
      </table>

      <div style="text-align:right;margin-top:15px;">
        <p style="font-size:18px;font-weight:bold;color:#ea580c;margin:0;">
          Total: Rs. ${amount}
        </p>
      </div>
    </div>

    <div style="background:#f3f4f6;padding:15px;text-align:center;font-size:12px;color:#888;">
      This is an automated notification from your store's order system.
    </div>
  </div>`;

  await transporter.sendMail({
    from: `"Order System" <${process.env.SMTP_USER}>`,
    to: process.env.OWNER_EMAIL,
    subject: `🛒 New Order - Rs. ${amount}`,
    html: htmlContent,
  });
}