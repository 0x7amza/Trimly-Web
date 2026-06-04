"use client";

import React, { useState, useEffect } from "react";
import { api, Service } from "@/lib/api";
import { useB2BAuth } from "@/components/providers";

export default function ServicesPage() {
  const { activeBarber } = useB2BAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [name, setName] = useState("");
  const [priceStr, setPriceStr] = useState("");
  const [duration, setDuration] = useState("30");
  const [category, setCategory] = useState("");

  const loadServices = async () => {
    if (!activeBarber) return;
    setIsLoading(true);
    try {
      const res = await api.services.getBarberServices(activeBarber.clerkId);
      if (res.success) {
        setServices(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadServices();
  }, [activeBarber]);

  const handleOpenAdd = () => {
    setEditingService(null);
    setName("");
    setPriceStr("");
    setDuration("30");
    setCategory("");
    setIsOpen(true);
  };

  const handleOpenEdit = (serv: Service) => {
    setEditingService(serv);
    setName(serv.name);
    setPriceStr((serv.price / 100).toString());
    setDuration(serv.durationMinutes.toString());
    setCategory(serv.category || "");
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !priceStr || !duration) return;

    const priceInCents = Math.round(parseFloat(priceStr) * 100);
    const durationMinutes = parseInt(duration) || 30;
    const finalCategory = category.trim() || "Uncategorized";

    try {
      if (editingService) {
        // Edit service
        const res = await api.services.update(editingService.id, {
          name,
          price: priceInCents,
          durationMinutes,
          category: finalCategory,
        });
        if (res.success) {
          loadServices();
          setIsOpen(false);
        }
      } else {
        // Create service
        const res = await api.services.create({
          name,
          price: priceInCents,
          durationMinutes,
          category: finalCategory,
        });
        if (res.success) {
          loadServices();
          setIsOpen(false);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      const res = await api.services.delete(id);
      if (res.success) {
        loadServices();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Group services by category
  const groupedServices: { [key: string]: Service[] } = {};
  services.forEach((s) => {
    const cat = s.category || "Uncategorized";
    if (!groupedServices[cat]) groupedServices[cat] = [];
    groupedServices[cat].push(s);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-ink">Service Menu</h1>
          <p className="text-sm text-body-text">
            Manage the grooming services you offer to clients for booking.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="button-primary cursor-pointer">
          ➕ Add New Service
        </button>
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : services.length === 0 ? (
        <div className="card-feature-sage p-12 text-center border border-ink/5">
          <p className="font-bold text-ink mb-4">No services found</p>
          <p className="text-sm text-body-text mb-6">
            Get started by adding your first service (e.g. Haircut, Beard Trim).
          </p>
          <button onClick={handleOpenAdd} className="button-primary cursor-pointer">
            Create First Service
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedServices).map(([catName, catServices]) => (
            <div key={catName} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xs font-black text-ink tracking-widest uppercase">{catName}</h2>
                <div className="h-[1px] flex-grow bg-ink/10" />
                <span className="text-[10px] font-bold text-mute-text bg-canvas-soft px-2.5 py-0.5 rounded-full">
                  {catServices.length} {catServices.length === 1 ? "service" : "services"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {catServices.map((serv) => (
                  <div key={serv.id} className="card-content flex flex-col justify-between border border-ink/10 bg-white p-6 rounded-2xl relative shadow-sm hover:shadow-md transition-shadow">
                    <div className="absolute top-4 right-4 bg-primary-pale text-positive-deep text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-primary/20">
                      {serv.durationMinutes} MIN
                    </div>
                    <div className="mb-6">
                      <h3 className="text-base font-bold text-ink mb-2">{serv.name}</h3>
                      <p className="text-2xl font-black text-ink">
                        £{(serv.price / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2 border-t border-ink/5 pt-4">
                      <button
                        onClick={() => handleOpenEdit(serv)}
                        className="button-secondary flex-1 !py-2 !px-3 text-xs cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(serv.id)}
                        className="button-tertiary flex-1 !py-2 !px-3 text-xs !text-negative border-negative hover:!bg-negative/5 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-ink/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-ink tracking-tight">
                {editingService ? "Edit Service" : "Add Service"}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full border border-ink/10 flex items-center justify-center text-mute-text hover:text-ink transition-colors text-sm hover:bg-canvas-soft"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-body-text">
                  Service Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Traditional Haircut"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-canvas border border-ink/10 rounded-xl py-3 px-4 text-xs font-bold text-ink placeholder:text-mute-text/40 focus:outline-none focus:border-ink transition-colors shadow-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-body-text">
                  Service Category
                </label>
                <input
                  type="text"
                  list="service-categories"
                  placeholder="e.g. Fades, Beard Grooming, Combo Packages"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-canvas border border-ink/10 rounded-xl py-3 px-4 text-xs font-bold text-ink placeholder:text-mute-text/40 focus:outline-none focus:border-ink transition-colors shadow-sm"
                />
                <datalist id="service-categories">
                  <option value="Fades" />
                  <option value="Beard Grooming" />
                  <option value="Combo Packages" />
                  <option value="Hair Styling" />
                  <option value="Coloring" />
                  <option value="Manicure" />
                  <option value="Pedicure" />
                  <option value="Skincare" />
                  <option value="Eyebrows" />
                  <option value="Massages" />
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-body-text">
                    Price (£)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="25.00"
                    value={priceStr}
                    onChange={(e) => setPriceStr(e.target.value)}
                    className="w-full bg-canvas border border-ink/10 rounded-xl py-3 px-4 text-xs font-bold text-ink placeholder:text-mute-text/40 focus:outline-none focus:border-ink transition-colors shadow-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-body-text">
                    Duration
                  </label>
                  <div className="relative">
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full bg-canvas border border-ink/10 rounded-xl py-3 pl-4 pr-10 text-xs font-bold text-ink focus:outline-none focus:border-ink transition-colors shadow-sm appearance-none cursor-pointer"
                      required
                    >
                      <option value="15">15 min</option>
                      <option value="20">20 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">60 min</option>
                      <option value="90">90 min</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-mute-text">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex gap-3 border-t border-ink/10 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="button-secondary flex-1 cursor-pointer py-3"
                >
                  Cancel
                </button>
                <button type="submit" className="button-primary flex-1 cursor-pointer py-3">
                  {editingService ? "Update Service" : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
