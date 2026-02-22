"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createGroupSchema } from "@/lib/validation";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export async function createGroup(formData: FormData) {
  const supabaseServer = await createSupabaseServerClient();
  
  // Validate and sanitize input
  const validationResult = createGroupSchema.safeParse({
    groupName: formData.get("group_name"),
    groupPassphrase: formData.get("group_passphrase"),
  });

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Error de validación";
    throw new Error(errorMessage);
  }

  const { groupName, groupPassphrase } = validationResult.data;
  const slugBase = slugify(groupName);
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
      p_name: groupName,
      p_slug_base: slugBase,
      p_passphrase: groupPassphrase,
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
