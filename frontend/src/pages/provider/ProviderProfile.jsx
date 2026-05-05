import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";

export default function ProviderProfile() {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [categories, setCategories] = useState([]);

  // Fetch current profile & categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, categoriesRes] = await Promise.all([
          axiosClient.get("/auth/profile"),
          axiosClient.get("/category/getall")
        ]);
        const profile = profileRes.data;
        setCategories(categoriesRes.data.data);
        // Populate form fields
        setValue("name", profile.name);
        setValue("email", profile.email);
        setValue("phone", profile.phone);
        if (profile.providerProfile) {
          setValue("category", profile.providerProfile.category?._id || profile.providerProfile.category);
          setValue("experience", profile.providerProfile.experience);
          setValue("location", profile.providerProfile.location);
          setValue("description", profile.providerProfile.description);
          setValue("pricePerService", profile.providerProfile.pricePerService); 
          setValue("workingHoursStart", profile.providerProfile.workingHours?.start || "09:00");
          setValue("workingHoursEnd", profile.providerProfile.workingHours?.end || "18:00");
        }
      } catch (err) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [setValue]);

  const onSubmit = async (data) => {
    setUpdating(true);
    try {
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        providerProfile: {
          category: data.category,
          experience: parseInt(data.experience),
          location: data.location,
          description: data.description,
          pricePerService: parseInt(data.pricePerService), 
          workingHours: {
            start: data.workingHoursStart,
            end: data.workingHoursEnd
          }
        }
      };
      const res = await axiosClient.put("/auth/profile", payload);
      toast.success("Profile updated successfully!");
      // Update localStorage user data
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...storedUser, ...res.data }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const [services, setServices] = useState([]);
const [showServiceModal, setShowServiceModal] = useState(false);
const [editingService, setEditingService] = useState(null);
const [serviceForm, setServiceForm] = useState({
  title: '',
  description: '',
  price: '',
  duration: 60,
  isAvailable: true
});

// Fetch provider's services
const fetchServices = async () => {
  try {
    const res = await axiosClient.get(`/services/provider/${user.id}`);
    setServices(res.data.data || []);
  } catch (err) {
    console.error("Failed to fetch services", err);
  }
};

// Create/Update service
const saveService = async () => {
  try {
    if (editingService) {
      await axiosClient.put(`/services/${editingService._id}`, serviceForm);
      toast.success("Service updated");
    } else {
      await axiosClient.post("/services", {
        ...serviceForm,
        category: categoryId,
        location: formData.location
      });
      toast.success("Service created");
    }
    setShowServiceModal(false);
    fetchServices();
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to save service");
  }
};
  if (loading) return <div className="ml-64 p-8 flex justify-center">Loading profile...</div>;

  return (
    <div className="ml-64 p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Business Profile</h1>
      <div className="bg-white p-8 rounded-xl shadow-sm border max-w-4xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input {...register("name", { required: "Name required" })} className="w-full border p-2 rounded" />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" {...register("email", { required: "Email required" })} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input {...register("phone")} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Service Category</label>
              <select {...register("category", { required: "Category required" })} className="w-full border p-2 rounded">
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Years of Experience</label>
              <input type="number" {...register("experience", { required: true, min: 0 })} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price per Service (₹)</label> 
              <input type="number" {...register("pricePerService", { required: true, min: 0 })} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Service Location (City)</label>
              <input {...register("location")} className="w-full border p-2 rounded" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Working Hours</label>
              <div className="flex gap-4">
                <input type="time" {...register("workingHoursStart")} className="border p-2 rounded" />
                <span>to</span>
                <input type="time" {...register("workingHoursEnd")} className="border p-2 rounded" />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea rows="4" {...register("description")} className="w-full border p-2 rounded" placeholder="Tell customers about your services..." />
            </div>
          </div>
          <button type="submit" disabled={updating} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50">
            {updating ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}