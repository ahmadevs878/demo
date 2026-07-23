'use client';
import React, { useEffect, useState } from "react";
import { assets, orderDummyData } from "../../assets/assets";
import Image from "next/image";
import { useAppContext } from "../../context/AppContext";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import Loading from "../../components/Loading";
import axios from "axios";
import toast from "react-hot-toast";

const MyOrders = () => {

    const { currency, getToken, user } = useAppContext();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            setLoading(true); // Set loading true at start
            const token = await getToken();
            
            // Check if token exists
            if (!token) {
                setLoading(false);
                toast.error("Please login to view your orders");
                return;
            }
            
            const { data } = await axios.get('/api/order/list', { 
                headers: { Authorization: `Bearer ${token}` } 
            });

            if (data.success) {
                setOrders(data.orders.reverse() || []);
            } else {
                toast.error(data.message || "Failed to fetch orders");
                setOrders([]);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error(error.message || "Failed to fetch orders");
            setOrders([]);
        } finally {
            setLoading(false); // Always set loading to false
        }
    }

    useEffect(() => {
        if (user) {
            fetchOrders();
        } else {
            setLoading(false); // If no user, stop loading
        }
    }, [user]);

    const getImageSrc = (product) => {
        if (!product || !product.image) {
            return null;
        }

        if (Array.isArray(product.image)) {
            return product.image[0] || null;
        }

        return product.image;
    };

    return (
        <>
            <Navbar />
            <div className="flex flex-col justify-between px-4 sm:px-6 md:px-16 lg:px-32 py-6 min-h-screen">
                <div className="space-y-5">
                    <h2 className="text-lg font-medium mt-6">My Orders</h2>
                    {loading ? (
                        <Loading />
                    ) : (
                        <div className="md:p-10 p-2 sm:p-4 space-y-5">
                            <h2 className="text-lg font-medium">Orders</h2>
                            <div className="max-w-4xl rounded-md">
                                {orders.length === 0 ? (
                                    <div className="text-center py-10 text-gray-500">
                                        <p className="text-lg">No orders found</p>
                                        <p className="text-sm mt-2">Your orders will appear here once you place them</p>
                                    </div>
                                ) : (
                                    orders.map((order, index) => {
                                        // saare items ki images nikalo, na sirf pehle wali
                                        const itemImages = (order.items || [])
                                            .map((item) => ({
                                                src: getImageSrc(item.product),
                                                name: item.product?.name || "Product"
                                            }))
                                            .filter((img) => img.src);

                                        return (
                                            <div
                                                key={index}
                                                className="flex flex-col md:flex-row gap-4 md:gap-6 md:justify-between p-4 sm:p-5 border-t border-gray-300 hover:bg-gray-50 transition-colors"
                                            >
                                                {/* Product Info - images stack + names */}
                                                <div className="flex-1 flex items-start gap-3 sm:gap-4 min-w-0 md:min-w-[200px]">
                                                    {itemImages.length > 0 ? (
                                                        <div className="flex -space-x-3 shrink-0">
                                                            {itemImages.slice(0, 4).map((img, i) => (
                                                                <img
                                                                    key={i}
                                                                    className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded border-2 border-white shadow-sm"
                                                                    style={{ zIndex: itemImages.length - i }}
                                                                    src={img.src}
                                                                    alt={img.name}
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = '/fallback-image.png';
                                                                    }}
                                                                />
                                                            ))}
                                                            {itemImages.length > 4 && (
                                                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded border-2 border-white shadow-sm bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                                                    +{itemImages.length - 4}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-200 flex items-center justify-center rounded shrink-0">
                                                            <span className="text-xs text-gray-500">No image</span>
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col gap-1 min-w-0">
                                                        <span className="font-medium text-sm line-clamp-2 break-words">
                                                            {order.items.map((item) => item.product.name + ` x ${item.quantity}`).join(", ")}
                                                        </span>
                                                        <span className="text-xs text-gray-500">Items: {order.items.length}</span>
                                                    </div>
                                                </div>

                                                {/* Address + Amount row on mobile, split columns on desktop */}
                                                <div className="flex flex-row md:contents gap-4">
                                                    {/* Address */}
                                                    <div className="flex-1 md:min-w-[180px]">
                                                        <p className="text-sm leading-relaxed">
                                                            <span className="font-medium">{order.address?.fullName || "N/A"}</span>
                                                            <br />
                                                            <span>{order.address?.area || "N/A"}</span>
                                                            <br />
                                                            <span>{`${order.address?.city || "N/A"}, ${order.address?.state || "N/A"}`}</span>
                                                            <br />
                                                            <span>{order.address?.phoneNumber || "N/A"}</span>
                                                        </p>
                                                    </div>

                                                    {/* Amount */}
                                                    <div className="flex items-start md:items-center min-w-[90px] md:min-w-[100px]">
                                                        <p className="font-medium text-base">{currency}{order.amount || 0}</p>
                                                    </div>
                                                </div>

                                                {/* Order Details */}
                                                <div className="flex flex-col gap-1 md:min-w-[140px]">
                                                    <p className="text-sm">
                                                        <span className="font-medium">Method:</span> {order.paymentMethod || "COD"}
                                                    </p>
                                                    <p className="text-sm">
                                                        <span className="font-medium">Date:</span> {order.date ? new Date(order.date).toLocaleDateString() : "N/A"}
                                                    </p>
                                                    <p className="text-sm">
                                                        <span className="font-medium">Status:</span> 
                                                        <span className={`ml-1 ${
                                                            order.status === 'Delivered' ? 'text-green-600' : 
                                                            order.status === 'Processing' ? 'text-blue-600' : 
                                                            'text-yellow-600'
                                                        }`}>
                                                            {order.status || "Pending"}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default MyOrders;