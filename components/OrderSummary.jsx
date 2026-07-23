"use client";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  MapPin,
  ChevronDown,
  CreditCard,
  Banknote,
  Plus,
  Loader2,
  Mail,
  AlertTriangle,
  CheckCircle2,
  ShoppingCart,
} from "lucide-react";

// Card brand badges — real payment-gateway style (Visa / Mastercard / Amex)
const CardBrandIcons = () => (
  <div className="flex items-center gap-1.5">
    {/* Visa */}
    <svg width="32" height="20" viewBox="0 0 32 20" className="rounded-[3px]">
      <rect width="32" height="20" rx="3" fill="#1A1F71" />
      <text x="16" y="14" textAnchor="middle" fontSize="8.5" fontStyle="italic" fontWeight="700" fill="#fff" fontFamily="Arial, sans-serif">
        VISA
      </text>
    </svg>
    {/* Mastercard */}
    <svg width="32" height="20" viewBox="0 0 32 20" className="rounded-[3px]">
      <rect width="32" height="20" rx="3" fill="#F4F4F4" />
      <circle cx="13" cy="10" r="6" fill="#EB001B" />
      <circle cx="19" cy="10" r="6" fill="#F79E1B" fillOpacity="0.9" />
    </svg>
    {/* Amex */}
    <svg width="32" height="20" viewBox="0 0 32 20" className="rounded-[3px]">
      <rect width="32" height="20" rx="3" fill="#2E77BC" />
      <text x="16" y="13.5" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#fff" fontFamily="Arial, sans-serif">
        AMEX
      </text>
    </svg>
  </div>
);

const OrderSummary = () => {
  const {
    currency,
    router,
    getCartCount,
    getCartAmount,
    getToken,
    user,
    cartItems,
    setCartItems,
  } = useAppContext();

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD"); // naya state - COD ya Stripe

  // Fetch user addresses
  const fetchUserAddresses = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get('/api/user/get-address', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setUserAddresses(data.addresses);
        if (data.addresses.length > 0) {
          setSelectedAddress(data.addresses[0]);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch addresses");
    }
  };

  // Handle address selection
  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
  };

  // Create order
  const createOrder = async () => {
    try {
      setIsLoading(true);

      // Validate address
      if (!selectedAddress) {
        toast.error("Please select a delivery address");
        setIsLoading(false);
        return;
      }

      // Prepare cart items
      let cartItemsArray = Object.keys(cartItems).map((key) => ({
        product: key,
        quantity: cartItems[key]
      }));

      cartItemsArray = cartItemsArray.filter(item => item.quantity > 0);

      if (cartItemsArray.length === 0) {
        toast.error("Your cart is empty");
        setIsLoading(false);
        return;
      }

      const token = await getToken();

      // Show loading toast
      const loadingToast = toast.loading(
        paymentMethod === "Stripe" ? "Redirecting to payment..." : "Placing your order..."
      );

      const { data } = await axios.post('/api/order/create', {
        address: {
          _id: selectedAddress._id,
          fullName: selectedAddress.fullName,
          area: selectedAddress.area,
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
          phone: selectedAddress.phone
        },
        items: cartItemsArray,
        paymentMethod // naya field - COD ya Stripe
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (data.success) {
        // Stripe flow - hosted checkout page pe redirect
        if (paymentMethod === "Stripe" && data.url) {
          window.location.href = data.url;
          return; // yahan se aage kuch execute nahi karna, redirect ho raha hai
        }

        // COD flow - order turant place ho chuka hai
        toast.success("Order placed successfully!");

        // Show email notification status
        if (data.emailSent !== false) {
          toast.success("Order details sent to store owner");
        } else {
          toast.error("Order placed but email notification failed");
        }

        // Clear cart and redirect
        setCartItems({});

        // Small delay before redirect
        setTimeout(() => {
          router.push('/order-placed');
        }, 1500);

      } else {
        toast.error(data.message || "Failed to place order");
      }
    } catch (error) {
      console.error('Order creation error:', error);
      toast.error(error.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals
  const subtotal = getCartAmount();
  const tax = Math.floor(subtotal * 0.02);
  const total = subtotal + tax;

  // Fetch addresses on user login
  useEffect(() => {
    if (user) {
      fetchUserAddresses();
    }
  }, [user]);

  return (
    <div className="w-full md:w-96 bg-gray-50 p-6 rounded-lg shadow-md">
      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">
        Order Summary
      </h2>

      <hr className="border-gray-200 my-4" />

      <div className="space-y-6">
        {/* Address Selection */}
        <div>
          <label className="text-sm font-medium uppercase text-gray-600 mb-2 flex items-center gap-1.5">
            <MapPin size={15} className="text-gray-500" />
            Select Address
          </label>
          <div className="relative">
            <button
              className="w-full text-left px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isLoading}
            >
              <span className="flex items-center justify-between">
                <span className="truncate">
                  {selectedAddress
                    ? `${selectedAddress.fullName}, ${selectedAddress.area}, ${selectedAddress.city}`
                    : userAddresses.length === 0
                      ? "No address found. Add one!"
                      : "Select Address"}
                </span>
                <ChevronDown
                  size={18}
                  className={`text-gray-500 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </span>
            </button>

            {isDropdownOpen && (
              <div className="absolute w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10 max-h-60 overflow-y-auto">
                {userAddresses.length > 0 ? (
                  userAddresses.map((address, index) => (
                    <div
                      key={index}
                      className="px-4 py-3 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                      onClick={() => handleAddressSelect(address)}
                    >
                      <div className="flex items-start space-x-2">
                        <input
                          type="radio"
                          checked={selectedAddress?._id === address._id}
                          onChange={() => handleAddressSelect(address)}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-medium text-gray-800">{address.fullName}</p>
                          <p className="text-sm text-gray-600">{address.area}, {address.city}</p>
                          <p className="text-sm text-gray-600">{address.state} - {address.pincode}</p>
                          <p className="text-sm text-gray-600">{address.phone}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-center text-gray-500">
                    No addresses found
                  </div>
                )}

                <div
                  onClick={() => {
                    setIsDropdownOpen(false);
                    router.push("/add-address");
                  }}
                  className="px-4 py-3 hover:bg-orange-50 cursor-pointer flex items-center justify-center gap-1.5 border-t border-gray-200 text-orange-600 font-medium"
                >
                  <Plus size={16} />
                  Add New Address
                </div>
              </div>
            )}
          </div>
          {!selectedAddress && userAddresses.length > 0 && (
            <p className="text-xs text-red-500 mt-1">Please select an address</p>
          )}
        </div>

        <hr className="border-gray-200 my-4" />

        {/* Payment Method Selection */}
        <div>
          <label className="text-sm font-medium uppercase text-gray-600 mb-2 flex items-center gap-1.5">
            <CreditCard size={15} className="text-gray-500" />
            Payment Method
          </label>
          <div className="space-y-2">
            <label className="flex items-center justify-between gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 transition-all">
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={isLoading}
                />
                <Banknote size={18} className="text-gray-500" />
                <span className="text-gray-700">Cash on Delivery</span>
              </span>
            </label>
            <label className="flex items-center justify-between gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 transition-all">
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Stripe"
                  checked={paymentMethod === "Stripe"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={isLoading}
                />
                <span className="text-gray-700">Pay with Card</span>
              </span>
              <CardBrandIcons />
            </label>
          </div>
        </div>

        <hr className="border-gray-200 my-4" />

        {/* Order Details */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <p className="text-gray-600">Items ({getCartCount()})</p>
            <p className="font-medium text-gray-800">{currency}{subtotal}</p>
          </div>

          <div className="flex justify-between text-sm">
            <p className="text-gray-600">Shipping Fee</p>
            <p className="font-medium text-green-600">Free</p>
          </div>

          <div className="flex justify-between text-sm">
            <p className="text-gray-600">Tax (2%)</p>
            <p className="font-medium text-gray-800">{currency}{tax}</p>
          </div>

          <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
            <p className="text-gray-800">Total</p>
            <p className="text-orange-600">{currency}{total}</p>
          </div>
        </div>
      </div>

      {/* Place Order Button */}
      <button
        onClick={createOrder}
        disabled={isLoading || !selectedAddress || getCartCount() === 0}
        className={`w-full py-3.5 mt-6 rounded-lg text-white font-medium transition-all transform ${
          isLoading || !selectedAddress || getCartCount() === 0
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-orange-600 hover:bg-orange-700 hover:shadow-lg hover:scale-[1.02]'
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            <span>Processing...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            {paymentMethod === "Stripe" ? <CreditCard size={18} /> : <ShoppingCart size={18} />}
            {paymentMethod === "Stripe" ? "Pay & Place Order" : "Place Order"}
          </span>
        )}
      </button>

      {/* Order Summary Footer */}
      {getCartCount() === 0 && (
        <p className="text-center text-sm text-gray-500 mt-3">
          Your cart is empty. Add some items!
        </p>
      )}
    </div>
  );
};

export default OrderSummary;