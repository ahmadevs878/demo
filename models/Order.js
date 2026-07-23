import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId:{type:String,required:true,ref:'user'},
    items:[{
        product:{type:String, required: true, ref:'product'},
        quantity:{type:Number, required: true},
    }],
    amount: {type: Number, required:true},
    address: {type: String,ref:'address', required:true},
    status: {type: String, required:true , default:'Order Placed'},
    date:{type:Number, required:true},
    // ===== Naye Stripe-related fields =====
    paymentMethod: {type: String, required:true, default:'COD'}, // 'COD' ya 'Stripe'
    isPaid: {type: Boolean, required:true, default:false},
    stripeSessionId: {type: String}, // webhook mein session dhoondne ke liye
})

const Order = mongoose.models.order || mongoose.model('order', orderSchema)

export default Order