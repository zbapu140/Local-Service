import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";

export default function UserSupport() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await axiosClient.get("/support/my-tickets");
        setTickets(res.data.data || []);
      } catch (err) {
        console.warn("Support backend not implemented yet – using mock data");
        setTickets([
          { id: "TKT-102", subject: "Delay in Service", status: "Open", date: "2024-03-20" },
          { id: "TKT-098", subject: "Refund Request", status: "Resolved", date: "2024-03-15" },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await axiosClient.post("/support/tickets", {
        subject: data.subject,
        description: data.description,
        category: data.category,
      });
      toast.success(res.data.message || "Ticket created!");
      setTickets([res.data.data, ...tickets]);
      reset();
    } catch (err) {
      const newTicket = {
        id: `TKT-${Math.floor(100 + Math.random() * 900)}`,
        subject: data.subject,
        status: "Pending",
        date: new Date().toLocaleDateString(),
      };
      setTickets([newTicket, ...tickets]);
      toast.success("Support ticket created (mock mode – backend missing)");
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="ml-64 p-8 text-center">Loading tickets...</div>;

  return (
    <div className="ml-64 p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-2">Help & Support</h1>
      <p className="text-gray-500 mb-8">Report issues or request refunds regarding your bookings.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-bold mb-4 text-lg">Raise a Dispute</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Issue Category</label>
              <select {...register("category", { required: "Select a category" })} className="w-full mt-1 p-2 border rounded-md">
                <option value="">Select Category</option>
                <option value="Payment">Payment/Refund Issue</option>
                <option value="Behavior">Provider Behavior</option>
                <option value="Quality">Poor Service Quality</option>
                <option value="Cancellation">Cancellation Dispute</option>
              </select>
              {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Subject</label>
              <input {...register("subject", { required: "Subject required" })} className="w-full mt-1 p-2 border rounded-md" placeholder="Brief title" />
              {errors.subject && <p className="text-red-500 text-sm">{errors.subject.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea {...register("description", { required: "Description required" })} rows="4" className="w-full mt-1 p-2 border rounded-md" placeholder="Detailed explanation..."></textarea>
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">
              {submitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>
        </div>

        {/* Ticket History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-bold">Recent Support Tickets</h3>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-sm border-b">
                  <th className="p-4 font-medium">Ticket ID</th>
                  <th className="p-4 font-medium">Subject</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Status</th>
                 </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-4 font-mono text-sm">{t.id}</td>
                    <td className="p-4 text-gray-700">{t.subject}</td>
                    <td className="p-4 text-gray-500 text-sm">{t.date}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        t.status === "Resolved" ? "bg-green-100 text-green-700" : 
                        t.status === "Open" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {t.status}
                      </span>
                     </td>
                   </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-4">
            <div className="bg-blue-600 text-white p-2 rounded-full font-bold">?</div>
            <div>
              <p className="text-blue-900 font-bold text-sm">Need urgent help?</p>
              <p className="text-blue-700 text-xs">Call our 24/7 helpline at 1800-LOCAL-SRV</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}