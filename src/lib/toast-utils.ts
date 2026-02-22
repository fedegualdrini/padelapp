/**
 * Toast notification utilities
 * Provides consistent error/success message formatting for toast notifications
 */

// Standard toast messages for common actions
export const TOAST_MESSAGES = {
  // Match actions
  match: {
    created: "Partido guardado correctamente",
    updated: "Partido actualizado correctamente",
    deleted: "Partido eliminado correctamente",
    error: {
      create: "No se pudo crear el partido",
      update: "No se pudo actualizar el partido",
      delete: "No se pudo eliminar el partido",
      validation: "Datos del partido inválidos",
    },
  },
  
  // Player actions
  player: {
    added: "Jugador agregado correctamente",
    updated: "Jugador actualizado correctamente",
    removed: "Jugador eliminado correctamente",
    error: {
      add: "No se pudo agregar el jugador",
      update: "No se pudo actualizar el jugador",
      remove: "No se pudo eliminar el jugador",
      exists: "El jugador ya existe en el grupo",
    },
  },
  
  // Event/RSVP actions
  event: {
    rsvpConfirmed: "Confirmaste tu asistencia",
    rsvpDeclined: "Cancelaste tu asistencia",
    rsvpMaybe: "Marcaste asistencia como posible",
    rsvpWaitlist: "Te agregaste a la lista de espera",
    rsvpError: "No se pudo actualizar tu asistencia",
    created: "Evento creado correctamente",
    updated: "Evento actualizado correctamente",
    deleted: "Evento eliminado correctamente",
    cancelled: "Evento cancelado correctamente",
    error: {
      create: "No se pudo crear el evento",
      update: "No se pudo actualizar el evento",
      delete: "No se pudo eliminar el evento",
      cancel: "No se pudo cancelar el evento",
    },
  },
  
  // Generic errors
  generic: {
    networkError: "Error de conexión. Verificá tu conexión a internet.",
    serverError: "Error del servidor. Intentá de nuevo más tarde.",
    unauthorized: "No tenés permiso para realizar esta acción",
    sessionExpired: "Tu sesión expiró. Recargá la página.",
    unknownError: "Ocurrió un error inesperado",
  },
} as const;

/**
 * Format an error message for display
 * Handles both string errors and Error objects
 */
export function formatErrorMessage(error: unknown): string {
  if (!error) return TOAST_MESSAGES.generic.unknownError;
  
  if (typeof error === "string") return error;
  
  if (error instanceof Error) {
    // Check for specific error patterns
    const message = error.message.toLowerCase();
    
    if (message.includes("network") || message.includes("fetch")) {
      return TOAST_MESSAGES.generic.networkError;
    }
    if (message.includes("401") || message.includes("unauthorized")) {
      return TOAST_MESSAGES.generic.unauthorized;
    }
    if (message.includes("session") || message.includes("auth")) {
      return TOAST_MESSAGES.generic.sessionExpired;
    }
    
    return error.message;
  }
  
  return TOAST_MESSAGES.generic.unknownError;
}

/**
 * Extract user-friendly error message from Supabase error
 */
export function getSupabaseErrorMessage(error: { 
  message?: string; 
  code?: string;
  details?: string;
}): string {
  // Common Supabase error codes
  if (error.code === "42501" || error.message?.includes("row-level security")) {
    return TOAST_MESSAGES.generic.unauthorized;
  }
  
  if (error.code === "PGRST116") {
    return "No se encontró el registro solicitado";
  }
  
  if (error.code === "23505") {
    return "El registro ya existe";
  }
  
  return error.message || TOAST_MESSAGES.generic.unknownError;
}

/**
 * Result type for server actions with toast support
 */
export type ActionResult<T = void> = 
  | { success: true; data?: T; message?: string }
  | { success: false; error: string };

/**
 * Helper to create a success result
 */
export function success<T>(data?: T, message?: string): ActionResult<T> {
  return { success: true, data, message };
}

/**
 * Helper to create an error result
 */
export function failure(error: string): ActionResult<never> {
  return { success: false, error };
}
