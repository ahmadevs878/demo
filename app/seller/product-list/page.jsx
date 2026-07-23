'use client'
import React, { useEffect, useState } from "react";
import { assets } from "../../../assets/assets";
import Image from "next/image";
import { useAppContext } from "../../../context/AppContext";
import Footer from "../../../components/Footer";
import Loading from "../../../components/Loading";
import axios from "axios";
import toast from "react-hot-toast";

// naya helper - price ko comma format mein dikhane ke liye (e.g. 12,499)
const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN").format(price || 0);
};

const ProductList = () => {
    const { router, getToken, user } = useAppContext();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    const fetchSellerProduct = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            const { data } = await axios.get('/api/product/seller-list', { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            if (data.success) {
                setProducts(data.products);
                console.log("Products loaded:", data.products);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (productId) => {
        setProductToDelete(productId);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;

        try {
            setDeletingId(productToDelete);
            setShowDeleteModal(false);
            const token = await getToken();
            
            const { data } = await axios.delete(`/api/product/${productToDelete}`, {
                headers: { 
                    Authorization: `Bearer ${token}` 
                }
            });

            if (data.success) {
                toast.success("Product deleted successfully!");
                setProducts(products.filter(product => product._id !== productToDelete));
            } else {
                toast.error(data.message || "Failed to delete product");
            }
        } catch (error) {
            console.error('Delete error:', error);
            if (error.response) {
                toast.error(error.response.data?.message || `Error: ${error.response.status}`);
            } else if (error.request) {
                toast.error('No response from server. Please check your connection.');
            } else {
                toast.error(error.message || 'Error deleting product');
            }
        } finally {
            setDeletingId(null);
            setProductToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setProductToDelete(null);
    };

    useEffect(() => {
        if (user) {
            fetchSellerProduct();
        } else {
            setLoading(false);
        }
    }, [user]);

    return (
        <div className="flex-1 min-h-screen flex flex-col justify-between">
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 animate-fadeIn">
                        <div className="flex items-center justify-center mb-4">
                            <div className="bg-red-100 rounded-full p-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
                            Delete Product
                        </h3>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            Are you sure you want to delete this product? This action cannot be undone.
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={cancelDelete}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? <Loading /> : (
                <div className="w-full md:p-10 p-4">
                    <h2 className="pb-4 text-lg font-medium">All Products</h2>
                    <p className="text-sm text-gray-500 mb-4">Total products: {products.length}</p>
                    {products.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            No products found
                        </div>
                    ) : (
                        <div className="flex flex-col items-center max-w-6xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
                            <div className="w-full overflow-x-auto">
                                <table className="w-full min-w-[600px]">
                                    <thead className="text-gray-900 text-sm text-left">
                                        <tr>
                                            <th className="w-2/5 px-4 py-3 font-medium">Product</th>
                                            <th className="w-1/6 px-4 py-3 font-medium max-sm:hidden">Category</th>
                                            <th className="w-1/6 px-4 py-3 font-medium">Price</th>
                                            <th className="w-1/3 px-4 py-3 font-medium text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm text-gray-500">
                                        {products.map((product) => (
                                            <tr key={product._id} className="border-t border-gray-500/20">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="bg-gray-500/10 rounded p-2 flex-shrink-0">
                                                            <img
                                                                src={product.image?.[0] || '/placeholder.jpg'}
                                                                alt={product.name}
                                                                className="w-12 h-12 object-cover"
                                                                width={1280}
                                                                height={720}
                                                            />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate font-medium text-gray-700">
                                                                {product.name}
                                                            </p>
                                                            <p className="text-xs text-gray-400">
                                                                ID: {product._id.slice(-6)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 max-sm:hidden">
                                                    <span className="inline-block px-2 py-1 bg-gray-100 rounded-full text-xs">
                                                        {product.category}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-semibold text-gray-700">
                                                        Rs {formatPrice(product.offerPrice || product.price)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                                        <button 
                                                            onClick={() => router.push(`/product/${product._id}`)} 
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm whitespace-nowrap"
                                                        >
                                                            <span className="hidden sm:inline">Visit</span>
                                                            <Image
                                                                className="h-4 w-4"
                                                                src={assets.redirect_icon}
                                                                alt="redirect_icon"
                                                                width={16}
                                                                height={16}
                                                            />
                                                        </button>

                                                        <button
                                                            onClick={() => handleDeleteClick(product._id)}
                                                            disabled={deletingId === product._id}
                                                            className={`flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm whitespace-nowrap ${
                                                                deletingId === product._id ? 'opacity-50 cursor-not-allowed' : ''
                                                            }`}
                                                        >
                                                            {deletingId === product._id ? (
                                                                <>
                                                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                    <span className="hidden sm:inline">Deleting...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="hidden sm:inline">Delete</span>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
            <Footer />
        </div>
    );
};

export default ProductList;