"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function joinGroup(formData: FormData) {
  const supabaseServer = await createSupabaseServerClient();
  const slug = String(formData.get("group_slug") ?? "").trim();
  const passphrase = String(formData.get("group_passphrase") ?? "").trim();

  if (!slug || !passphrase) {
    throw new Error("La clave del grupo es obligatoria.");
  }

  const { data: authData, error: authError } =
    await supabaseServer.auth.getUser();
  if (authError) {
    console.error("joinGroup auth lookup failed", { authError });
  }
  if (!authData?.user) {
    const { error: signInError } =
      await supabaseServer.auth.signInAnonymously();
    if (signInError) {
      throw new Error("No se pudo iniciar sesion.");
    }
  }

  const { data, error } = await supabaseServer.rpc(
    "join_group_with_passphrase",
    {
      p_slug: slug,
      p_passphrase: passphrase,
    }
  );

  if (error || !data) {
    console.error("joinGroup failed", { error });
    throw new Error(
      `No se pudo ingresar al grupo.${
        error?.message ? ` ${error.message}` : ""
      }`
    );
  }

  redirect(`/g/${slug}`);
}
