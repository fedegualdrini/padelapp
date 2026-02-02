"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2, ArrowLeft } from "lucide-react";
import { submitVenueRatingBySlugs } from "@/lib/venue-actions";

interface RatingPageProps {
  params: { slug: string; venueSlug: string };
}

interface RatingDimension {
  key: string;
  label: string;
  description: string;
}

const dimensions: RatingDimension[] = [
  { key: "court_quality", label: "Calidad de cancha", description: "Estado de las paredes, red y piso" },
  { key: "lighting", label: "Iluminación", description: "Calidad y distribución de la luz" },
  { key: "comfort", label: "Comodidad", description: "Temperatura, ventilación, espacio" },
  { key: "amenities", label: "Servicios", description: "Vestuarios, duchas, lockers" },
  { key: "accessibility", label: "Accesibilidad", description: "Estacionamiento, transporte, ubicación" },
  { key: "atmosphere", label: "Ambiente", description: "Vibe general, organización, limpieza" },
];

export default function VenueRatingPage({ params }: RatingPageProps) {
  const { slug, venueSlug } = params;
  const router = useRouter();

  const [ratings, setRatings] = useState<Record<string, number>>({
    court_quality: 0,
    lighting: 0,
    comfort: 0,
    amenities: 0,
    accessibility: 0,
    atmosphere: 0,
  });
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const overallRating = Object.values(ratings).reduce((a, b) => a + b, 0) / 6;
  const canSubmit = Object.values(ratings).every((r) => r > 0);

  const handleStarClick = (dimension: string, value: number) => {
    setRatings((prev) => ({ ...prev, [dimension]: value }));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const result = await submitVenueRatingBySlugs({
        venueSlug,
        groupSlug: slug,
        court_quality: ratings.court_quality,
        lighting: ratings.lighting,
        comfort: ratings.comfort,
        amenities: ratings.amenities,
        accessibility: ratings.accessibility,
        atmosphere: ratings.atmosphere,
        review_text: review.trim() || undefined,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to submit rating");
      }

      router.push(`/g/${slug}/venues/${venueSlug}`);
      router.refresh();
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Error al enviar la calificación");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex w-fit items-center gap-2 rounded-full border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      <header>
        <h2 className="font-display text-2xl text-[var(--ink)]">Calificar cancha</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Compartí tu experiencia para ayudar a otros jugadores.</p>
      </header>

      <section className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--ink)]">Calificación general</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
              {overallRating > 0 ? overallRating.toFixed(1) : "—"}
            </span>
            <span className="text-sm text-amber-600/70 dark:text-amber-400/70">/ 5</span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {dimensions.map((dim) => (
          <div
            key={dim.key}
            className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-base text-[var(--ink)]">{dim.label}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">{dim.description}</p>
              </div>
              <span className="w-8 text-right text-lg font-semibold text-[var(--ink)]">{ratings[dim.key] || "—"}</span>
            </div>

            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleStarClick(dim.key, value)}
                  className="rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  aria-label={`${dim.label}: ${value} estrellas`}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      value <= ratings[dim.key]
                        ? "fill-amber-500 text-amber-500"
                        : "text-[color:var(--card-border)] hover:text-amber-400"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <label className="block text-sm font-semibold text-[var(--ink)]">Reseña (opcional)</label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Contanos cómo te fue en esta cancha..."
          className="mt-2 w-full min-h-[120px] rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] p-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          maxLength={500}
        />
        <div className="mt-1 text-right text-xs text-[var(--muted)]">{review.length}/500</div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-5 py-2 text-sm font-semibold text-[var(--ink)] transition hover:-translate-y-0.5"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="flex-1 rounded-full bg-[color:var(--accent)] px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[color:var(--accent)]/90 disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </span>
          ) : (
            "Enviar calificación"
          )}
        </button>
      </div>
    </div>
  );
}
