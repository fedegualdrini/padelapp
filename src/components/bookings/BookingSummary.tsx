"use client";

import { useState } from "react";
import { createBookingAction } from "@/app/actions/bookings";

interface BookingSummaryProps {
  venueId: string;
  venueName: string;
  courtId: string;
  courtName: string;
  groupId: string;
  selectedDate: Date;
  selectedSlot?: { startTime: string; endTime: string };
  hourlyRate: number; // in cents
  onClose?: () => void;
}

export function BookingSummary({
  venueId,
  venueName,
  courtId,
  courtName,
  groupId,
  selectedDate,
  selectedSlot,
  hourlyRate,
  onClose,
}: BookingSummaryProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const durationMinutes = 60; // Fixed at 1 hour for now
  const totalCents = hourlyRate;

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;

    setIsSubmitting(true);
    setError(null);

    const result = await createBookingAction({
      venueId,
      courtId,
      groupId,
      date: selectedDate.toISOString().split("T")[0],
      startTime: new Date(selectedSlot.startTime).toTimeString().slice(0, 5),
      durationMinutes,
      totalCents,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } else {
      setError(result.error || "Error al crear reserva");
    }
  };

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!selectedSlot) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sticky top-24">
        <h3 className="text-background-dark dark:text-white font-bold text-lg mb-4">
          Resumen de Reserva
        </h3>
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-3 block">event_busy</span>
          <p>Selecciona un horario para ver el resumen</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sticky top-24">
      <h3 className="text-background-dark dark:text-white font-bold text-lg mb-4">
        Resumen de Reserva
      </h3>

      <div className="space-y-4">
        {/* Venue */}
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 font-bold mb-1">
            Club
          </p>
          <p className="text-background-dark dark:text-white font-semibold">{venueName}</p>
        </div>

        {/* Court */}
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 font-bold mb-1">
            Pista
          </p>
          <p className="text-background-dark dark:text-white font-semibold">{courtName}</p>
        </div>

        {/* Date */}
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 font-bold mb-1">
            Fecha
          </p>
          <p className="text-background-dark dark:text-white font-semibold">
            {formatDate(selectedDate)}
          </p>
        </div>

        {/* Time */}
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 font-bold mb-1">
            Horario
          </p>
          <p className="text-background-dark dark:text-white font-semibold">
            {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
          </p>
          <p className="text-slate-500 text-sm">{durationMinutes} minutos</p>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          {/* Price */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-600 dark:text-slate-400">Precio por hora</span>
            <span className="text-background-dark dark:text-white font-semibold">
              {formatPrice(hourlyRate)}
            </span>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center bg-primary/10 p-3 rounded-lg">
            <span className="text-background-dark dark:text-primary font-bold">Total</span>
            <span className="text-background-dark dark:text-primary font-black text-xl">
              {formatPrice(totalCents)}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 p-3 rounded-lg text-sm flex items-center gap-2">
            <span className="material-symbols-outlined">check_circle</span>
            ¡Reserva creada con éxito!
          </div>
        )}

        {/* Confirm Button */}
        <button
          onClick={handleConfirmBooking}
          disabled={isSubmitting || success}
          className="w-full bg-primary text-background-dark font-bold py-3 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="material-symbols-outlined animate-spin">refresh</span>
              Procesando...
            </>
          ) : success ? (
            <>
              <span className="material-symbols-outlined">check_circle</span>
              Confirmado
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">confirmation_number</span>
              Confirmar Reserva
            </>
          )}
        </button>

        {/* Cancel Button */}
        {onClose && !success && (
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full text-slate-600 dark:text-slate-400 font-medium py-2 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
