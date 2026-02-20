import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

type InviteDetails = {
  group_id: string;
  group_name: string | null;
  group_slug: string | null;
  token: string;
  created_at: string;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  is_valid: boolean;
  message: string;
};

export default async function InvitePreviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createSupabaseServerClient();

  // Get invite details using the backend function
  const { data: inviteData, error } = await supabase.rpc("get_invite_details", {
    p_token: token,
  });

  const invite = inviteData?.[0] as InviteDetails | undefined;

  // If invite is not found or there's an error
  if (!invite || error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 shadow-lg">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-red-100 p-3">
              <svg
                className="h-12 w-12 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
            Invitación inválida
          </h1>
          <p className="mb-6 text-center text-gray-600">
            Esta invitación no existe o ha sido eliminada.
          </p>
          <div className="flex justify-center">
            <Link
              href="/"
              className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Invite found but expired or max uses reached
  if (!invite.is_valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 px-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-8 shadow-lg">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-amber-100 p-3">
              <svg
                className="h-12 w-12 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
            Invitación expirada
          </h1>
          <p className="mb-6 text-center text-gray-600">
            {invite.message === "Invite has expired"
              ? "Esta invitación ha caducado."
              : invite.message ===
                "Invite has reached maximum uses"
              ? "Esta invitación ha alcanzado el número máximo de usos."
              : invite.message}
          </p>
          <div className="flex justify-center">
            <Link
              href="/"
              className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Valid invite - show group info and join button
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-8 shadow-lg">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-emerald-100 p-4">
            <svg
              className="h-16 w-16 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
        </div>

        <div className="text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-600">
            Has sido invitado
          </p>
          <h1 className="mb-3 text-3xl font-bold text-gray-900">
            {invite.group_name || "Grupo"}
          </h1>
          <p className="mb-6 text-gray-600">
            Únete al grupo para comenzar a organizar partidos de pádel con tus
            amigos.
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            const supabase = await createSupabaseServerClient();

            // Try to use the invite
            const { data: joinResult, error: joinError } = await supabase.rpc(
              "validate_and_use_invite",
              { p_token: token }
            );

            if (joinError || !joinResult?.[0]?.success) {
              // Handle join error
              const message = joinResult?.[0]?.message || "Error al unirse al grupo";
              // In a real app, you'd want to show an error message
              console.error("Join error:", message);
              redirect(`/invite/${token}?error=${encodeURIComponent(message)}`);
            }

            // Redirect to the group page
            const groupSlug = invite.group_slug || invite.group_id;
            redirect(`/g/${groupSlug}`);
          }}
          className="flex flex-col gap-3"
        >
          <button
            type="submit"
            className="w-full rounded-full bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            Unirse al grupo
          </button>
          <Link
            href="/"
            className="block rounded-full border border-gray-300 px-6 py-3 text-center text-base font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
          >
            Cancelar
          </Link>
        </form>

        <div className="mt-6 rounded-lg bg-gray-50 p-4">
          <p className="text-center text-xs text-gray-500">
            Esta invitación es válida únicamente para este grupo. Al unirte,
            podrás ver los partidos, rankings y más.
          </p>
        </div>
      </div>
    </div>
  );
}
