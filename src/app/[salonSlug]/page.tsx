"use client";

import React, { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, Barber, Service, Customer } from "@/lib/api";

export default function SalonBookingPage({
  params,
}: {
  params: Promise<{ salonSlug: string }>;
}) {
  const { salonSlug } = use(params);

  // Shop state
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Flow control: 1 = Barber, 2 = Service, 3 = Date & Time, 4 = Verification, 5 = Payment/Success
  const [step, setStep] = useState(1);

  // Time & Date selection
  const [dates, setDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Customer Auth
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);

  // Payment Simulation
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);

  // Init dates (next 7 days starting from today)
  useEffect(() => {
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    setDates(arr);
    setSelectedDate(arr[0].toISOString().split("T")[0]);
  }, []);

  // Fetch shop barbers
  useEffect(() => {
    const fetchShop = async () => {
      try {
        const res = await api.shops.getBySlug(salonSlug);
        if (res.success) {
          setBarbers(res.data.barbers);
          // If only 1 barber, auto-select and skip to services
          if (res.data.barbers.length === 1) {
            setSelectedBarber(res.data.barbers[0]);
            setStep(2);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchShop();
  }, [salonSlug]);

  // Fetch services when barber is selected
  useEffect(() => {
    if (!selectedBarber) return;
    const fetchServices = async () => {
      try {
        const res = await api.services.getBarberServices(selectedBarber.clerkId);
        if (res.success) {
          setServices(res.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchServices();
  }, [selectedBarber]);

  // Fetch slots when date, barber, or service changes
  useEffect(() => {
    if (!selectedBarber || !selectedService || !selectedDate) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const res = await api.bookings.getAvailability(
          selectedBarber.clerkId,
          selectedService.id,
          selectedDate
        );
        if (res.success) {
          setAvailableSlots(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedBarber, selectedService, selectedDate]);

  // Actions
  const handleSelectBarber = (barber: Barber) => {
    setSelectedBarber(barber);
    setStep(2);
  };

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setStep(3);
  };

  const handleSelectSlot = (slot: string) => {
    setSelectedSlot(slot);
    setStep(4);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    try {
      const res = await api.auth.sendOtp(phone);
      if (res.success) {
        setIsOtpSent(true);
      }
    } catch (err) {
      alert("Error sending OTP. Please try again.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !otpCode) return;
    setIsVerifying(true);
    try {
      const res = await api.auth.verifyOtp(phone, otpCode);
      if (res.success) {
        setCustomer(res.data.customer);
        // Advance to step 5 (Stripe checkout)
        setStep(5);
      }
    } catch (err) {
      alert("Invalid OTP code. Please enter 6-digit mock OTP.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarber || !selectedService || !selectedSlot) return;
    setIsPaying(true);

    try {
      const res = await api.bookings.createOnline({
        barberId: selectedBarber.clerkId,
        serviceId: selectedService.id,
        startTime: selectedSlot,
      });

      if (res.success) {
        setConfirmedBookingId(res.data.booking.id);
        setStep(6); // Success screen
      }
    } catch (err) {
      alert("Booking failed. Please try a different slot.");
    } finally {
      setIsPaying(false);
    }
  };

  const resetFlow = () => {
    setSelectedService(null);
    setSelectedSlot(null);
    setIsOtpSent(false);
    setOtpCode("");
    setConfirmedBookingId(null);
    setStep(barbers.length === 1 ? 2 : 1);
  };

  return (
    <div className="flex-grow p-6 flex flex-col justify-start relative">
      {/* Progress Bar (steps 1 to 5) */}
      {step <= 5 && (
        <div className="mb-6 bg-canvas-soft h-1.5 rounded-full overflow-hidden flex">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          ></div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* STEP 1: Barber selection */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 flex-grow flex flex-col"
          >
            <div>
              <h2 className="text-xl font-black text-ink">Select a Barber</h2>
              <p className="text-xs text-body-text">Choose your styling specialist.</p>
            </div>

            <div className="space-y-3 flex-grow overflow-y-auto">
              {barbers.map((b) => (
                <div
                  key={b.id}
                  onClick={() => handleSelectBarber(b)}
                  className="card-content border border-ink/5 p-4 flex items-center justify-between cursor-pointer hover:bg-canvas-soft/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary flex items-center justify-center font-bold text-lg rounded-full border border-ink/10">
                      {b.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <span className="block font-bold text-sm text-ink">{b.name}</span>
                      <span className="block text-[11px] text-mute-text">{b.role}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary-deep bg-primary-pale px-2.5 py-1 rounded-full">
                    Select →
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 2: Service Selection */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 flex-grow flex flex-col"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-ink">Select a Service</h2>
                <p className="text-xs text-body-text">Choose the cut or styling package.</p>
              </div>
              {barbers.length > 1 && (
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-body-text hover:text-ink underline"
                >
                  Change Barber
                </button>
              )}
            </div>

            <div className="space-y-3 flex-grow overflow-y-auto">
              {services.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSelectService(s)}
                  className="card-content border border-ink/5 p-4 flex items-center justify-between cursor-pointer hover:bg-canvas-soft/30 transition-colors"
                >
                  <div>
                    <span className="block font-bold text-sm text-ink">{s.name}</span>
                    <span className="block text-xs text-mute-text">{s.durationMinutes} min duration</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-black text-ink text-sm">
                      £{(s.price / 100).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-positive font-bold">Select</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 3: Date & Time Selector */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 flex-grow flex flex-col"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-ink">Select Date & Time</h2>
                <p className="text-xs text-body-text">Choose an available appointment slot.</p>
              </div>
              <button
                onClick={() => setStep(2)}
                className="text-xs font-bold text-body-text hover:text-ink underline"
              >
                Back to Services
              </button>
            </div>

            {/* Horizontal Date Bar */}
            <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none">
              {dates.map((d) => {
                const isSelected = d.toISOString().split("T")[0] === selectedDate;
                const dayName = d.toLocaleDateString([], { weekday: "short" });
                const dayNum = d.getDate();

                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => setSelectedDate(d.toISOString().split("T")[0])}
                    className={`flex flex-col items-center justify-center min-w-[56px] h-16 rounded-xl border font-bold text-xs transition-all ${
                      isSelected
                        ? "bg-ink text-white border-ink"
                        : "bg-canvas text-body-text border-ink/5 hover:border-ink/20"
                    }`}
                  >
                    <span>{dayName}</span>
                    <span className="text-sm font-extrabold mt-1">{dayNum}</span>
                  </button>
                );
              })}
            </div>

            {/* Slots Grid */}
            <div className="flex-grow overflow-y-auto">
              {loadingSlots ? (
                <div className="flex items-center justify-center min-h-[150px]">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="card-feature-sage p-8 text-center text-sm font-bold text-body-text border border-ink/5">
                  No slots available on this date. Try another day.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {availableSlots.map((slot) => {
                    const time = new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <button
                        key={slot}
                        onClick={() => handleSelectSlot(slot)}
                        className="bg-canvas border border-ink/5 hover:border-primary font-bold text-xs p-3 rounded-xl text-ink transition-colors hover:bg-primary-pale"
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 4: WhatsApp Verification Drawer */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 flex-grow flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-ink">Client Verification</h2>
                  <p className="text-xs text-body-text">Verify booking with mock WhatsApp OTP.</p>
                </div>
                <button
                  onClick={() => setStep(3)}
                  className="text-xs font-bold text-body-text hover:text-ink underline"
                >
                  Back to Time
                </button>
              </div>

              {!isOtpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-2">
                      WhatsApp Mobile Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +447000000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="text-input font-bold"
                      required
                    />
                  </div>
                  <button type="submit" className="button-primary w-full py-4">
                    Send Verification Code
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="bg-primary-pale p-3 rounded-xl border border-primary/20 text-xs font-bold text-ink-deep text-center">
                    Mock OTP Code: enter <strong>123456</strong>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-2">
                      Enter 6-Digit Passcode
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="text-input text-center font-extrabold text-2xl tracking-widest"
                      required
                    />
                  </div>
                  <button type="submit" className="button-primary w-full py-4" disabled={isVerifying}>
                    {isVerifying ? "Verifying..." : "Verify & Continue"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOtpSent(false)}
                    className="w-full text-center text-xs font-bold text-mute-text hover:text-ink mt-2"
                  >
                    Change phone number
                  </button>
                </form>
              )}
            </div>

            <div className="text-[10px] text-mute-text leading-relaxed">
              * Verification avoids spam scheduling. In mock mode, enter any phone and verification code <strong>123456</strong> to proceed.
            </div>
          </motion.div>
        )}

        {/* STEP 5: Payment & Finalize */}
        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 flex-grow flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-ink">Checkout Deposit</h2>
                  <p className="text-xs text-body-text">Secure deposit via credit card.</p>
                </div>
                <button
                  onClick={() => setStep(4)}
                  className="text-xs font-bold text-body-text hover:text-ink underline"
                >
                  Back to Verify
                </button>
              </div>

              {/* Order Summary */}
              <div className="bg-canvas-soft p-4 rounded-xl space-y-2.5">
                <span className="block text-[10px] font-bold text-mute-text uppercase tracking-wider">
                  Appointment Details
                </span>
                <div className="flex justify-between text-sm font-bold text-ink">
                  <span>{selectedService?.name}</span>
                  <span>£{((selectedService?.price || 0) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-body-text border-t border-ink/5 pt-2.5">
                  <span>Barber: {selectedBarber?.name}</span>
                  <span>
                    {selectedSlot && new Date(selectedSlot).toLocaleDateString()} at{" "}
                    {selectedSlot && new Date(selectedSlot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Card Inputs */}
              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="text-input"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM / YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="text-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-2">
                      CVC / CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="text-input"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="button-primary w-full py-4 mt-6" disabled={isPaying}>
                  {isPaying ? "Processing Card..." : `Pay Deposit & Book`}
                </button>
              </form>
            </div>

            <div className="text-[10px] text-mute-text text-center">
              🔒 Stripe Secure Checkout. Enter any mock values to complete booking.
            </div>
          </motion.div>
        )}

        {/* STEP 6: Success Confirmation Screen */}
        {step === 6 && (
          <motion.div
            key="step6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow flex flex-col justify-center items-center text-center space-y-6"
          >
            {/* Animated Success Checkmark Ring */}
            <div className="w-20 h-20 bg-primary-pale text-positive rounded-full flex items-center justify-center border border-primary/30">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <h2 className="text-2xl font-black text-ink">Booking Confirmed!</h2>
              <p className="text-sm text-body-text mt-2 max-w-xs mx-auto">
                Your appointment was successfully registered. We’ve sent a confirmation to your WhatsApp account.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="card-feature-sage p-4 w-full max-w-sm text-left space-y-2 border border-ink/5">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-mute-text">SERVICE</span>
                <span className="font-bold text-ink">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-bold text-mute-text">BARBER</span>
                <span className="font-bold text-ink">{selectedBarber?.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-bold text-mute-text">TIME SLOT</span>
                <span className="font-bold text-ink">
                  {selectedSlot && new Date(selectedSlot).toLocaleDateString()} at{" "}
                  {selectedSlot && new Date(selectedSlot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between text-xs border-t border-ink/5 pt-2 mt-2">
                <span className="font-bold text-mute-text">TRANSACTION</span>
                <span className="font-extrabold text-positive-deep">PAID IN FULL</span>
              </div>
            </div>

            <button onClick={resetFlow} className="button-primary px-8">
              Book Another Appointment
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
