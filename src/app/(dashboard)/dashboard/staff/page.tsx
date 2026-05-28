"use client";

import React, { useState } from "react";
import { useB2BAuth } from "@/components/providers";
import { Link2, Copy, CheckCheck, Users, Scissors, ExternalLink } from "lucide-react";

export default function StaffPage() {
  const { role, allBarbers, shop } = useB2BAuth();
  const [copied, setCopied] = useState(false);

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

  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/for-professionals?shopId=${shop?.id || ""}`
      : `/for-professionals?shopId=${shop?.id || ""}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="flex flex-col h-full gap-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-ink">Staff Registry</h1>
          <p className="text-sm text-body-text mt-1">
            Manage active barbers registered to your salon.
          </p>
        </div>
      </div>

      {/* Invite Banner */}
      <div className="bg-canvas border border-ink/10 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-ink" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-ink text-base">Invite a Barber to Your Team</h3>
            <p className="text-xs text-mute-text mt-1 leading-relaxed mb-4">
              Share the link below with your barber. They'll create their own Trimly account
              and be linked to your salon automatically.
            </p>

            {/* Invite Link Row */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-canvas-soft border border-ink/10 rounded-xl px-4 py-3 min-w-0">
                <Link2 className="w-4 h-4 text-mute-text flex-shrink-0" />
                <span className="text-sm font-semibold text-body-text truncate">
                  {inviteLink}
                </span>
              </div>
              <button
                id="btn-copy-invite-link"
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer flex-shrink-0 ${
                  copied
                    ? "bg-positive-pale text-positive border border-positive/20"
                    : "bg-ink text-white hover:bg-ink-hover"
                }`}
              >
                {copied ? (
                  <>
                    <CheckCheck className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </button>
              <a
                href={inviteLink}
                target="_blank"
                rel="noopener noreferrer"
                id="btn-open-invite-link"
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-canvas-soft border border-ink/10 text-body-text hover:text-ink hover:border-ink/30 transition-all flex-shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
                Preview
              </a>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-5 pt-5 border-t border-ink/5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: "1", label: "Copy the invite link above" },
            { icon: "2", label: "Send it to your barber via WhatsApp, SMS, or email" },
            { icon: "3", label: "They sign up → appear in your staff list automatically" },
          ].map((step) => (
            <div key={step.icon} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-ink text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                {step.icon}
              </span>
              <p className="text-xs text-mute-text leading-relaxed">{step.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-canvas rounded-wise border border-ink/5 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-ink/5 flex items-center gap-2">
          <Scissors className="w-4 h-4 text-mute-text" />
          <h2 className="font-bold text-sm text-ink">Active Team Members</h2>
          <span className="ml-auto text-xs font-bold bg-canvas-soft text-mute-text px-2 py-0.5 rounded-md border border-ink/5">
            {allBarbers.length} member{allBarbers.length !== 1 ? "s" : ""}
          </span>
        </div>
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
                  <div className="w-9 h-9 bg-primary-pale text-ink-deep font-bold rounded-full flex items-center justify-center text-sm">
                    {barber.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </div>
                  <div>
                    <span className="block font-bold text-ink">{barber.name}</span>
                    <span className="block text-xs text-mute-text font-mono">{barber.id}</span>
                  </div>
                </td>
                <td className="p-4 text-sm font-semibold text-body-text">{barber.email}</td>
                <td className="p-4 text-sm font-semibold">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      barber.role === "OWNER"
                        ? "bg-ink text-white"
                        : "bg-canvas-soft text-ink border border-ink/5"
                    }`}
                  >
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
    </div>
  );
}
