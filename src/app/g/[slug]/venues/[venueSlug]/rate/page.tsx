"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
        Calificar cancha
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6">
        Comparte tu experiencia para ayudar a otros jugadores
      </p>

      {/* Overall Rating Preview */}
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-slate-700 dark:text-slate-300">Calificación general</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {overallRating > 0 ? overallRating.toFixed(1) : "—"}
            </span>
            <span className="text-amber-600/70 dark:text-amber-400/70">/ 5</span>
          </div>
        </div>
      </div>

      {/* Rating Dimensions */}
      <div className="space-y-6 mb-6">
        {dimensions.map((dim) => (
          <div key={dim.key} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-slate-100">{dim.label}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{dim.description}</p>
              </div>
              <span className="text-lg font-semibold text-slate-700 dark:text-slate-300 w-8 text-right">
                {ratings[dim.key] || "—"}
              </span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleStarClick(dim.key, value)}
                  className="p-1 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      value <= ratings[dim.key]
                        ? "text-amber-500 fill-amber-500"
                        : "text-slate-300 dark:text-slate-600 hover:text-amber-400"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Review Text */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 mb-6">
        <label className="block font-medium text-slate-900 dark:text-slate-100 mb-2">
          Reseña (opcional)
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Comparte tu experiencia en esta cancha..."
          className="w-full min-h-[120px] p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          maxLength={500}
        />
        <div className="text-right text-sm text-slate-500 mt-1">
          {review.length}/500 caracteres
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar calificación"
          )}
        </Button>
      </div>
    </div>
  );
}
