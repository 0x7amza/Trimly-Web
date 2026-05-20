"use client";

import React, { useState, useEffect } from "react";
import { api, mockDb, Booking, Service } from "@/lib/api";
import { useB2BAuth } from "@/components/providers";

export default function CalendarPage() {
  const { activeBarber } = useB2BAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  });

  // Modal States
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Details Modal
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Fetch data
  const loadData = async () => {
    if (!activeBarber) return;
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
      setIsQuickAddOpen(true);
    }
  };

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !selectedServiceId) return;

    try {
      const startTime = `${selectedDate}T${selectedSlot}:00.000Z`;
      const res = await api.bookings.createManual({
        serviceId: selectedServiceId,
        startTime,
        customerName: customerName || "Walk-in Customer",
        customerPhone,
        notes,
      });

      if (res.success) {
        // Reset forms
        setCustomerName("");
        setCustomerPhone("");
        setNotes("");
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
            Click on any empty slot to instantly add a manual walk-in booking.
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

      {/* Timeline Grid */}
      <div className="bg-canvas rounded-wise shadow-sm border border-ink/5 overflow-hidden flex flex-col divide-y divide-ink/5">
        {slots.map((timeStr) => {
          const booking = getBookingForSlot(timeStr);
          const isStart = booking ? isSlotStartOfBooking(timeStr, booking) : false;

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
                        booking.type === "ONLINE"
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
                          {booking.serviceSnapshot.name} — {booking.notes || "No notes"}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/60">
                          {booking.type}
                        </span>
                      </div>
                      <span className="text-xs opacity-75">
                        {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{" "}
                        {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ) : null
                ) : (
                  <div className="w-full h-full flex items-center px-4 text-xs text-mute-text opacity-0 hover:opacity-100 font-semibold transition-opacity">
                    + Click to Quick-Add Booking
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick-Add Walk-in Modal */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-canvas rounded-wise p-6 border border-ink/5 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-ink">Quick-Add Booking</h3>
              <button
                onClick={() => setIsQuickAddOpen(false)}
                className="text-mute-text hover:text-ink font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="space-y-4">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-1">
                  Selected Time Slot
                </span>
                <span className="text-sm font-bold bg-canvas-soft px-3 py-1.5 rounded-lg text-ink inline-block">
                  {selectedSlot} on {selectedDate}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-2">
                  Select Service
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="text-input"
                  required
                >
                  <option value="" disabled>-- Select Service --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (£{(s.price / 100).toFixed(2)}) — {s.durationMinutes} min
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-2">
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Walk-in Customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="text-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-2">
                  Phone / WhatsApp (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +447000000000"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="text-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-2">
                  Appointment Notes
                </label>
                <textarea
                  placeholder="e.g. skin fade / quick beard trim"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-input h-20"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="button-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="button-primary flex-1">
                  Save Walk-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {isDetailsOpen && selectedBooking && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-canvas rounded-wise p-6 border border-ink/5 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-ink">Booking Details</h3>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="text-mute-text hover:text-ink font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-1">
                    Service Name
                  </span>
                  <span className="font-extrabold text-ink">{selectedBooking.serviceSnapshot.name}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-1">
                    Service Price
                  </span>
                  <span className="font-extrabold text-ink">
                    £{(selectedBooking.serviceSnapshot.price / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-1">
                    Start Time
                  </span>
                  <span className="text-sm font-bold text-ink">
                    {new Date(selectedBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-1">
                    End Time
                  </span>
                  <span className="text-sm font-bold text-ink">
                    {new Date(selectedBooking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-1">
                  Notes
                </span>
                <p className="text-sm text-body-text bg-canvas-soft p-3 rounded-lg">
                  {selectedBooking.notes || "No notes provided."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-1">
                    Booking Source
                  </span>
                  <span className="badge-positive font-bold">{selectedBooking.type}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-1">
                    Payment Status
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    selectedBooking.paymentStatus === "PAID"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {selectedBooking.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="pt-6 flex gap-3 border-t border-ink/5">
                <button
                  onClick={() => handleStatusChange("CANCELLED")}
                  className="button-tertiary flex-1 !text-negative border-negative hover:!bg-negative/5"
                >
                  Cancel Booking
                </button>
                <button
                  onClick={() => handleStatusChange("COMPLETED")}
                  className="button-primary flex-1"
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
