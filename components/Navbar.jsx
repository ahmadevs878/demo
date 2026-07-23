"use client"
import React, { useState, useEffect, useCallback, memo } from "react";
import { assets, BagIcon, CartIcon } from "../assets/assets";
import Link from "next/link"
import { useAppContext } from "../context/AppContext";
import Image from "next/image";
import { useClerk, UserButton } from "@clerk/nextjs";
import { Search, SearchX, X } from "lucide-react";

// ------------------------------------------------------------------
// DESKTOP SearchBar
// Navbar ke bahar rakha hai + React.memo kiya hai taake har keystroke
// par yeh remount na ho (jo pehle focus-loss/lag ka masla banta tha).
// ------------------------------------------------------------------
const SearchBar = memo(function SearchBar({
  inputWidth,
  showSearch,
  setShowSearch,
  searchQuery,
  setSearchQuery,
  isSearching,
  filteredProducts,
  handleSearch,
  handleProductClick,
}) {
  return (
    <div className="relative flex items-center">
      {showSearch ? (
        <form onSubmit={handleSearch} className="flex items-center relative">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => setTimeout(() => setShowSearch(false), 150)}
              placeholder="Search products..."
              className={`border border-gray-300 rounded-full pl-9 pr-3 py-1 text-sm outline-none ${inputWidth}`}
            />
          </div>

          {(isSearching || filteredProducts.length > 0 || (searchQuery.trim() && !isSearching)) && (
            <div className="absolute top-9 left-0 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden">
              {isSearching ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 rounded" />
                    <div className="h-3 bg-gray-200 rounded w-32" />
                  </div>
                ))
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    onMouseDown={() => handleProductClick(product._id)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <img
                      src={product.image[0]}
                      alt={product.name}
                      width={32}
                      height={32}
                      className="w-8 h-8 object-cover rounded"
                    />
                    <span className="text-sm text-gray-700 truncate">
                      {product.name}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center gap-2 px-3 py-3">
                  <SearchX className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-bold text-red-600">
                    Product not found
                  </span>
                </div>
              )}
            </div>
          )}
        </form>
      ) : (
        <Search
          className="w-4 h-4 cursor-pointer text-gray-700"
          onClick={() => setShowSearch(true)}
        />
      )}
    </div>
  );
});

// ------------------------------------------------------------------
// MOBILE Search Overlay
// Jab mobile pe search khulta hai, to yeh poori available width le
// leta hai aur baaki icons (seller/cart/account) us waqt render hi
// nahi hote — is se row overflow/wrap wala UI-breaking masla khatam
// ho jata hai. Close karne ke liye explicit X button hai.
// Dropdown bhi "left-0 right-0" se full width rehta hai, taake mobile
// screen ke edge se bahar na nikle.
// ------------------------------------------------------------------
const MobileSearchOverlay = memo(function MobileSearchOverlay({
  searchQuery,
  setSearchQuery,
  setShowSearch,
  isSearching,
  filteredProducts,
  handleSearch,
  handleProductClick,
}) {
  const closeSearch = () => {
    setShowSearch(false);
    setSearchQuery("");
  };

  return (
    <div className="relative flex items-center gap-2 w-full min-w-0">
      <form onSubmit={handleSearch} className="relative flex-1 min-w-0">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
        <input
          type="text"
          autoFocus
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products..."
          className="border border-gray-300 rounded-full pl-9 pr-3 py-1.5 text-sm outline-none w-full"
        />
      </form>

      <button
        type="button"
        onClick={closeSearch}
        aria-label="Close search"
        className="shrink-0 text-gray-500 hover:text-gray-800"
      >
        <X className="w-5 h-5" />
      </button>

      {(isSearching || filteredProducts.length > 0 || (searchQuery.trim() && !isSearching)) && (
        <div className="absolute top-11 left-0 right-8 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden">
          {isSearching ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-32" />
              </div>
            ))
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div
                key={product._id}
                onMouseDown={() => handleProductClick(product._id)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <img
                  src={product.image[0]}
                  alt={product.name}
                  width={32}
                  height={32}
                  className="w-8 h-8 object-cover rounded"
                />
                <span className="text-sm text-gray-700 truncate">
                  {product.name}
                </span>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center gap-2 px-3 py-3">
              <SearchX className="w-4 h-4 text-red-600" />
              <span className="text-sm font-bold text-red-600">
                Product not found
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

const Navbar = () => {
  const { isSeller, router, user, cartItems, products } = useAppContext();
  const { openSignIn } = useClerk()

  // Cart mein total items count
  const cartCount = Object.values(cartItems || {}).reduce((total, qty) => total + qty, 0);

  // Search related states
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isSearching, setIsSearching] = useState(false); // skeleton ke liye

  // Debounce ke sath filtering (taake skeleton dikh sake aur typing smooth rahe)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      const query = searchQuery.toLowerCase();
      const results = products
        ?.filter((product) => product.name?.toLowerCase().includes(query))
        .slice(0, 6);
      setFilteredProducts(results || []);
      setIsSearching(false);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery, products]);

  // useCallback: yeh functions har render pe recreate nahi hote,
  // isliye memoized SearchBar/MobileSearchOverlay ko unnecessary
  // re-render nahi hota.
  const handleProductClick = useCallback((id) => {
    router.push(`/product/${id}`);
    setSearchQuery("");
    setShowSearch(false);
  }, [router]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/all-products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowSearch(false);
    }
  }, [searchQuery, router]);

  // Common props jo desktop aur mobile dono search components ko chahiye
  const searchProps = {
    showSearch,
    setShowSearch,
    searchQuery,
    setSearchQuery,
    isSearching,
    filteredProducts,
    handleSearch,
    handleProductClick,
  };

  return (
    <nav className="flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 border-b border-gray-300 text-gray-700">
    <h1>ESSE<span style={{color:'#E66A00'}}>NCE</span></h1>
      {/* Desktop menu links */}
      <div className="flex items-center gap-4 lg:gap-8 max-md:hidden">
        <Link href="/" className="hover:text-gray-900 transition">
          Home
        </Link>
        <Link href="/all-products" className="hover:text-gray-900 transition">
          Shop
        </Link>
        <Link href="/" className="hover:text-gray-900 transition">
          About Us
        </Link>
        <Link href="/" className="hover:text-gray-900 transition">
          Contact
        </Link>
        {isSeller && (
          <button
            onClick={() => router.push('/seller')}
            className="text-xs border px-4 py-1.5 rounded-full"
          >
            Seller Dashboard
          </button>
        )}
      </div>

      {/* Desktop right side: search, cart, account */}
      <ul className="hidden md:flex items-center gap-4 ">
        <SearchBar inputWidth="w-52" {...searchProps} />

        <div className="relative cursor-pointer" onClick={() => router.push('/cart')}>
          <CartIcon className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
              {cartCount}
            </span>
          )}
        </div>

        {user ? (
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Action
                label="Cart"
                labelIcon={<CartIcon />}
                onClick={() => router.push('/cart')}
              />
            </UserButton.MenuItems>
            <UserButton.MenuItems>
              <UserButton.Action
                label="My Orders"
                labelIcon={<BagIcon />}
                onClick={() => router.push('/my-orders')}
              />
            </UserButton.MenuItems>
          </UserButton>
        ) : (
          <button
            onClick={openSignIn}
            className="flex items-center gap-2 hover:text-gray-900 transition"
          >
            <Image src={assets.user_icon} alt="user icon" />
            Account
          </button>
        )}
      </ul>

      {/* Mobile view */}
      <div className="flex items-center md:hidden gap-3 flex-1 justify-end min-w-0 ml-3">
        {showSearch ? (
          // Search active: sirf full-width search overlay dikhega,
          // baaki icons hide taake layout na toote
          <MobileSearchOverlay {...searchProps} />
        ) : (
          <>
            {isSeller && (
              <button
                onClick={() => router.push('/seller')}
                className="text-xs border px-4 py-1.5 rounded-full shrink-0"
              >
                Seller Dashboard
              </button>
            )}

            <Search
              className="w-5 h-5 cursor-pointer text-gray-700 shrink-0"
              onClick={() => setShowSearch(true)}
            />

            <div className="relative cursor-pointer shrink-0" onClick={() => router.push('/cart')}>
              <CartIcon className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </div>

            {user ? (
              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Action
                    label="Cart"
                    labelIcon={<CartIcon />}
                    onClick={() => router.push('/cart')}
                  />
                </UserButton.MenuItems>
                <UserButton.MenuItems>
                  <UserButton.Action
                    label="My Orders"
                    labelIcon={<BagIcon />}
                    onClick={() => router.push('/my-orders')}
                  />
                </UserButton.MenuItems>
              </UserButton>
            ) : (
              <button
                onClick={openSignIn}
                className="flex items-center gap-2 hover:text-gray-900 transition shrink-0"
              >
                <Image src={assets.user_icon} alt="user icon" />
                Account
              </button>
            )}
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
