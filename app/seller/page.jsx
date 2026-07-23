'use client'
import React, { useState } from "react";
import { assets } from "../../assets/assets";
import Image from "next/image";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import axios from "axios";

const AddProduct = () => {
  const { getToken } = useAppContext()

  const [files, setFiles] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Earphone');
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loading) return;
    
    // Validation
    if (files.length === 0 || files.every(f => !f)) {
      toast.error('Please upload at least one product image');
      return;
    }
    
    setLoading(true);
    
    // Loading toast
    const loadingToast = toast.loading('Adding product...');
    
    const formData = new FormData()
    formData.append('name', name)
    formData.append('description', description)
    formData.append('category', category)
    formData.append('price', price)
    formData.append('offerPrice', offerPrice)

    for (let i = 0; i < files.length; i++) {
      if (files[i]) {
        formData.append('images', files[i])
      }
    }
    
    try {
      const token = await getToken()
      const { data } = await axios.post('/api/product/add', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if(data.success){
        toast.success(data.message, {
          duration: 3000,
          style: {
            border: '1px solid #22c55e',
            padding: '16px',
            color: '#22c55e',
          },
          icon: '✅',
        });
        
        // Smooth reset with delay
        setTimeout(() => {
          setFiles([]);
          setName('');
          setDescription('');
          setCategory('Earphone');
          setPrice('');
          setOfferPrice('');
        }, 300);
        
      } else {
        toast.error(data.message, {
          duration: 4000,
          style: {
            border: '1px solid #ef4444',
            padding: '16px',
            color: '#ef4444',
          },
        });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.message || error.message || 'Something went wrong!', {
        duration: 4000,
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500); // Small delay for smooth transition
    }
  };

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      <form onSubmit={handleSubmit} className="md:p-10 p-4 space-y-5 max-w-lg">
        <div>
          <p className="text-base font-medium">Product Image</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {[...Array(4)].map((_, index) => (
              <label 
                key={index} 
                htmlFor={`image${index}`}
                className={`relative ${loading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                <input 
                  onChange={(e) => {
                    const updatedFiles = [...files];
                    updatedFiles[index] = e.target.files[0];
                    setFiles(updatedFiles);
                  }} 
                  type="file" 
                  id={`image${index}`} 
                  hidden 
                  disabled={loading}
                  accept="image/*"
                />
                <div className="relative">
                  <Image
                    className={`max-w-24 rounded-lg border-2 ${
                      files[index] ? 'border-green-500' : 'border-gray-300'
                    } transition-all duration-300`}
                    src={files[index] ? URL.createObjectURL(files[index]) : assets.upload_area}
                    alt=""
                    width={100}
                    height={100}
                  />
                  {files[index] && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      ✓
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {files.filter(f => f).length} of 4 images uploaded
          </p>
        </div>
        
        <div className="flex flex-col gap-1 max-w-md">
          <label className="text-base font-medium" htmlFor="product-name">
            Product Name
          </label>
          <input
            id="product-name"
            type="text"
            placeholder="Type here"
            className={`outline-none md:py-2.5 py-2 px-3 rounded border ${
              loading ? 'bg-gray-100 border-gray-300' : 'border-gray-500/40'
            } transition-all duration-300`}
            onChange={(e) => setName(e.target.value)}
            value={name}
            required
            disabled={loading}
          />
        </div>
        
        <div className="flex flex-col gap-1 max-w-md">
          <label className="text-base font-medium" htmlFor="product-description">
            Product Description
          </label>
          <textarea
            id="product-description"
            rows={4}
            className={`outline-none md:py-2.5 py-2 px-3 rounded border ${
              loading ? 'bg-gray-100 border-gray-300' : 'border-gray-500/40'
            } resize-none transition-all duration-300`}
            placeholder="Type here"
            onChange={(e) => setDescription(e.target.value)}
            value={description}
            required
            disabled={loading}
          ></textarea>
        </div>
        
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              className={`outline-none md:py-2.5 py-2 px-3 rounded border ${
                loading ? 'bg-gray-100 border-gray-300' : 'border-gray-500/40'
              } transition-all duration-300`}
              onChange={(e) => setCategory(e.target.value)}
              value={category}
              disabled={loading}
            >
              <option value="Earphone">Earphone</option>
              <option value="Headphone">Headphone</option>
              <option value="Watch">Watch</option>
              <option value="Smartphone">Smartphone</option>
              <option value="Laptop">Laptop</option>
              <option value="Camera">Camera</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="product-price">
              Product Price
            </label>
            <input
              id="product-price"
              type="number"
              placeholder="0"
              className={`outline-none md:py-2.5 py-2 px-3 rounded border ${
                loading ? 'bg-gray-100 border-gray-300' : 'border-gray-500/40'
              } transition-all duration-300`}
              onChange={(e) => setPrice(e.target.value)}
              value={price}
              required
              disabled={loading}
              min="0"
            />
          </div>
          
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="offer-price">
              Offer Price
            </label>
            <input
              id="offer-price"
              type="number"
              placeholder="0"
              className={`outline-none md:py-2.5 py-2 px-3 rounded border ${
                loading ? 'bg-gray-100 border-gray-300' : 'border-gray-500/40'
              } transition-all duration-300`}
              onChange={(e) => setOfferPrice(e.target.value)}
              value={offerPrice}
              required
              disabled={loading}
              min="0"
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          className={`w-full md:w-auto px-8 py-3 text-white font-medium rounded-lg transition-all duration-300 transform ${
            loading 
              ? 'bg-gradient-to-r from-orange-400 to-orange-500 cursor-not-allowed scale-98' 
              : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:scale-105 hover:shadow-lg active:scale-95'
          }`}
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-3">
              <svg 
                className="animate-spin h-5 w-5 text-white" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                ></circle>
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="animate-pulse">Adding Product...</span>
            </div>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Add Product
            </span>
          )}
        </button>
      </form>
    </div>
  );
};

export default AddProduct;