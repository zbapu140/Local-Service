import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import { Search, Filter, X } from "lucide-react";

export default function CompareProviders() {
  const [providers, setProviders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ category: "", location: "", minPrice: "", maxPrice: "" });
  const [categories, setCategories] = useState([]);
  const [selectedForCompare, setSelectedForCompare] = useState([]);

  useEffect(() => {
    fetchProviders();
    fetchCategories();
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/providers/all");
      setProviders(res.data.data || []);
      setFiltered(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load providers");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axiosClient.get("/category/getall");
      setCategories(res.data.data);
    } catch (err) {
      console.error("Failed to load categories");
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("location", searchTerm);
      if (filters.category) params.append("category", filters.category);
      if (filters.location) params.append("location", filters.location);
      if (filters.minPrice) params.append("minPrice", filters.minPrice);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
      
      const res = await axiosClient.get(`/providers/search?${params.toString()}`);
      setFiltered(res.data.data || []);
    } catch (err) {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleCompare = (provider) => {
    if (selectedForCompare.find(p => p._id === provider._id)) {
      setSelectedForCompare(selectedForCompare.filter(p => p._id !== provider._id));
    } else if (selectedForCompare.length < 3) {
      setSelectedForCompare([...selectedForCompare, provider]);
    } else {
      toast.warning("You can compare up to 3 providers");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({ category: "", location: "", minPrice: "", maxPrice: "" });
    fetchProviders();
  };

  if (loading) return <div className="ml-64 p-8 text-center">Loading providers...</div>;

  return (
    <div className="ml-64 p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-2">Compare Service Providers</h1>
      <p className="text-gray-500 mb-6">Search and compare up to 3 providers side by side</p>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium">Search by location or name</label>
            <input
              type="text"
              placeholder="e.g., Mumbai, Electrician"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border p-2 rounded mt-1"
            />
          </div>
          <div className="w-40">
            <label className="text-sm font-medium">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full border p-2 rounded mt-1"
            >
              <option value="">All</option>
              {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
            </select>
          </div>
          <div className="w-40">
            <label className="text-sm font-medium">Min Price (₹)</label>
            <input type="number" placeholder="0" value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} className="w-full border p-2 rounded mt-1" />
          </div>
          <div className="w-40">
            <label className="text-sm font-medium">Max Price (₹)</label>
            <input type="number" placeholder="5000" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} className="w-full border p-2 rounded mt-1" />
          </div>
          <button onClick={handleSearch} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Search size={18} /> Search</button>
          <button onClick={clearFilters} className="border px-4 py-2 rounded-lg flex items-center gap-2"><X size={18} /> Clear</button>
        </div>
      </div>

      {/* Compare Selection Area */}
      {selectedForCompare.length > 0 && (
        <div className="mb-6 p-4 bg-indigo-50 rounded-xl">
          <h3 className="font-semibold mb-2">Selected for comparison ({selectedForCompare.length}/3):</h3>
          <div className="flex flex-wrap gap-2">
            {selectedForCompare.map(p => (
              <span key={p._id} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                {p.name}
                <button onClick={() => toggleCompare(p)} className="hover:text-red-600">✕</button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Provider List with Checkboxes */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">Select</th>
              <th className="p-4 text-left">Provider</th>
              <th className="p-4 text-left">Category</th>
              <th className="p-4 text-left">Location</th>
              <th className="p-4 text-left">Experience</th>
              <th className="p-4 text-left">Price/Service</th>
              <th className="p-4 text-left">Rating</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(provider => (
              <tr key={provider._id} className="border-t hover:bg-gray-50">
                <td className="p-4">
                  <input type="checkbox" checked={selectedForCompare.some(p => p._id === provider._id)} onChange={() => toggleCompare(provider)} className="w-5 h-5" />
                </td>
                <td className="p-4 font-medium">{provider.name}</td>
                <td className="p-4">{provider.category}</td>
                <td className="p-4">{provider.location}</td>
                <td className="p-4">{provider.experience} yrs</td>
                <td className="p-4">₹{provider.pricePerService}</td> 
                <td className="p-4">⭐ {provider.rating || "4.5 "}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Comparison Table */}
      {selectedForCompare.length >= 2 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Comparison Table</h2>
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-4 text-left">Feature</th>
                  {selectedForCompare.map(p => <th key={p._id} className="p-4 text-left">{p.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Category", key: "category" },
                  { label: "Location", key: "location" },
                  { label: "Experience", key: "experience", formatter: (v) => `${v} years` },
                  { label: "Price per service", key: "pricePerService", formatter: (v) => `₹${v}` },
                  { label: "Rating", key: "rating", formatter: (v) => `⭐ ${v || "4.5"}` },
                  { label: "Description", key: "description" }
                ].map(row => (
                  <tr key={row.label} className="border-t">
                    <td className="p-4 font-semibold bg-gray-50">{row.label}</td>
                    {selectedForCompare.map(p => (
                      <td key={p._id} className="p-4">
                        {row.formatter ? row.formatter(p[row.key]) : p[row.key] || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}