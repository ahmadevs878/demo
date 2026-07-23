import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "../../../../config/db";
import Product from "../../../../models/Product";
import authSeller from "../../../../lib/authSeller";

export async function DELETE(request) {
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
        
        // Get ID from query params
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Product ID is required' },
                { status: 400 }
            );
        }

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