"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";

type JoinGroupState = {
  error?: string;
};

export async function joinGroup(
  prevState: JoinGroupState | null,
  formData: FormData
): Promise<JoinGroupState> {
  const slug = String(formData.get("group_slug") ?? "").trim();
  const passphrase = String(formData.get("group_passphrase") ?? "").trim();

  // Demo mode: mimic the join flow without Supabase.
  if (!hasSupabaseEnv()) {
    if (!slug || !passphrase) {
      return { error: "La clave del grupo es obligatoria." };
    }

    if (passphrase !== "padel") {
      return { error: "Clave incorrecta. Por favor, intentá de nuevo." };
    }

    redirect(`/g/${slug}`);
  }

  const supabaseServer = await createSupabaseServerClient();

  if (!slug || !passphrase) {
    return { error: "La clave del grupo es obligatoria." };
  }

  const { data: authData, error: authError } =
    await supabaseServer.auth.getUser();
  if (authError) {
    console.error("joinGroup auth lookup failed", { authError });
  }

  // Ensure we have an auth.uid() for the RPC.
  // signInAnonymously() writes cookies, but the existing client may not pick up the new session
  // within the same request, so re-create the client after signing in.
  let supabase = supabaseServer;
  if (!authData?.user) {
    const { error: signInError } = await supabaseServer.auth.signInAnonymously();
    if (signInError) {
      return { error: "No se pudo iniciar sesión." };
    }
    supabase = await createSupabaseServerClient();
  }

  const { data, error } = await supabase.rpc(
    "join_group_with_passphrase",
    {
      p_slug: slug,
      p_passphrase: passphrase,
    }
  );

  if (error || !data) {
    console.error("joinGroup failed", { error });

    // Return user-friendly error messages
    if (error?.message?.includes("Invalid passphrase")) {
      return { error: "Clave incorrecta. Por favor, intentá de nuevo." };
    }

    return { error: "No se pudo ingresar al grupo. Verificá la clave e intentá nuevamente." };
  }

  redirect(`/g/${slug}`);
}
