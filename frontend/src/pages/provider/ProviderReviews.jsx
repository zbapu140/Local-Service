import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";

export default function ProviderReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    }
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Get current provider ID from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const providerId = user.id;
      
      console.log("Fetching reviews for provider:", providerId);
      
      // Fetch reviews for this provider
      const res = await axiosClient.get(`/review/provider/${providerId}`);
      console.log("Reviews response:", res.data);
      
      if (res.data && res.data.data) {
        const reviewsData = res.data.data;
        setReviews(reviewsData);
        
        // Calculate statistics
        const totalReviews = reviewsData.length;
        const averageRating = totalReviews > 0
          ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / totalReviews
          : 0;
        
        // Calculate rating distribution
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviewsData.forEach(review => {
          if (distribution[review.rating] !== undefined) {
            distribution[review.rating]++;
          }
        });
        
        setStats({
          averageRating: parseFloat(averageRating.toFixed(1)),
          totalReviews,
          ratingDistribution: distribution
        });
      } else {
        setReviews([]);
        setStats({
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        });
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
      toast.error(err.response?.data?.message || "Failed to load reviews");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={`text-lg ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="ml-64 p-8 flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-64 p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Reviews & Feedback</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-gray-500 text-sm mb-2">Average Rating</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-gray-800">{stats.averageRating.toFixed(1)}</span>
            <span className="text-yellow-400 text-2xl">★</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">out of 5</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-gray-500 text-sm mb-2">Total Reviews</p>
          <span className="text-3xl font-bold text-gray-800">{stats.totalReviews}</span>
          <p className="text-sm text-gray-500 mt-1">customer feedbacks</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-gray-500 text-sm mb-2">Customer Satisfaction</p>
          <span className="text-3xl font-bold text-green-600">
            {stats.totalReviews > 0 ? Math.round((stats.averageRating / 5) * 100) : 0}%
          </span>
          <p className="text-sm text-gray-500 mt-1">positive feedback</p>
        </div>
      </div>

      {/* Rating Distribution */}
      {stats.totalReviews > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <h3 className="font-bold mb-4">Rating Distribution</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.ratingDistribution[star];
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-4">
                  <div className="w-16 text-sm font-medium">{star} ★</div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-16 text-sm text-gray-600">{count} reviews</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <div className="text-6xl mb-4">⭐</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-500">You haven't received any reviews. Complete more services to get feedback!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                      {review.user?.name?.[0] || "U"}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{review.user?.name || "Anonymous Customer"}</h4>
                      <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                </div>
                {renderStars(review.rating)}
              </div>
              
              <p className="text-gray-700 mt-3 ml-12">{review.comment}</p>
              
              {review.booking && (
                <div className="mt-3 ml-12 text-sm text-gray-500">
                  Service: {review.booking.service?.title || "Service Completed"}
                </div>
              )}
              
              {review.isApproved ? (
                <div className="mt-3 ml-12">
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">✓ Verified Review</span>
                </div>
              ) : (
                <div className="mt-3 ml-12">
                  <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">⏳ Pending Approval</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}