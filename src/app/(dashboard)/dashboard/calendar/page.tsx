"use client";

import React, { useState, useEffect } from "react";
import { api, Booking, Service } from "@/lib/api";
import { useB2BAuth } from "@/components/providers";

export default function CalendarPage() {
  const { activeBarber } = useB2BAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  });
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [bookingMode, setBookingMode] = useState<"WALKIN" | "BLOCK">("WALKIN");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [blockDuration, setBlockDuration] = useState(30); // in minutes
  const [blockReason, setBlockReason] = useState("");

  // Details Modal
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Fetch data
  const loadData = async () => {
    if (!activeBarber) return;
    setIsLoading(true);
    try {
      const bookingsRes = await api.bookings.getBarberBookings();
      const servicesRes = await api.services.getBarberServices(activeBarber.clerkId);

      if (bookingsRes.success) {
        // Filter locally by selected date in YYYY-MM-DD format
        const dayBookings = bookingsRes.data.filter(b => b.startTime.startsWith(selectedDate));
        setBookings(dayBookings);
      }
      if (servicesRes.success) {
        setServices(servicesRes.data);
        if (servicesRes.data.length > 0) {
          setSelectedServiceId(servicesRes.data[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading calendar data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeBarber, selectedDate]);

  // Generate 15-minute timeline slots from 09:00 to 18:00
  const generateTimeSlots = () => {
    const slots = [];
    const openTime = 9 * 60; // 09:00 in minutes
    const closeTime = 18 * 60; // 18:00 in minutes
    for (let min = openTime; min < closeTime; min += 15) {
      const hh = Math.floor(min / 60).toString().padStart(2, "0");
      const mm = (min % 60).toString().padStart(2, "0");
      slots.push(`${hh}:${mm}`);
    }
    return slots;
  };

  const slots = generateTimeSlots();

  // Find booking that starts at or spans across a given slot
  const getBookingForSlot = (timeStr: string) => {
    const slotTimeStr = `${selectedDate}T${timeStr}:00.000Z`;
    const slotTime = new Date(slotTimeStr).getTime();

    return bookings.find(b => {
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      return slotTime >= bStart && slotTime < bEnd;
    });
  };

  // Check if slot is the start of a booking (so we render the badge only once)
  const isSlotStartOfBooking = (timeStr: string, booking: Booking) => {
    const slotTimeStr = `${selectedDate}T${timeStr}:00.000Z`;
    const slotTime = new Date(slotTimeStr).getTime();
    const bStart = new Date(booking.startTime).getTime();
    // Allow 5s variance for parsing
    return Math.abs(slotTime - bStart) < 5000;
  };

  const handleSlotClick = (timeStr: string, existingBooking?: Booking) => {
    if (existingBooking) {
      setSelectedBooking(existingBooking);
      setIsDetailsOpen(true);
    } else {
      setSelectedSlot(timeStr);
      setBookingMode("WALKIN");
      setIsQuickAddOpen(true);
    }
  };

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    try {
      const startTime = `${selectedDate}T${selectedSlot}:00.000Z`;
      let res;
      if (bookingMode === "BLOCK") {
        res = await api.bookings.createManual({
          serviceId: selectedServiceId || (services[0]?.id || ""),
          startTime,
          notes: `[BLOCKED] ${blockReason || "Blocked slot"}`,
          durationMinutes: blockDuration,
        });
      } else {
        if (!selectedServiceId) return;
        res = await api.bookings.createManual({
          serviceId: selectedServiceId,
          startTime,
          customerName: customerName || "Walk-in Customer",
          customerPhone,
          notes,
        });
      }

      if (res.success) {
        // Reset forms
        setCustomerName("");
        setCustomerPhone("");
        setNotes("");
        setBlockReason("");
        setBookingMode("WALKIN");
        setIsQuickAddOpen(false);
        loadData(); // reload
      }
    } catch (err) {
      alert("Error adding booking: Time slot may be overlapping.");
    }
  };

  const handleStatusChange = async (status: "CANCELLED" | "COMPLETED") => {
    if (!selectedBooking) return;
    try {
      const res = await api.bookings.updateStatus(selectedBooking.id, status);
      if (res.success) {
        setIsDetailsOpen(false);
        setSelectedBooking(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Date selector and title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-ink">Schedule Timeline</h1>
          <p className="text-sm text-body-text">
            Click on any empty slot to instantly add a manual walk-in booking or block out time.
          </p>
        </div>

        {/* Date Selector Input */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const prev = new Date(selectedDate);
              prev.setDate(prev.getDate() - 1);
              setSelectedDate(prev.toISOString().split("T")[0]);
            }}
            className="button-secondary !p-3 rounded-full"
          >
            ←
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-input font-bold"
          />
          <button
            onClick={() => {
              const next = new Date(selectedDate);
              next.setDate(next.getDate() + 1);
              setSelectedDate(next.toISOString().split("T")[0]);
            }}
            className="button-secondary !p-3 rounded-full"
          >
            →
          </button>
        </div>
      </div>

      {/* Timeline loading skeletons or main grid */}
      {isLoading ? (
        <div className="bg-canvas rounded-wise shadow-sm border border-ink/5 overflow-hidden flex flex-col divide-y divide-ink/5 animate-pulse">
          {slots.slice(0, 10).map((timeStr) => (
            <div key={timeStr} className="flex min-h-[56px] items-center">
              <div className="w-20 px-4 py-3 border-r border-ink/5 flex justify-end">
                <div className="h-4 w-10 bg-ink/10 rounded"></div>
              </div>
              <div className="flex-grow p-4">
                <div className="h-4 w-1/3 bg-ink/10 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Timeline Grid */
        <div className="bg-canvas rounded-wise shadow-sm border border-ink/5 overflow-hidden flex flex-col divide-y divide-ink/5">
          {slots.map((timeStr) => {
            const booking = getBookingForSlot(timeStr);
            const isStart = booking ? isSlotStartOfBooking(timeStr, booking) : false;
            const isBlocked = booking?.notes?.startsWith("[BLOCKED]") || booking?.serviceSnapshot?.name === "Blocked Time";

            return (
              <div
                key={timeStr}
                onClick={() => handleSlotClick(timeStr, booking)}
                className="flex min-h-[56px] transition-colors hover:bg-canvas-soft/30 cursor-pointer"
              >
                {/* Hour Label */}
                <div className="w-20 px-4 py-3 text-xs font-bold text-mute-text border-r border-ink/5 flex items-center justify-end">
                  {timeStr}
                </div>

                {/* Slot Area */}
                <div className="flex-grow p-1 relative flex items-stretch">
                  {booking ? (
                    isStart ? (
                      <div
                        className={`w-full rounded-xl px-4 py-2 flex flex-col justify-center text-left ${
                          isBlocked
                            ? "bg-canvas-soft text-mute-text border border-ink/10"
                            : booking.type === "ONLINE"
                            ? "bg-primary-pale text-ink-deep border border-primary/20"
                            : "bg-emerald-50 text-emerald-950 border border-emerald-200"
                        }`}
                        style={{
                          minHeight: `${(booking.serviceSnapshot.durationMinutes / 15) * 56 - 8}px`,
                          zIndex: 10,
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm">
                            {isBlocked
                              ? `Blocked: ${booking.notes?.replace("[BLOCKED]", "").trim() || "No reason"}`
                              : `${booking.serviceSnapshot.name} — ${booking.notes || "No notes"}`}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/60">
                            {isBlocked ? "BLOCKED" : booking.type}
                          </span>
                        </div>
                        <span className="text-xs opacity-75">
                          {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} -{" "}
                          {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                        </span>
                      </div>
                    ) : null
                  ) : (
                    <div className="w-full h-full flex items-center px-4 text-xs text-mute-text opacity-0 hover:opacity-100 font-semibold transition-opacity">
                      + Click to Quick-Add Booking / Block Time
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick-Add Walk-in / Block Modal */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-ink/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black text-ink tracking-tight">Quick-Add Schedule</h3>
                <p className="text-[10px] text-mute-text font-semibold uppercase tracking-wider">Add slot at {selectedSlot}</p>
              </div>
              <button
                onClick={() => setIsQuickAddOpen(false)}
                className="w-8 h-8 rounded-full border border-ink/10 flex items-center justify-center text-mute-text hover:text-ink transition-colors text-sm hover:bg-canvas-soft"
              >
                ✕
              </button>
            </div>

            {/* Toggle tabs for Walk-in Booking vs Block Time */}
            <div className="flex bg-canvas-soft p-1 rounded-xl mb-6 border border-ink/5">
              <button
                type="button"
                onClick={() => setBookingMode("WALKIN")}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  bookingMode === "WALKIN"
                    ? "bg-white text-ink shadow-sm border border-ink/5"
                    : "text-mute-text hover:text-ink"
                }`}
              >
                Walk-In Booking
              </button>
              <button
                type="button"
                onClick={() => setBookingMode("BLOCK")}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  bookingMode === "BLOCK"
                    ? "bg-white text-ink shadow-sm border border-ink/5"
                    : "text-mute-text hover:text-ink"
                }`}
              >
                Block Time
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="space-y-4">
              {bookingMode === "WALKIN" ? (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-body-text">
                      Select Service
                    </label>
                    <div className="relative">
                      <select
                        value={selectedServiceId}
                        onChange={(e) => setSelectedServiceId(e.target.value)}
                        className="w-full bg-canvas border border-ink/10 rounded-xl py-3 pl-4 pr-10 text-xs font-bold text-ink focus:outline-none focus:border-ink transition-colors shadow-sm appearance-none cursor-pointer"
                        required
                      >
                        <option value="" disabled>-- Select Service --</option>
                        {(() => {
                          // Group services by categoryName
                          const grouped: Record<string, typeof services> = {};
                          services.forEach((s) => {
                            const cat = s.categoryName || s.category || "General Services";
                            if (!grouped[cat]) grouped[cat] = [];
                            grouped[cat].push(s);
                          });
                          const keys = Object.keys(grouped);
                          return keys.map((cat) => (
                            <optgroup key={cat} label={cat}>
                              {grouped[cat].map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} (£{(s.price / 100).toFixed(2)}) — {s.durationMinutes} min
                                </option>
                              ))}
                            </optgroup>
                          ));
                        })()}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-mute-text">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-body-text">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Walk-in Customer"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-canvas border border-ink/10 rounded-xl py-3 px-4 text-xs font-bold text-ink placeholder:text-mute-text/40 focus:outline-none focus:border-ink transition-colors shadow-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-body-text">
                      Phone / WhatsApp (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +447000000000"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-canvas border border-ink/10 rounded-xl py-3 px-4 text-xs font-bold text-ink placeholder:text-mute-text/40 focus:outline-none focus:border-ink transition-colors shadow-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-body-text">
                      Appointment Notes
                    </label>
                    <textarea
                      placeholder="e.g. skin fade / quick beard trim"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-canvas border border-ink/10 rounded-xl py-3 px-4 text-xs font-bold text-ink placeholder:text-mute-text/40 focus:outline-none focus:border-ink transition-colors shadow-sm h-20 resize-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-body-text">
                      Block Duration
                    </label>
                    <div className="relative">
                      <select
                        value={blockDuration}
                        onChange={(e) => setBlockDuration(Number(e.target.value))}
                        className="w-full bg-canvas border border-ink/10 rounded-xl py-3 pl-4 pr-10 text-xs font-bold text-ink focus:outline-none focus:border-ink transition-colors shadow-sm appearance-none cursor-pointer"
                        required
                      >
                        <option value={15}>15 Minutes</option>
                        <option value={30}>30 Minutes</option>
                        <option value={45}>45 Minutes</option>
                        <option value={60}>1 Hour</option>
                        <option value={120}>2 Hours</option>
                        <option value={180}>3 Hours</option>
                        <option value={240}>4 Hours</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-mute-text">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-body-text">
                      Block Reason / Notes
                    </label>
                    <textarea
                      placeholder="e.g. Lunch Break, Personal Errands, Shop Maintenance"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      className="w-full bg-canvas border border-ink/10 rounded-xl py-3 px-4 text-xs font-bold text-ink placeholder:text-mute-text/40 focus:outline-none focus:border-ink transition-colors shadow-sm h-24 resize-none"
                      required
                    />
                  </div>
                </>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="button-secondary flex-1 cursor-pointer py-3"
                >
                  Cancel
                </button>
                <button type="submit" className="button-primary flex-1 cursor-pointer py-3">
                  {bookingMode === "BLOCK" ? "Block Time" : "Save Walk-In"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {isDetailsOpen && selectedBooking && (
        <div className="fixed inset-0 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-ink/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black text-ink tracking-tight">Booking Info</h3>
                <p className="text-[10px] text-mute-text font-semibold uppercase tracking-wider">
                  ID: {selectedBooking.id}
                </p>
              </div>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="w-8 h-8 rounded-full border border-ink/10 flex items-center justify-center text-mute-text hover:text-ink transition-colors text-sm hover:bg-canvas-soft"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-ink/5">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-mute-text mb-0.5">
                    Service Offered
                  </span>
                  <span className="font-extrabold text-sm text-ink">{selectedBooking.serviceSnapshot.name}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-mute-text mb-0.5">
                    Price Taken
                  </span>
                  <span className="font-extrabold text-sm text-ink">
                    £{(selectedBooking.serviceSnapshot.price / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-ink/5">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-mute-text mb-0.5">
                    Start Time
                  </span>
                  <span className="text-xs font-bold text-ink bg-canvas-soft px-2.5 py-1 rounded-md inline-block">
                    {new Date(selectedBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-mute-text mb-0.5">
                    End Time
                  </span>
                  <span className="text-xs font-bold text-ink bg-canvas-soft px-2.5 py-1 rounded-md inline-block">
                    {new Date(selectedBooking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-mute-text mb-1">
                  Notes & Details
                </span>
                <p className="text-xs font-semibold text-body-text bg-canvas-soft/70 p-3.5 rounded-xl border border-ink/5 leading-relaxed">
                  {selectedBooking.notes?.startsWith("[BLOCKED]")
                    ? selectedBooking.notes.replace("[BLOCKED]", "").trim()
                    : selectedBooking.notes || "No additional notes provided for this job."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-mute-text mb-1">
                    Booking Mode
                  </span>
                  <span className="badge-positive inline-block text-[10px] font-bold uppercase tracking-wider">
                    {selectedBooking.notes?.startsWith("[BLOCKED]") ? "BLOCKED" : selectedBooking.type}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-mute-text mb-1">
                    Payment Status
                  </span>
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                    selectedBooking.paymentStatus === "PAID"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {selectedBooking.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="pt-6 flex gap-3 border-t border-ink/10">
                <button
                  onClick={() => handleStatusChange("CANCELLED")}
                  className="button-tertiary flex-1 !text-negative border-negative hover:!bg-negative/5 cursor-pointer py-3 text-xs"
                >
                  Cancel Booking
                </button>
                <button
                  onClick={() => handleStatusChange("COMPLETED")}
                  className="button-primary flex-1 cursor-pointer py-3 text-xs"
                >
                  Complete Job
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
