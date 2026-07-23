// app/api/product/[id]/route.js
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "../../../../config/db";
import Product from "../../../../models/Product";
import authSeller from "../../../../lib/authSeller";

export async function DELETE(request, { params }) {
    try {
        const { userId } = getAuth(request);
        const isSeller = await authSeller(userId);
        
        if (!isSeller) {
            return NextResponse.json(
                { success: false, message: 'Not authorized' },
                { status: 401 }
            );
        }

        await connectDB();
        
        // For Next.js 13+ App Router, you might need to await params
        const { id } = await params;
        
        // Or if params is not a Promise:
        // const { id } = params;
        
        console.log("Deleting product ID:", id); // Debug log
        
        const product = await Product.findById(id);
        
        if (!product) {
            return NextResponse.json(
                { success: false, message: 'Product not found' },
                { status: 404 }
            );
        }

        await Product.findByIdAndDelete(id);

        return NextResponse.json(
            { success: true, message: 'Product deleted successfully' },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}