'use client';
import React, { useEffect, useState } from "react";
import { useAppContext } from "../../../context/AppContext";
import Footer from "../../../components/seller/Footer";
import Loading from "../../../components/Loading";
import axios from "axios";
import toast from "react-hot-toast";
import { Package, IndianRupee, Clock, CheckCircle2, RefreshCw } from "lucide-react";

// naya helper - price ko comma format mein dikhane ke liye (e.g. 12,499)
const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN").format(price || 0);
};

const Orders = () => {

    const { currency, getToken, user } = useAppContext();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSellerOrders = async (isAutoRefresh = false) => {
        try {
            if (isAutoRefresh) setRefreshing(true);

            const token = await getToken()
            const { data } = await axios.get('/api/order/seller-orders', { headers: { Authorization: `Bearer ${token}` } })

            if (data.success) {
                setOrders(data.orders)
                setLoading(false)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            if (isAutoRefresh) setRefreshing(false);
        }
    }

    useEffect(() => {
        if (user) {
            fetchSellerOrders();
        }
    }, [user]);

    // real-time stats ke liye har 30 second baad orders refresh honge, bina loading spinner dikhaye
    useEffect(() => {
        if (!user) return;

        const interval = setInterval(() => {
            fetchSellerOrders(true);
        }, 30000); // 30 sec

        return () => clearInterval(interval);
    }, [user]);

    // Helper function to get image src safely (kisi bhi product se)
    const getImageSrc = (product) => {
        if (!product || !product.image) {
            return null;
        }

        if (Array.isArray(product.image)) {
            return product.image[0] || null;
        }

        return product.image;
    };

    // stats nikalne ke liye orders se calculation
    const stats = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + (order.amount || 0), 0),
        paidOrders: orders.filter((order) => order.isPaid).length,
        pendingOrders: orders.filter((order) => !order.isPaid).length,
    };

    const statCards = [
        {
            label: "Total Orders",
            value: stats.totalOrders,
            icon: Package,
            bg: "bg-blue-50",
            iconColor: "text-blue-600",
        },
        {
            label: "Total Revenue",
            value: `${currency}${formatPrice(stats.totalRevenue)}`,
            icon: IndianRupee,
            bg: "bg-green-50",
            iconColor: "text-green-600",
        },
        {
            label: "Paid Orders",
            value: stats.paidOrders,
            icon: CheckCircle2,
            bg: "bg-emerald-50",
            iconColor: "text-emerald-600",
        },
        {
            label: "Pending Orders",
            value: stats.pendingOrders,
            icon: Clock,
            bg: "bg-amber-50",
            iconColor: "text-amber-600",
        },
    ];

    return (
        <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm">
            {loading ? <Loading /> : (
                <div className="md:p-10 p-4 space-y-6">

                    {/* Header + refresh indicator */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium">Orders</h2>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <RefreshCw
                                size={13}
                                className={refreshing ? "animate-spin" : ""}
                            />
                            <span>{refreshing ? "Updating..." : "Live"}</span>
                        </div>
                    </div>

                    {/* Real-time stats cards - mobile pe 2 columns, desktop pe 4 */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {statCards.map((card, idx) => {
                            const Icon = card.icon;
                            return (
                                <div
                                    key={idx}
                                    className="flex items-center gap-3 p-3 sm:p-4 rounded-lg border border-gray-200 bg-white"
                                >
                                    <div className={`p-2 sm:p-2.5 rounded-lg ${card.bg}`}>
                                        <Icon size={18} className={card.iconColor} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[11px] sm:text-xs text-gray-500 truncate">
                                            {card.label}
                                        </span>
                                        <span className="text-sm sm:text-lg font-semibold text-gray-800 truncate">
                                            {card.value}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Orders list */}
                    <div className="rounded-md border border-gray-200 divide-y divide-gray-200 bg-white">
                        {orders.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                Abhi tak koi order nahi aaya
                            </div>
                        )}

                        {orders.map((order, index) => {
                            // ab sirf pehli image nahi, har item ki image alag se dikhengi
                            const itemImages = (order.items || []).map((item) => ({
                                src: getImageSrc(item.product),
                                name: item.product?.name || "Product",
                                quantity: item.quantity,
                            }));

                            const maxVisible = 4; // itni images dikhengi, baaki "+N" mein
                            const visibleImages = itemImages.slice(0, maxVisible);
                            const extraCount = itemImages.length - maxVisible;

                            return (
                                <div
                                    key={index}
                                    className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:items-center p-4 sm:p-5 hover:bg-gray-50 transition-colors"
                                >
                                    {/* Product Info - images + names */}
                                    <div className="flex-1 flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                                        {/* image stack - har item ki apni image */}
                                        <div className="flex -space-x-3 shrink-0">
                                            {visibleImages.map((img, i) =>
                                                img.src ? (
                                                    <img
                                                        key={i}
                                                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-md border-2 border-white shadow-sm bg-white"
                                                        src={img.src}
                                                        alt={img.name}
                                                        title={`${img.name} x ${img.quantity}`}
                                                    />
                                                ) : (
                                                    <div
                                                        key={i}
                                                        className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 flex items-center justify-center rounded-md border-2 border-white shrink-0"
                                                    >
                                                        <span className="text-[9px] sm:text-[10px] text-gray-500">No image</span>
                                                    </div>
                                                )
                                            )}
                                            {extraCount > 0 && (
                                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-md border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
                                                    +{extraCount}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1 min-w-0">
                                            <span className="font-medium text-sm line-clamp-2 break-words">
                                                {order.items.map((item) => item.product.name + ` x ${item.quantity}`).join(", ")}
                                            </span>
                                            <span className="text-xs text-gray-500">Items: {order.items.length}</span>
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm leading-relaxed break-words">
                                            <span className="font-medium">{order.address.fullName}</span>
                                            <br />
                                            <span>{order.address.area}</span>
                                            <br />
                                            <span>{`${order.address.city}, ${order.address.state}`}</span>
                                            <br />
                                            <span>{order.address.phoneNumber}</span>
                                        </p>
                                    </div>

                                    {/* Amount + Order details - mobile pe side by side, desktop pe alag columns */}
                                    <div className="flex flex-row lg:flex-row items-center justify-between lg:justify-start gap-4 lg:gap-6 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                                        <p className="font-semibold text-base text-gray-800">
                                            {currency}{formatPrice(order.amount)}
                                        </p>

                                        <div className="flex flex-col gap-0.5 text-right lg:text-left">
                                            <p className="text-sm">
                                                <span className="font-medium">Method:</span>{" "}
                                                {order.paymentMethod || "COD"}
                                            </p>
                                            <p className="text-sm">
                                                <span className="font-medium">Date:</span>{" "}
                                                {new Date(order.date).toLocaleDateString()}
                                            </p>
                                            <p className="text-sm flex items-center gap-1 justify-end lg:justify-start">
                                                <span className="font-medium">Payment:</span>{" "}
                                                {order.isPaid ? (
                                                    <span className="text-green-600 font-medium">Paid</span>
                                                ) : (
                                                    <span className="text-amber-600 font-medium">Pending</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};

export default Orders;