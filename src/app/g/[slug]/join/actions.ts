"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { joinGroupSchema } from "@/lib/validation";

type JoinGroupState = {
  error?: string;
};

export async function joinGroup(
  prevState: JoinGroupState | null,
  formData: FormData
): Promise<JoinGroupState> {
  // Validate and sanitize input
  const validationResult = joinGroupSchema.safeParse({
    groupSlug: formData.get("group_slug"),
    groupPassphrase: formData.get("group_passphrase"),
  });

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Error de validación";
    return { error: errorMessage };
  }

  const { groupSlug, groupPassphrase } = validationResult.data;

  // Demo mode: mimic the join flow without Supabase.
  if (!hasSupabaseEnv()) {
    if (groupPassphrase !== "padel") {
      return { error: "Clave incorrecta. Por favor, intentá de nuevo." };
    }

    redirect(`/g/${groupSlug}`);
  }

  const supabaseServer = await createSupabaseServerClient();

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
      p_slug: groupSlug,
      p_passphrase: groupPassphrase,
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

  redirect(`/g/${groupSlug}`);
}
