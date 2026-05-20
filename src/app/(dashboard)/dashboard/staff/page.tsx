"use client";

import React, { useState } from "react";
import { useB2BAuth } from "@/components/providers";

export default function StaffPage() {
  const { role, allBarbers, addMockBarber } = useB2BAuth();

  // Form states
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Guard: Owner only page
  if (role !== "OWNER") {
    return (
      <div className="card-feature-sage p-12 text-center border border-ink/5 max-w-lg mx-auto mt-12">
        <div className="w-16 h-16 bg-negative-bg text-white rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🚫</span>
        </div>
        <h3 className="text-2xl font-black text-ink mb-3">Access Restricted</h3>
        <p className="text-sm text-body-text">
          Only the salon owner has permissions to manage staff members and barbers.
        </p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    addMockBarber(name, email);
    setName("");
    setEmail("");
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-ink">Staff Registry</h1>
          <p className="text-sm text-body-text">
            Add, manage, and view active barbers registered to your salon.
          </p>
        </div>
        <button onClick={() => setIsOpen(true)} className="button-primary">
          ➕ Invite Staff Member
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-canvas rounded-wise border border-ink/5 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-canvas-soft border-b border-ink/5">
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-mute-text">Barber Name</th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-mute-text">Email Address</th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-mute-text">Shop Role</th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-mute-text">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {allBarbers.map((barber) => (
              <tr key={barber.id} className="hover:bg-canvas-soft/20 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary-pale text-ink-deep font-bold rounded-full flex items-center justify-center">
                    {barber.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <span className="block font-bold text-ink">{barber.name}</span>
                    <span className="block text-xs text-mute-text">{barber.id}</span>
                  </div>
                </td>
                <td className="p-4 text-sm font-semibold text-body-text">{barber.email}</td>
                <td className="p-4 text-sm font-semibold">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    barber.role === "OWNER"
                      ? "bg-ink text-white"
                      : "bg-canvas-soft text-ink border border-ink/5"
                  }`}>
                    {barber.role}
                  </span>
                </td>
                <td className="p-4">
                  <span className="badge-positive font-bold text-xs">Active</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-canvas rounded-wise p-6 border border-ink/5 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-ink">Invite Barber</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-mute-text hover:text-ink font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. David Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. david@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="pt-6 flex gap-3 border-t border-ink/5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="button-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="button-primary flex-1">
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
