"use client";

import React, { useState, useEffect, useRef } from "react";
import { api, Shop, BusinessHours } from "@/lib/api";
import { useB2BAuth } from "@/components/providers";
import {
  Building2,
  Image as ImageIcon,
  Plus,
  Trash2,
  CheckCircle,
  Save,
  ExternalLink,
  Sparkles,
  Upload,
  MapPin,
  Clock,
  Globe,
} from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DEFAULT_HOURS: BusinessHours[] = [
  { day: 1, open: "09:00", close: "18:00", isClosed: false },
  { day: 2, open: "09:00", close: "18:00", isClosed: false },
  { day: 3, open: "09:00", close: "18:00", isClosed: false },
  { day: 4, open: "09:00", close: "18:00", isClosed: false },
  { day: 5, open: "09:00", close: "19:00", isClosed: false },
  { day: 6, open: "09:00", close: "17:00", isClosed: false },
  { day: 0, open: "09:00", close: "17:00", isClosed: true },
];

const inputCls =
  "w-full bg-canvas border border-ink/10 rounded-xl py-3 px-4 text-xs font-bold text-ink focus:outline-none focus:border-ink transition-colors shadow-sm";

export default function SettingsPage() {
  const { activeBarber } = useB2BAuth();
  const [shop, setShop] = useState<Shop | null>(null);

  // Identity
  const [shopName, setShopName] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [galleryPictures, setGalleryPictures] = useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState("");

  // Location
  const [address, setAddress] = useState("");
  const [mapUrl, setMapUrl] = useState("");

  // Opening Hours
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>(DEFAULT_HOURS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const profileFileRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);

  const loadSettings = async () => {
    if (!activeBarber) return;
    setLoading(true);
    try {
      const res = await api.shops.getMe();
      if (res.success && res.data?.shop) {
        const s = res.data.shop;
        setShop(s);
        setShopName(s.name || "");
        setProfilePicture(s.profilePicture || s.profileImage || "");
        setGalleryPictures(s.galleryPictures || s.images || []);
        setAddress(s.address || "");
        setMapUrl(s.mapUrl || "");
        setBusinessHours(s.businessHours && s.businessHours.length > 0 ? s.businessHours : DEFAULT_HOURS);
      }
    } catch (err: any) {
      setError("Failed to load shop settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [activeBarber]);

  const handleUploadProfileFile = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const res = await api.upload(file);
      if (res.success) setProfilePicture(res.data.url);
    } catch (err: any) {
      setError(err.message || "File upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadGalleryFile = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const res = await api.upload(file);
      if (res.success) setGalleryPictures((prev) => [...prev, res.data.url]);
    } catch (err: any) {
      setError(err.message || "File upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddGalleryUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryUrl.trim()) return;
    if (!newGalleryUrl.startsWith("http://") && !newGalleryUrl.startsWith("https://")) {
      setError("Please enter a valid HTTP or HTTPS image URL.");
      return;
    }
    setGalleryPictures([...galleryPictures, newGalleryUrl.trim()]);
    setNewGalleryUrl("");
    setError("");
  };

  const handleRemoveGalleryUrl = (index: number) => {
    setGalleryPictures(galleryPictures.filter((_, i) => i !== index));
  };

  // Opening Hours helpers
  const updateHour = (day: number, field: keyof BusinessHours, value: any) => {
    setBusinessHours((prev) =>
      prev.map((h) => (h.day === day ? { ...h, [field]: value } : h))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      setError("Salon name is required.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await api.shops.updateMe({
        name: shopName,
        profilePicture,
        galleryPictures,
        address,
        mapUrl,
        businessHours,
      });
      if (res.success) {
        setSuccess(true);
        setShop(res.data);
        setTimeout(() => setSuccess(false), 3500);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Sort hours Mon→Sun (1-6, then 0)
  const sortedHours = [...businessHours].sort((a, b) => {
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order.indexOf(a.day) - order.indexOf(b.day);
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-ink tracking-tight">Salon Settings</h1>
        <p className="text-sm text-body-text mt-1">
          Manage your brand, location, opening hours, and public gallery.
        </p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-4 rounded-xl flex items-center gap-2.5 text-xs font-bold animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          Settings saved! Changes are live on your public booking page.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-950 p-4 rounded-xl text-xs font-bold animate-fade-in">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* ── LEFT: All editable cards ─────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Identity Card ── */}
          <div className="bg-white border border-ink/10 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-black text-ink uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-mute-text" />
              Identity &amp; Details
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-body-text">Salon Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Doe Barbershop"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-mute-text">Public Booking Directory Link</label>
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink bg-canvas-soft p-3 rounded-xl border border-ink/5">
                  <span className="text-mute-text">trimly.co.uk/</span>
                  <span className="font-extrabold">{shop?.slug}</span>
                  <a
                    href={`/${shop?.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto text-mute-text hover:text-ink transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ── Location Card ── */}
          <div className="bg-white border border-ink/10 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-sm font-black text-ink uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-mute-text" />
                Location &amp; Map
              </h3>
              <p className="text-[11px] text-mute-text mt-1">
                Your address is shown on your public booking page as a live Google Maps embed.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-body-text">
                Full Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mute-text" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 123 Main St, London"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`${inputCls} pl-9`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-body-text">
                Google Maps Embed or Share URL (Optional)
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mute-text" />
                <input
                  type="text"
                  placeholder="e.g. https://www.google.com/maps/embed?pb=..."
                  value={mapUrl}
                  onChange={(e) => setMapUrl(e.target.value)}
                  className={`${inputCls} pl-9`}
                />
              </div>
              <p className="text-[10px] text-mute-text font-semibold">
                Paste the Google Maps iframe embed code or link to override standard address geocoding.
              </p>
            </div>

            {/* Live Google Maps Preview */}
            {(mapUrl.trim() || address.trim()) && (
              <div className="rounded-xl overflow-hidden border border-ink/10 shadow-sm h-48">
                <iframe
                  title="Location Preview"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={
                    mapUrl.trim()
                      ? (mapUrl.includes("src=\"") ? mapUrl.match(/src="([^"]+)"/)?.[1] || mapUrl : mapUrl)
                      : `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed&z=15`
                  }
                />
              </div>
            )}
          </div>

          {/* ── Opening Hours Card ── */}
          <div className="bg-white border border-ink/10 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-sm font-black text-ink uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-mute-text" />
                Opening Hours
              </h3>
              <p className="text-[11px] text-mute-text mt-1">
                Set when your shop is open. Clients see these hours on your public booking page.
              </p>
            </div>

            <div className="divide-y divide-ink/5">
              {sortedHours.map((h) => (
                <div
                  key={h.day}
                  className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 py-3.5 ${h.isClosed ? "opacity-50" : ""}`}
                >
                  {/* Day name */}
                  <span className="text-xs font-extrabold text-ink w-24 flex-shrink-0">
                    {DAYS[h.day]}
                  </span>

                  {/* Closed toggle */}
                  <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                    <div
                      role="checkbox"
                      aria-checked={!h.isClosed}
                      onClick={() => updateHour(h.day, "isClosed", !h.isClosed)}
                      className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
                        h.isClosed ? "bg-ink/15" : "bg-positive"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          h.isClosed ? "translate-x-0.5" : "translate-x-4"
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-body-text">
                      {h.isClosed ? "Closed" : "Open"}
                    </span>
                  </label>

                  {/* Time range */}
                  {!h.isClosed && (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={h.open}
                        onChange={(e) => updateHour(h.day, "open", e.target.value)}
                        className="bg-canvas-soft border border-ink/10 rounded-lg px-3 py-1.5 text-xs font-bold text-ink focus:outline-none focus:border-ink transition-colors"
                      />
                      <span className="text-xs text-mute-text font-bold">to</span>
                      <input
                        type="time"
                        value={h.close}
                        onChange={(e) => updateHour(h.day, "close", e.target.value)}
                        className="bg-canvas-soft border border-ink/10 rounded-lg px-3 py-1.5 text-xs font-bold text-ink focus:outline-none focus:border-ink transition-colors"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Profile Picture Card ── */}
          <div className="bg-white border border-ink/10 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-black text-ink uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-mute-text" />
              Main Profile Image
            </h3>
            <div className="space-y-3">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-body-text">Profile Picture</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={profilePicture}
                  onChange={(e) => setProfilePicture(e.target.value)}
                  className={`flex-grow ${inputCls}`}
                />
                <input
                  type="file"
                  ref={profileFileRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadProfileFile(file);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => profileFileRef.current?.click()}
                  className="button-secondary !py-3 !px-4 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap flex-shrink-0"
                >
                  {uploading ? <div className="w-3.5 h-3.5 border-2 border-ink border-t-transparent rounded-full animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Upload
                </button>
              </div>
              {profilePicture && (
                <div className="flex items-center gap-4 bg-canvas-soft/40 p-4 rounded-xl border border-ink/5">
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-ink/10 bg-canvas flex-shrink-0">
                    <img
                      src={profilePicture}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as any).src = "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=300&q=80";
                      }}
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink">Avatar Live Preview</h4>
                    <p className="text-[10px] text-mute-text">Appears on card tiles and category landing views.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Gallery Card ── */}
          <div className="bg-white border border-ink/10 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-sm font-black text-ink uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-mute-text" />
                Work Gallery Pictures
              </h3>
              <p className="text-[10px] text-mute-text font-semibold mt-1">
                Showcase your portfolio on your booking page.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste picture URL here (https://...)"
                  value={newGalleryUrl}
                  onChange={(e) => setNewGalleryUrl(e.target.value)}
                  className={`flex-grow ${inputCls}`}
                />
                <input
                  type="file"
                  ref={galleryFileRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadGalleryFile(file);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => galleryFileRef.current?.click()}
                  className="button-secondary !py-3 !px-4 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  {uploading ? <div className="w-3.5 h-3.5 border-2 border-ink border-t-transparent rounded-full animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Upload
                </button>
                <button
                  type="button"
                  onClick={handleAddGalleryUrl}
                  className="button-secondary !py-3 !px-4 text-xs font-bold rounded-xl inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add URL
                </button>
              </div>
              {galleryPictures.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-ink/10 rounded-xl">
                  <p className="text-xs text-mute-text font-bold">No gallery pictures added yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {galleryPictures.map((url, index) => (
                    <div key={index} className="group relative h-24 rounded-xl overflow-hidden border border-ink/10 bg-canvas-soft shadow-xs">
                      <img
                        src={url}
                        alt={`Gallery ${index}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as any).src = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&h=300&q=80";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryUrl(index)}
                          className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-md cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT Sidebar: Save + Tips ─────────────────── */}
        <div className="space-y-6 lg:sticky lg:top-6">
          <div className="bg-canvas border border-ink/10 rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-black text-ink uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary-hover" />
              Pro Tips
            </h4>
            <p className="text-[11px] text-body-text leading-relaxed font-semibold">
              Your address is shown to clients as a live Google Maps embed — no API key required.
            </p>
            <p className="text-[11px] text-body-text leading-relaxed">
              Opening hours display on your booking page. Mark days as "Closed" to block that day automatically.
            </p>
            <p className="text-[11px] text-body-text leading-relaxed">
              Use high-resolution square images for the profile and landscape for gallery.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full button-primary py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs md:text-sm font-bold"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
