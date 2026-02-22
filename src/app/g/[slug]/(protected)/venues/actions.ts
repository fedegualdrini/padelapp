"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getGroupBySlug, isGroupMember } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createVenueSchema } from "@/lib/validation";
import { z } from "zod";

/**
 * Generate a URL-safe slug from a string
 */
function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type CreateVenueInput = {
  name: string;
  address: string;
  numCourts: number;
  surfaceType: string;
  indoorOutdoor: string;
  lighting: string;
};

export type CreateVenueResult = {
  success: boolean;
  venueSlug?: string;
  error?: string;
};

/**
 * Server Action: Create a new venue
 */
export async function createVenue(
  slug: string,
  formData: FormData
): Promise<CreateVenueResult> {
  const group = await getGroupBySlug(slug);
  if (!group) {
    return { success: false, error: "Grupo no encontrado" };
  }

  const member = await isGroupMember(group.id);
  if (!member) {
    return { success: false, error: "No sos miembro del grupo" };
  }

  // Extract and validate inputs
  const validationResult = createVenueSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    numCourts: Number(formData.get("num_courts") ?? 1),
    surfaceType: formData.get("surface_type"),
    indoorOutdoor: formData.get("indoor_outdoor"),
    lighting: formData.get("lighting"),
    groupId: group.id,
  });

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Error de validación";
    return { success: false, error: errorMessage };
  }

  const { name, address, numCourts, surfaceType, indoorOutdoor, lighting } = validationResult.data;

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    return { success: false, error: "No hay sesión activa" };
  }

  const venueSlug = slugify(name);

  const { data, error } = await supabase
    .from("venues")
    .insert({
      group_id: group.id,
      name,
      slug: venueSlug,
      address,
      num_courts: numCourts,
      surface_type: surfaceType,
      indoor_outdoor: indoorOutdoor,
      lighting,
      created_by: null,
      // venues.created_by references players(id); we don't map user -> player, so leave null
    })
    .select("slug")
    .single();

  if (error) {
    // Most common cause here is RLS (admin-only venue creation)
    console.error("create venue failed", {
      code: error.code,
      message: error.message,
      details: (error as unknown as { details?: string }).details,
      hint: (error as unknown as { hint?: string }).hint,
    });
    
    if (error.code === "42501" || error.message?.includes("row-level security")) {
      return { success: false, error: "No tenés permisos para crear canchas en este grupo" };
    }
    
    return { success: false, error: error.message };
  }

  revalidatePath(`/g/${slug}/venues`);

  if (data?.slug) {
    return { success: true, venueSlug: data.slug };
  }

  return { success: true, venueSlug };
}

/**
 * Server Action: Create venue and redirect
 */
export async function createVenueAndRedirect(
  slug: string,
  formData: FormData
): Promise<void> {
  const result = await createVenue(slug, formData);
  
  if (!result.success) {
    throw new Error(result.error || "No se pudo crear la cancha");
  }
  
  redirect(`/g/${slug}/venues/${result.venueSlug}`);
}
