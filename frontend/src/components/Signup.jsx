import React, { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import OTPModal from "../components/OTPModal";

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("user");
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  // OTP related states
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [emailVerificationToken, setEmailVerificationToken] = useState(null);
  const [tempFormData, setTempFormData] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const password = watch("password");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosClient.get("/category/getall");
        setCategories(res.data.data);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

  const onSubmit = (data) => {
    setTempFormData(data);
    sendOTP(data.email);
  };

  const sendOTP = async (email) => {
    try {
      const res = await axiosClient.post("/otp/send-otp", { email });
      if (res.data.message) {
        setShowOTPModal(true);
        toast.info("OTP sent to your email. Please verify.");
      }
    } catch (err) {
      console.error("OTP send error:", err);
      const errorMsg = err.response?.data?.message || "Failed to send OTP. Check your email or try again later.";
      toast.error(errorMsg);
    }
  };

  const handleOTPVerified = async (token) => {
    setEmailVerificationToken(token);
    setShowOTPModal(false);
    await completeRegistration(token);
  };

  const completeRegistration = async (token) => {
    if (!tempFormData) return;

    setIsLoading(true);
    try {
      const payload = {
        name: tempFormData.name,
        email: tempFormData.email,
        password: tempFormData.password,
        role: selectedRole,
        phone: tempFormData.phone || "",
        emailVerificationToken: token,
        ...(selectedRole === "provider" && {
          providerProfile: {
            category: selectedCategoryId,
            experience: tempFormData.experience,
            location: tempFormData.location,
            description: tempFormData.description,
            pricePerService: tempFormData.pricePerService 
          }
        })
      };

      const res = await axiosClient.post("/auth/register", payload);
      toast.success(res.data.message || "Account created successfully!");
      
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      console.error("Signup failed", err);
      const message = err.response?.data?.message || err.message || "Signup failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
      setTempFormData(null);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* LEFT SIDE - INFO */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-12 flex-col justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-4">Join Local Service</h1>
          <p className="text-blue-100 text-lg">Start your journey with us today</p>
        </div>
        
        <div className="space-y-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">👤</div>
            <div>
              <h3 className="font-semibold">For Customers</h3>
              <p className="text-blue-100 text-sm">Find trusted professionals for all your needs</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">👨‍🔧</div>
            <div>
              <h3 className="font-semibold">For Service Providers</h3>
              <p className="text-blue-100 text-sm">Grow your business and find more customers</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - SIGNUP FORM */}
      <div className="flex items-center justify-center w-full md:w-1/2 px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-3xl mb-4 shadow-lg">
                📝
              </div>
              <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>
              <p className="text-gray-500 mt-2">Join our community today</p>
            </div>

            {/* Role Selection Toggle */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I want to sign up as:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole("user")}
                  className={`py-3 px-4 rounded-lg font-medium transition-all ${
                    selectedRole === "user"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span className="mr-2">👤</span>
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("provider")}
                  className={`py-3 px-4 rounded-lg font-medium transition-all ${
                    selectedRole === "provider"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span className="mr-2">👨‍🔧</span>
                  Service Provider
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  {...register("name", { required: "Name is required" })}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <input
                  type="tel"
                  placeholder={selectedRole === "provider" ? "Phone Number (Required)" : "Phone Number (Optional)"}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  {...register("phone", {
                    ...(selectedRole === "provider" && { required: "Phone number is required for providers" })
                  })}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Minimum 6 characters"
                    }
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  {...register("confirmPassword", {
                    required: "Confirm your Password",
                    validate: (value) => value === password || "Passwords do not match"
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400"
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Provider Specific Fields */}
              {selectedRole === "provider" && (
                <div className="space-y-3 border-t pt-4 mt-2">
                  <h3 className="font-semibold text-gray-700">Professional Details</h3>
                  
                  <select
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    value={selectedCategoryId}
                    required
                  >
                    <option value="">Select Service Category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  
                  <input
                    type="number"
                    placeholder="Years of Experience"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    {...register("experience", { required: "Experience is required", min: 0 })}
                  />
                  
                  <input
                    type="text"
                    placeholder="Service Location (City)"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    {...register("location", { required: "Location is required" })}
                  />
                  
                  <input
                    type="number"
                    placeholder="Price per Service (₹)" // Changed from Price per Hour
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    {...register("pricePerService", { required: "Price is required", min: 0 })} // Changed from pricePerHour
                  />
                  
                  <textarea
                    placeholder="Brief description about your services"
                    rows="3"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    {...register("description")}
                  />
                </div>
              )}

              {/* Signup Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  `Create ${selectedRole === "provider" ? "Provider" : "Customer"} Account`
                )}
              </button>

              {/* Login Redirect */}
              <div className="text-center mt-4">
                <p className="text-gray-600">
                  Already have an account?{" "}
                  <Link 
                    to="/" 
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      <OTPModal
        email={tempFormData?.email || ""}
        isOpen={showOTPModal}
        onVerify={handleOTPVerified}
        onCancel={() => {
          setShowOTPModal(false);
          setTempFormData(null);
        }}
      />
    </div>
  );
}