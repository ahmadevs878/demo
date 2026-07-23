'use client'
import React from "react";
import { assets } from "../../assets/assets";
import OrderSummary from "../../components/OrderSummary";
import Image from "next/image";
import Navbar from "../../components/Navbar";
import { useAppContext } from "../../context/AppContext";

// naya helper - number ko comma format mein dikhata hai (e.g. 20000 -> 20,000)
const formatPrice = (num) => Number(num).toLocaleString('en-US');

// Quantity stepper - card aur table dono mein reuse hoga
const QuantityStepper = ({ product, cartItems, updateCartQuantity, addToCart }) => (
  <div className="flex items-center gap-1 border border-gray-300 rounded-lg overflow-hidden w-fit">
    <button
      onClick={() => updateCartQuantity(product._id, cartItems[product._id] - 1)}
      className="px-3 py-1.5 hover:bg-gray-100 transition-colors border-r border-gray-300"
    >
      <span className="text-lg font-medium text-gray-600">−</span>
    </button>
    <input
      onChange={e => updateCartQuantity(product._id, Number(e.target.value))}
      type="number"
      value={cartItems[product._id]}
      className="w-12 text-center border-0 outline-none py-1.5 text-gray-700 font-medium"
    />
    <button
      onClick={() => addToCart(product._id)}
      className="px-3 py-1.5 hover:bg-gray-100 transition-colors border-l border-gray-300"
    >
      <span className="text-lg font-medium text-gray-600">+</span>
    </button>
  </div>
);

const Cart = () => {

  const { products, router, cartItems, addToCart, updateCartQuantity, getCartCount } = useAppContext();

  // ek jagah cart products nikal liye - card aur table dono is say render honge, duplicate logic nahi
  const cartProducts = Object.keys(cartItems)
    .map((itemId) => ({ itemId, product: products.find(p => p._id === itemId) }))
    .filter(({ product, itemId }) => product && cartItems[itemId] > 0);

  return (
    <>
      <Navbar />
      <div className="flex flex-col md:flex-row gap-10 px-4 sm:px-6 md:px-16 lg:px-32 pt-14 mb-20">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-8 border-b border-gray-500/30 pb-6">
            <p className="text-2xl md:text-3xl text-gray-500">
              Your <span className="font-medium text-orange-600">Cart</span>
            </p>
            <p className="text-lg md:text-xl text-gray-500/80">{getCartCount()} Items</p>
          </div>

          {/* MOBILE / TABLET: card layout - md say chota screen par yeh dikhega, table nahi (alignment issues say bachne ke liye) */}
          <div className="flex flex-col gap-4 md:hidden">
            {cartProducts.map(({ itemId, product }) => (
              <div key={itemId} className="flex gap-3 border border-gray-200 rounded-lg p-3">
                <div className="rounded-lg overflow-hidden bg-gray-500/10 p-2 flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 shrink-0">
                  <img
                    src={product.image[0]}
                    alt={product.name}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </div>
                <div className="flex flex-col justify-between flex-1 min-w-0">
                  <div>
                    <p className="text-gray-800 text-sm font-medium truncate">{product.name}</p>
                    <p className="text-gray-600 text-sm mt-0.5">Rs {formatPrice(product.offerPrice)} PKR</p>
                  </div>
                  <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                    <QuantityStepper product={product} cartItems={cartItems} updateCartQuantity={updateCartQuantity} addToCart={addToCart} />
                    <p className="text-gray-800 text-sm font-medium">
                      Rs {formatPrice(product.offerPrice * cartItems[itemId])} PKR
                    </p>
                  </div>
                  <button
                    className="text-xs text-orange-600 mt-2 text-left"
                    onClick={() => updateCartQuantity(product._id, 0)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP: table layout - md aur usse bara screen par */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="text-left">
                <tr>
                  <th className="text-nowrap pb-6 px-4 text-gray-600 font-medium">
                    Product Details
                  </th>
                  <th className="pb-6 px-4 text-gray-600 font-medium text-nowrap">
                    Price
                  </th>
                  <th className="pb-6 px-4 text-gray-600 font-medium text-nowrap">
                    Quantity
                  </th>
                  <th className="pb-6 px-4 text-gray-600 font-medium text-nowrap">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {cartProducts.map(({ itemId, product }) => (
                  <tr key={itemId}>
                    <td >
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg overflow-hidden  p-2 flex items-center justify-center w-24 h-24 shrink-0">
                          <img
                            src={product.image[0]}
                            alt={product.name}
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                        </div>
                        <div className="text-sm  " >
                          <p
                            className="text-gray-800 leading-5 h-10 w-[100px] overflow-hidden"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {product.name}
                          </p>
                          <button
                            className="text-xs text-orange-600 mt-1"
                            onClick={() => updateCartQuantity(product._id, 0)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600 whitespace-nowrap">Rs {formatPrice(product.offerPrice)} PKR</td>
                    <td className="py-4 px-4">
                      <QuantityStepper product={product} cartItems={cartItems} updateCartQuantity={updateCartQuantity} addToCart={addToCart} />
                    </td>
                    <td className="py-4 px-4 text-gray-600 whitespace-nowrap">Rs {formatPrice(product.offerPrice * cartItems[itemId])} PKR</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={() => router.push('/all-products')} className="group flex items-center mt-6 gap-2 text-orange-600">
            <Image
              className="group-hover:-translate-x-1 transition"
              src={assets.arrow_right_icon_colored}
              alt="arrow_right_icon_colored"
            />
            Continue Shopping
          </button>
        </div>
        <OrderSummary />
      </div>
    </>
  );
};

export default Cart;