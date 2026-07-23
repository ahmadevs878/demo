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

const statusColor = (status) => {
    if (status === 'Delivered') return 'bg-green-50 text-green-600';
    if (status === 'Processing') return 'bg-blue-50 text-blue-600';
    return 'bg-yellow-50 text-yellow-700';
};

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

    // ek order ke saare items ki images + names nikalne wala helper
    const getItemImages = (order) => {
        return (order.items || [])
            .map((item) => ({
                src: getImageSrc(item.product),
                name: item.product?.name || "Product"
            }))
            .filter((img) => img.src);
    };

    const ImageStack = ({ images, size = "w-14 h-14" }) => {
        if (images.length === 0) {
            return (
                <div className={`${size} bg-gray-100 flex items-center justify-center rounded-lg shrink-0`}>
                    <span className="text-[10px] text-gray-400">No image</span>
                </div>
            );
        }
        return (
            <div className="flex -space-x-3 shrink-0">
                {images.slice(0, 3).map((img, i) => (
                    <img
                        key={i}
                        className={`${size} object-cover rounded-lg border-2 border-white shadow-sm bg-gray-50`}
                        style={{ zIndex: images.length - i }}
                        src={img.src}
                        alt={img.name}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/fallback-image.png';
                        }}
                    />
                ))}
                {images.length > 3 && (
                    <div className={`${size} rounded-lg border-2 border-white shadow-sm bg-gray-800 text-white flex items-center justify-center text-[11px] font-medium`}>
                        +{images.length - 3}
                    </div>
                )}
            </div>
        );
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
                        <div className="pt-4 pb-10 sm:p-6 md:p-10 space-y-5">
                            <h2 className="text-lg font-medium">Orders</h2>

                            {orders.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">
                                    <p className="text-lg">No orders found</p>
                                    <p className="text-sm mt-2">Your orders will appear here once you place them</p>
                                </div>
                            ) : (
                                <div className="max-w-4xl">

                                    {/* ===== DESKTOP / TABLET: table-style rows ===== */}
                                    <div className="hidden md:block rounded-md border border-gray-200 overflow-hidden">
                                        <div className="grid grid-cols-[2.2fr_1.4fr_0.8fr_1fr] gap-4 px-5 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            <span>Product</span>
                                            <span>Shipping Address</span>
                                            <span>Amount</span>
                                            <span>Order Info</span>
                                        </div>
                                        {orders.map((order, index) => {
                                            const itemImages = getItemImages(order);
                                            return (
                                                <div
                                                    key={index}
                                                    className="grid grid-cols-[2.2fr_1.4fr_0.8fr_1fr] gap-4 px-5 py-5 border-t border-gray-200 hover:bg-gray-50 transition-colors"
                                                >
                                                    {/* Product */}
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <ImageStack images={itemImages} size="w-16 h-16" />
                                                        <div className="flex flex-col gap-1 min-w-0">
                                                            <span className="font-medium text-sm line-clamp-2 break-words">
                                                                {order.items.map((item) => item.product.name + ` x ${item.quantity}`).join(", ")}
                                                            </span>
                                                            <span className="text-xs text-gray-500">Items: {order.items.length}</span>
                                                        </div>
                                                    </div>

                                                    {/* Address */}
                                                    <p className="text-sm leading-relaxed text-gray-700">
                                                        <span className="font-medium text-gray-900">{order.address?.fullName || "N/A"}</span>
                                                        <br />
                                                        <span>{order.address?.area || "N/A"}</span>
                                                        <br />
                                                        <span>{`${order.address?.city || "N/A"}, ${order.address?.state || "N/A"}`}</span>
                                                        <br />
                                                        <span>{order.address?.phoneNumber || "N/A"}</span>
                                                    </p>

                                                    {/* Amount */}
                                                    <p className="font-medium text-sm self-start">{currency}{order.amount || 0}</p>

                                                    {/* Order Info */}
                                                    <div className="flex flex-col gap-1.5 text-sm">
                                                        <span className="text-gray-700">{order.paymentMethod || "COD"}</span>
                                                        <span className="text-gray-500 text-xs">
                                                            {order.date ? new Date(order.date).toLocaleDateString() : "N/A"}
                                                        </span>
                                                        <span className={`inline-block w-fit px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(order.status)}`}>
                                                            {order.status || "Pending"}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* ===== MOBILE: stacked cards ===== */}
                                    <div className="md:hidden space-y-3">
                                        {orders.map((order, index) => {
                                            const itemImages = getItemImages(order);
                                            return (
                                                <div
                                                    key={index}
                                                    className="rounded-xl border border-gray-200 p-4 space-y-3 bg-white shadow-sm"
                                                >
                                                    {/* Top: images + product names + status */}
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-start gap-3 min-w-0">
                                                            <ImageStack images={itemImages} size="w-12 h-12" />
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-sm line-clamp-2 break-words">
                                                                    {order.items.map((item) => item.product.name + ` x ${item.quantity}`).join(", ")}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-0.5">{order.items.length} item{order.items.length > 1 ? "s" : ""}</p>
                                                            </div>
                                                        </div>
                                                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium ${statusColor(order.status)}`}>
                                                            {order.status || "Pending"}
                                                        </span>
                                                    </div>

                                                    {/* Divider */}
                                                    <div className="border-t border-gray-100" />

                                                    {/* Address */}
                                                    <p className="text-xs text-gray-600 leading-relaxed">
                                                        <span className="font-medium text-gray-800">{order.address?.fullName || "N/A"}</span>
                                                        {" • "}
                                                        {order.address?.area || "N/A"}, {order.address?.city || "N/A"}, {order.address?.state || "N/A"}
                                                        <br />
                                                        {order.address?.phoneNumber || "N/A"}
                                                    </p>

                                                    {/* Bottom row: amount, method, date */}
                                                    <div className="flex items-center justify-between pt-1 text-xs text-gray-600">
                                                        <span>{order.paymentMethod || "COD"}</span>
                                                        <span>{order.date ? new Date(order.date).toLocaleDateString() : "N/A"}</span>
                                                        <span className="font-semibold text-sm text-gray-900">{currency}{order.amount || 0}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default MyOrders;