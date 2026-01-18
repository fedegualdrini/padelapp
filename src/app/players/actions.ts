"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function addInvite(formData: FormData) {
  const supabaseServer = await createSupabaseServerClient();
  const name = String(formData.get("invite_name") ?? "").trim();
  const createdBy = String(formData.get("created_by") ?? "").trim();
  const groupId = String(formData.get("group_id") ?? "").trim();
  const groupSlug = String(formData.get("group_slug") ?? "").trim();

  if (!name || !groupId || !groupSlug) {
    throw new Error("El nombre del invitado es obligatorio.");
  }

  const { error } = await supabaseServer.from("players").insert({
    group_id: groupId,
    name,
    status: "invite",
    updated_by: createdBy || null,
  });

  if (error) {
    throw new Error("No se pudo agregar el invitado.");
  }

  revalidatePath(`/g/${groupSlug}/players`);
}
