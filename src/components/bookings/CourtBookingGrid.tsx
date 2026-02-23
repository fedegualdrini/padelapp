"use client";

import { useState, useEffect } from "react";
import { getCourtAvailability } from "@/lib/data";

interface TimeSlot {
  startHour: number;
  endHour: number;
  label: string;
}

interface BookedSlot {
  start_time: string;
  end_time: string;
  status: string;
}

interface CourtBookingGridProps {
  courtId: string;
  selectedDate: Date;
  onSelectSlot: (startTime: string, endTime: string, duration: number) => void;
  selectedSlot?: { startTime: string; endTime: string };
}

export function CourtBookingGrid({
  courtId,
  selectedDate,
  onSelectSlot,
  selectedSlot,
}: CourtBookingGridProps) {
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate time slots from 6 AM to 11 PM
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 6; hour < 23; hour++) {
      slots.push({
        startHour: hour,
        endHour: hour + 1,
        label: `${hour.toString().padStart(2, "0")}:00`,
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  useEffect(() => {
    loadAvailability();
  }, [courtId, selectedDate]);

  const loadAvailability = async () => {
    setIsLoading(true);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const availability = await getCourtAvailability(courtId, startOfDay, endOfDay);
    setBookedSlots(availability);
    setIsLoading(false);
  };

  const isSlotBooked = (hour: number) => {
    return bookedSlots.some((slot) => {
      const slotTime = new Date(slot.start_time);
      return slotTime.getHours() === hour && slot.status !== "cancelled";
    });
  };

  const isSlotSelected = (hour: number) => {
    if (!selectedSlot) return false;
    const startTime = new Date(selectedSlot.startTime);
    return startTime.getHours() === hour;
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (isSlotBooked(slot.startHour)) return;

    const startTime = new Date(selectedDate);
    startTime.setHours(slot.startHour, 0, 0, 0);

    const endTime = new Date(selectedDate);
    endTime.setHours(slot.endHour, 0, 0, 0);

    onSelectSlot(
      startTime.toISOString(),
      endTime.toISOString(),
      60 // 1 hour duration
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex justify-center items-center h-64">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">
            refresh
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      <h3 className="text-background-dark dark:text-white font-bold text-lg mb-4">
        Horarios Disponibles
      </h3>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {timeSlots.map((slot) => {
          const booked = isSlotBooked(slot.startHour);
          const selected = isSlotSelected(slot.startHour);

          return (
            <button
              key={slot.label}
              onClick={() => handleSlotClick(slot)}
              disabled={booked}
              className={`py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                booked
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed line-through"
                  : selected
                  ? "bg-primary text-background-dark shadow-lg scale-105"
                  : "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary dark:hover:border-primary hover:text-primary dark:hover:text-primary"
              }`}
            >
              {slot.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700"></div>
          <span className="text-slate-600 dark:text-slate-400">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 line-through"></div>
          <span className="text-slate-600 dark:text-slate-400">Reservado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary"></div>
          <span className="text-slate-600 dark:text-slate-400">Seleccionado</span>
        </div>
      </div>
    </div>
  );
}
