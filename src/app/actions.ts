"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export async function createGroup(formData: FormData) {
  const supabaseServer = await createSupabaseServerClient();
  const name = String(formData.get("group_name") ?? "").trim();
  const passphrase = String(formData.get("group_passphrase") ?? "").trim();
  if (!name) {
    throw new Error("El nombre del grupo es obligatorio.");
  }
  if (!passphrase) {
    throw new Error("La clave del grupo es obligatoria.");
  }

  const slugBase = slugify(name);
  if (!slugBase) {
    throw new Error("El nombre del grupo no es válido.");
  }

  const { data: authData, error: authError } =
    await supabaseServer.auth.getUser();
  if (authError) {
    console.error("createGroup auth lookup failed", { authError });
  }
  if (!authData?.user) {
    const { error: signInError } =
      await supabaseServer.auth.signInAnonymously();
    if (signInError) {
      throw new Error("No se pudo iniciar sesión.");
    }
  }

  const { data, error } = await supabaseServer.rpc(
    "create_group_with_passphrase",
    {
      p_name: name,
      p_slug_base: slugBase,
      p_passphrase: passphrase,
    }
  );
  const group = Array.isArray(data) ? data[0] : data;

  if (error || !group) {
    console.error("createGroup failed", { error });
    throw new Error(
      `No se pudo crear el grupo.${error?.message ? ` ${error.message}` : ""}`
    );
  }

  redirect(`/g/${group.slug}`);
}

