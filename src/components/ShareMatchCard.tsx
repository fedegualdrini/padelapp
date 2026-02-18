'use client';

import { useState } from 'react';
import { Share2, Copy, Check, Download, X } from 'lucide-react';

type EloDelta = {
  playerId: string;
  name: string;
  previous: number;
  current: number;
  delta: number;
};

type MatchTeam = {
  name: string;
  sets: number[];
  opponentSets: number[];
  isWinner: boolean;
};

type ShareMatchCardProps = {
  matchId: string;
  slug: string;
  playedAt: string;
  bestOf: number;
  teams: MatchTeam[];
  eloDeltas: EloDelta[];
  winner?: string;
  onClose?: () => void;
};

export function ShareButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] px-4 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[color:var(--card-border)] transition"
    >
      <Share2 className="h-4 w-4" />
      Compartir
    </button>
  );
}

export default function ShareMatchCard({
  matchId,
  slug,
  playedAt,
  bestOf,
  teams,
  eloDeltas,
  winner,
  onClose,
}: ShareMatchCardProps) {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const shareUrl = `${window.location.origin}/g/${slug}/matches/${matchId}`;
  const team1 = teams[0];
  const team2 = teams[1];

  const handleShare = async () => {
    // Try Web Share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Resultado de padel - ${team1.name} vs ${team2.name}`,
          text: `¡Mirá el resultado del partido de padel! ${team1.name} vs ${team2.name}`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }

    // Fallback: copy to clipboard
    await copyToClipboard();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const generateImage = async () => {
    setIsGenerating(true);
    // In a production environment, you would:
    // 1. Use html2canvas or similar library
    // 2. Convert the card to an image
    // 3. Trigger download

    // For now, we'll show a success message
    setTimeout(() => {
      setIsGenerating(false);
      alert('Imagen generada (funcionalidad de ejemplo)');
    }, 1000);
  };

  const scoreLine = (team1.sets ?? [])
    .map((s, i) => `${s}-${team1.opponentSets?.[i] ?? 0}`)
    .join(', ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-[var(--bg-base)] shadow-2xl">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-[var(--card-border)] p-2 text-[var(--muted)] hover:text-[var(--ink)] transition"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Shareable Card Content */}
        <div
          id="share-card-content"
          className="rounded-2xl border border-[color:var(--card-border)] bg-gradient-to-br from-[var(--card-glass)] to-[var(--card-solid)] p-6"
        >
          {/* Header */}
          <div className="mb-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              Resultado de Padel
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">{playedAt}</p>
          </div>

          {/* Teams & Score */}
          <div className="mb-4 space-y-3">
            {[team1, team2].map((team, idx) => (
              <div
                key={team.name}
                className={`rounded-xl border p-4 ${
                  team.isWinner
                    ? 'border-[#F2A900] bg-[#F2A900]/10'
                    : 'border-[color:var(--card-border)] bg-[color:var(--card-solid)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p
                    className={`text-lg font-bold ${
                      team.isWinner ? 'text-[#F2A900]' : 'text-[var(--ink)]'
                    }`}
                  >
                    {team.name}
                  </p>
                  {team.isWinner && (
                    <span className="rounded-full bg-[#F2A900] px-3 py-1 text-xs font-bold text-[#1A1A1A]">
                      🏆
                    </span>
                  )}
                </div>
                {idx === 0 && scoreLine && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-2xl font-bold text-[var(--ink)]">
                      {scoreLine}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ELO Changes */}
          {eloDeltas.length > 0 && (
            <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                Cambios de ELO
              </p>
              <div className="grid grid-cols-2 gap-2">
                {eloDeltas.slice(0, 4).map((delta) => (
                  <div key={delta.playerId} className="text-sm">
                    <p className="font-semibold text-[var(--ink)]">{delta.name}</p>
                    <p
                      className={`text-sm font-bold ${
                        delta.delta >= 0 ? 'text-green-500' : 'text-rose-500'
                      }`}
                    >
                      {delta.delta >= 0 ? '+' : ''}
                      {delta.delta}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-xs text-[var(--muted)]">
              🎾 Padelapp - Tu app de padel
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-3 gap-2 px-6 pb-6">
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-glass)] px-4 py-3 text-sm font-semibold text-[var(--ink)] hover:bg-[color:var(--card-border)] transition"
          >
            <Share2 className="h-4 w-4" />
            Compartir
          </button>
          <button
            onClick={copyToClipboard}
            className="flex items-center justify-center gap-2 rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-glass)] px-4 py-3 text-sm font-semibold text-[var(--ink)] hover:bg-[color:var(--card-border)] transition"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
          <button
            onClick={generateImage}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-glass)] px-4 py-3 text-sm font-semibold text-[var(--ink)] hover:bg-[color:var(--card-border)] transition disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {isGenerating ? '...' : 'Imagen'}
          </button>
        </div>
      </div>
    </div>
  );
}
