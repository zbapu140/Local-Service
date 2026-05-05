import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { Search, Filter, Star, MapPin, Clock, Calendar, Home, Tag } from 'lucide-react';

export default function UserDashboard() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ price: 5000, rating: 0, verified: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [bookingDetails, setBookingDetails] = useState({ date: '', time: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [promotions, setPromotions] = useState([]);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/providers/all');
      if (res.data.success) setProviders(res.data.data);
      else setProviders([]);
    } catch (err) {
      toast.error('Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = async (provider) => {
    setSelectedProvider(provider);
    setSelectedPromo(null);
    setDiscountAmount(0);
    setFinalAmount(provider.pricePerService);
    setBookingDetails({ date: '', time: '', address: '' });
    setPaymentMethod('cash');
    try {
      const res = await axiosClient.get(`/promotions/provider/${provider._id}/active`);
      const activePromos = res.data.data || [];
      setPromotions(activePromos);
    } catch (err) {
      setPromotions([]);
    }
    setShowBookingModal(true);
  };

  const applyPromotion = (promo) => {
    if (!selectedProvider) return;
    const originalPrice = selectedProvider.pricePerService;
    const discount = (originalPrice * promo.discountPercentage) / 100;
    const newFinal = originalPrice - discount;
    setSelectedPromo(promo);
    setDiscountAmount(discount);
    setFinalAmount(newFinal);
    toast.success(`Promotion applied! ${promo.discountPercentage}% off`);
  };

  const removePromotion = () => {
    setSelectedPromo(null);
    setDiscountAmount(0);
    setFinalAmount(selectedProvider?.pricePerService || 0);
    toast.info('Promotion removed');
  };

  // UserDashboard.jsx - In submitBooking function

const submitBooking = async () => {
  if (!bookingDetails.date || !bookingDetails.time || !bookingDetails.address) {
    toast.error("Please fill all booking details");
    return;
  }

  setSubmitting(true);
  try {
    // Get or create service
    const servicesRes = await axiosClient.get(`/services/provider/${selectedProvider._id}`);
    let serviceId;

    if (servicesRes.data.data && servicesRes.data.data.length > 0) {
      serviceId = servicesRes.data.data[0]._id;
    } else {
      const categoryId = selectedProvider.providerProfile?.category;
      if (!categoryId) {
        throw new Error("Provider category not found. Please contact the provider.");
      }

      // ✅ FIX: Create a meaningful service title
      const serviceTitle = `${selectedProvider.name}'s ${selectedProvider.category || 'Service'}`;
      
      const createServicePayload = {
        title: serviceTitle,  // Now shows "Provider's Plumbing Service" instead of "General Service"
        description: selectedProvider.description || `${selectedProvider.category || 'Service'} service by ${selectedProvider.name}`,
        category: categoryId,
        price: selectedProvider.pricePerService,
        duration: 60,
        location: selectedProvider.location,
        isAvailable: true,
      };

      const createServiceRes = await axiosClient.post("/services", createServicePayload);
      if (!createServiceRes.data?.data?._id) {
        throw new Error("Service creation failed. Please try again.");
      }
      serviceId = createServiceRes.data.data._id;
    }

    const bookingPayload = {
      serviceId,
      date: bookingDetails.date,
      time: bookingDetails.time,
      address: bookingDetails.address,
      notes: selectedPromo ? `Promotion applied: ${selectedPromo.title}` : "",
      promotionId: selectedPromo?._id || null,
      paymentMethod,
    };
    await axiosClient.post("/booking/create", bookingPayload);
    
    toast.success(`Booking request sent! ${paymentMethod === 'cash' ? "You'll pay in cash after service." : "You'll pay online after service is completed."}`);
    setShowBookingModal(false);
    setBookingDetails({ date: "", time: "", address: "" });
    setSelectedPromo(null);
  } catch (err) {
    console.error("Booking error:", err);
    const errorMsg = err.response?.data?.message || err.message || "Booking failed";
    toast.error(errorMsg);
  } finally {
    setSubmitting(false);
  }
};

  // ========== FIXED FILTER LOGIC ==========
  const filteredProviders = providers.filter((provider) => {
    const matchesSearch =
      searchTerm === '' ||
      provider.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPrice = provider.pricePerService <= filter.price;

    // ✅ FIX: Use provider.providerProfile?.isVerified instead of provider.isVerified
    const matchesVerified = !filter.verified || provider.providerProfile?.isVerified === true;

    // Rating filter (now using real rating from backend aggregation)
    const matchesRating = filter.rating === 0 || (provider.rating || 0) >= filter.rating;

    return matchesSearch && matchesPrice && matchesVerified && matchesRating;
  });

  if (loading) return <div className="ml-64 p-8 flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="ml-64 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12">
        <div className="container mx-auto px-8">
          <h1 className="text-4xl font-bold mb-4">Find a Professional</h1>
          <p className="text-indigo-100 text-lg">Top rated local services in your area</p>
        </div>
      </div>

      <div className="container mx-auto px-8 py-8">
        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by service, provider name, or location..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="px-6 py-3 bg-white border border-gray-200 rounded-xl hover:shadow-md transition flex items-center gap-2">
            <Filter className="w-5 h-5" /> Filters
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {showFilters && (
            <div className="lg:w-80 bg-white rounded-2xl shadow-lg p-6 h-fit">
              <h3 className="font-bold text-lg mb-4">Filters</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Max Price: ₹{filter.price}</label>
                  <input type="range" min="100" max="5000" step="100" className="w-full" value={filter.price} onChange={(e) => setFilter({ ...filter, price: parseInt(e.target.value) })} />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Min Rating</label>
                  <select className="w-full border border-gray-200 rounded-lg p-2" onChange={(e) => setFilter({ ...filter, rating: parseInt(e.target.value) })}>
                    <option value="0">All Ratings</option>
                    <option value="4">4+ Stars</option>
                    <option value="3">3+ Stars</option>
                  </select>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-indigo-600" checked={filter.verified} onChange={(e) => setFilter({ ...filter, verified: e.target.checked })} />
                  <span className="text-sm">Verified Providers Only</span>
                </label>
              </div>
            </div>
          )}

          <div className={`${showFilters ? 'flex-1' : 'w-full'}`}>
            {filteredProviders.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No providers found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
                <button onClick={() => { setSearchTerm(''); setFilter({ price: 5000, rating: 0, verified: false }); }} className="text-indigo-600 hover:underline font-medium">Clear all filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProviders.map((provider) => (
                  <div key={provider._id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          {provider.name?.[0] || 'P'}
                        </div>
                        {provider.providerProfile?.isVerified && (
                          <div className="flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full">
                            <span className="text-xs font-semibold">✓ Verified</span>
                          </div>
                        )}
                      </div>
                      <h2 className="text-xl font-bold text-gray-800 mb-2">{provider.name}</h2>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{provider.location || 'Location not specified'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">{provider.experience} years experience</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="ml-1 text-sm font-medium">{provider.rating?.toFixed(1) || 'New'}</span>
                        </div>
                        <span className="text-gray-400">|</span>
                        <span className="text-sm text-gray-600">{provider.category}</span>
                        {provider.totalReviews > 0 && (
                          <span className="text-xs text-gray-400">({provider.totalReviews} reviews)</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <span className="text-2xl font-bold text-indigo-600">₹{provider.pricePerService}</span>
                          <span className="text-gray-500 text-sm">/service</span>
                        </div>
                      </div>
                      <button onClick={() => handleBookNow(provider)} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105">
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedProvider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 transform transition-all max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-2">Book Service</h2>
            <p className="text-gray-600 mb-6">with {selectedProvider.name}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Service Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="date" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" min={new Date().toISOString().split('T')[0]} onChange={(e) => setBookingDetails({ ...bookingDetails, date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Preferred Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="time" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" onChange={(e) => setBookingDetails({ ...bookingDetails, time: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Service Address</label>
                <div className="relative">
                  <Home className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea rows="3" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Enter your full address" onChange={(e) => setBookingDetails({ ...bookingDetails, address: e.target.value })} />
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" value="cash" checked={paymentMethod === 'cash'} onChange={(e) => setPaymentMethod(e.target.value)} />
                    <span>Cash on Service</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={(e) => setPaymentMethod(e.target.value)} />
                    <span>Pay Online (Razorpay)</span>
                  </label>
                </div>
                {paymentMethod === 'razorpay' && (
                  <p className="text-xs text-gray-500 mt-2">💡 You'll pay after the provider completes the service.</p>
                )}
              </div>

              {promotions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2"><Tag className="w-4 h-4" /> Apply Promotion</label>
                  <select className="w-full border border-gray-200 rounded-lg p-2" onChange={(e) => { const promoId = e.target.value; const promo = promotions.find(p => p._id === promoId); promo ? applyPromotion(promo) : removePromotion(); }} value={selectedPromo?._id || ''}>
                    <option value="">No promotion</option>
                    {promotions.map(promo => <option key={promo._id} value={promo._id}>{promo.title} – {promo.discountPercentage}% OFF</option>)}
                  </select>
                </div>
              )}

              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <div className="flex justify-between"><span>Original price (per service):</span><span>₹{selectedProvider.pricePerService}</span></div>
                {selectedPromo && (
                  <>
                    <div className="flex justify-between text-green-600 mt-1"><span>Discount ({selectedPromo.discountPercentage}%):</span><span>-₹{discountAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold mt-2 pt-2 border-t border-gray-200"><span>Final amount:</span><span className="text-indigo-600">₹{finalAmount.toFixed(2)}</span></div>
                  </>
                )}
                {!selectedPromo && <div className="flex justify-between font-bold mt-2 pt-2 border-t border-gray-200"><span>Total:</span><span>₹{selectedProvider.pricePerService}</span></div>}
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowBookingModal(false)} className="flex-1 border border-gray-200 py-3 rounded-xl font-medium hover:bg-gray-50 transition" disabled={submitting}>Cancel</button>
                <button onClick={submitBooking} disabled={submitting} className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50">
                  {submitting ? 'Processing...' : paymentMethod === 'razorpay' ? `Pay ₹${finalAmount.toFixed(2)}` : 'Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
