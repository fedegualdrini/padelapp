# Input Validation and Sanitization Patterns

This document describes the validation patterns used throughout the padel application.

## Overview

All user inputs are validated using **Zod schemas** to ensure:
- Type safety
- User-friendly error messages (in Spanish)
- Protection against SQL injection and XSS attacks
- Consistent validation logic across the application

## Validation Architecture

### Centralized Schemas

All validation schemas are located in `src/lib/validation/schemas.ts`:

```typescript
import { 
  createMatchSchema, 
  addPlayerSchema, 
  createWeeklyEventSchema 
} from "@/lib/validation";
```

### Validation Flow

1. **FormData extraction** → Convert to plain object
2. **Zod validation** → Type-safe parsing with detailed errors
3. **Sanitization** → Automatic trimming and XSS removal
4. **Business logic** → Use validated, typed data

## Schema Patterns

### 1. Group Validation

```typescript
// Schemas
groupNameSchema: min 2 chars, max 100 chars, sanitized
groupPassphraseSchema: min 4 chars, max 50 chars, sanitized
groupSlugSchema: lowercase letters, numbers, hyphens only

// Usage
const validated = createGroupSchema.parse({
  groupName: formData.get("group_name"),
  groupPassphrase: formData.get("group_passphrase"),
});
```

**User-friendly errors:**
- "El nombre del grupo debe tener al menos 2 caracteres"
- "La clave del grupo debe tener al menos 4 caracteres"

### 2. Player Validation

```typescript
// Schemas
playerNameSchema: min 2 chars, max 100 chars, sanitized
playerStatusSchema: enum ["usual", "invite"]
groupId/groupSlug: validated UUID and slug formats

// Usage
const validated = addPlayerSchema.parse({
  playerName: formData.get("player_name"),
  playerStatus: formData.get("player_status"),
  groupId: formData.get("group_id"),
  groupSlug: formData.get("group_slug"),
});
```

**User-friendly errors:**
- "El nombre del jugador debe tener al menos 2 caracteres"
- "Estado de jugador inválido"

### 3. Match Validation

```typescript
// Schemas
matchBestOfSchema: 3 or 5 (literal values)
setScoreSchema: valid tennis/padel score combinations
matchPlayerIdsSchema: exactly 4 unique UUIDs

// Valid set scores
Standard wins: 6-0, 6-1, 6-2, 6-3, 6-4
Tiebreaks: 7-5, 7-6

// Usage
const validated = createMatchSchema.parse({
  groupId: formData.get("group_id"),
  playedDate: formData.get("played_date"),
  playedTime: formData.get("played_time"),
  bestOf: Number(formData.get("best_of")),
  team1Player1: formData.get("team1_player1"),
  // ... more fields
  sets: extractSetsFromFormData(formData),
});
```

**Validation rules:**
- At least requiredSets must be completed
- Sets must include the winning set
- No extra sets after match is decided
- MVP must be one of the 4 players

### 4. Event Validation

```typescript
// Schemas
eventNameSchema: min 2 chars, max 200 chars, sanitized
eventWeekdaySchema: 0-6 (Sunday-Saturday)
eventCapacitySchema: 1-100
timeStringSchema: HH:MM format, validated 00:00-23:59

// Usage
const validated = createWeeklyEventSchema.parse({
  name: formData.get("name"),
  weekday: Number(formData.get("weekday")),
  startTime: formData.get("start_time"),
  capacity: Number(formData.get("capacity")),
  cutoffWeekday: Number(formData.get("cutoff_weekday")),
  cutoffTime: formData.get("cutoff_time"),
});
```

**User-friendly errors:**
- "El nombre del evento debe tener al menos 2 caracteres"
- "Día de la semana inválido (0-6)"
- "La capacidad debe ser positiva"

## Sanitization

All string inputs are automatically sanitized to prevent XSS:

```typescript
// Automatic sanitization includes:
- Trim whitespace
- Remove <script> tags
- Remove javascript: URLs
- Remove event handlers (onclick, onerror, etc.)
```

### Manual Sanitization

```typescript
import { sanitizeString, sanitizeObject } from "@/lib/validation";

// Single string
const cleanName = sanitizeString(userInput);

// Entire object
const cleanData = sanitizeObject(formData);
```

## Error Handling

### Server Actions

Use try-catch with Zod's error messages:

```typescript
"use server";

import { createMatchSchema } from "@/lib/validation";

export async function createMatch(formData: FormData) {
  try {
    const validated = createMatchSchema.parse({
      // ... extract fields from formData
    });
    
    // Use validated.typeSafeData
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors[0]?.message || "Error de validación";
      return { error: message };
    }
    throw error;
  }
}
```

### API Routes

Return validation errors with 400 status:

```typescript
export async function POST(request: Request) {
  const body = await request.json();
  
  const result = createMatchSchema.safeParse(body);
  
  if (!result.success) {
    return Response.json(
      { error: result.error.errors[0]?.message },
      { status: 400 }
    );
  }
  
  // Use result.data
}
```

## Rate Limiting Awareness

While this implementation focuses on input validation, consider adding rate limiting for:

- Match creation: 10 per minute per user
- Player creation: 20 per minute per group
- Event creation: 5 per minute per group
- Group joins: 5 per minute per IP

Recommended libraries:
- `upstash/ratelimit` (Redis-backed)
- `next-rate-limit` (In-memory)

## Security Considerations

### ✅ Protected Against
- **SQL Injection**: Supabase client uses parameterized queries
- **XSS**: Input sanitization removes dangerous HTML/JS
- **Invalid UUIDs**: Zod validates UUID format before DB queries
- **Buffer overflow**: Max length constraints on all strings
- **Type coercion**: Zod enforces strict types

### 🔒 Additional Protections
- **RLS (Row Level Security)**: Supabase enforces data isolation
- **Group membership**: All mutations verify group access
- **Auth checks**: Server actions validate session

## Testing Checklist

When adding new validation:

- [ ] Test min/max length constraints
- [ ] Test invalid enum values
- [ ] Test malformed UUIDs
- [ ] Test XSS payloads (should be sanitized)
- [ ] Test SQL injection attempts (should fail validation)
- [ ] Test user-friendly error messages in Spanish
- [ ] Verify RLS still enforces data access
- [ ] Check no regression in existing flows

## Examples

### Adding New Validation

1. **Define schema** in `src/lib/validation/schemas.ts`:

```typescript
export const createVenueSchema = z.object({
  venueName: z.string()
    .min(2, "El nombre del club debe tener al menos 2 caracteres")
    .max(100, "El nombre del club no puede exceder 100 caracteres")
    .transform(sanitizeString),
  address: z.string()
    .max(500, "La dirección no puede exceder 500 caracteres")
    .transform(sanitizeString),
  courtCount: z.number()
    .int("La cantidad de canchas debe ser un número entero")
    .positive("La cantidad de canchas debe ser positiva")
    .max(50, "No puede haber más de 50 canchas"),
});
```

2. **Use in server action**:

```typescript
export async function createVenue(formData: FormData) {
  try {
    const validated = createVenueSchema.parse({
      venueName: formData.get("venue_name"),
      address: formData.get("address"),
      courtCount: Number(formData.get("court_count")),
    });
    
    // Insert with validated data
    await supabase.from("venues").insert({
      name: validated.venueName,
      address: validated.address,
      court_count: validated.courtCount,
    });
    
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message };
    }
    throw error;
  }
}
```

## Validation vs Business Logic

**Validation**: Structure, format, type safety
- "Name must be at least 2 characters"
- "Date must be in YYYY-MM-DD format"
- "Player ID must be a valid UUID"

**Business Logic**: Domain rules, state
- "Player must be a member of the group"
- "Match date cannot be in the future"
- "Event capacity exceeded"

Keep these separate. Validation happens first, then business logic checks.

## Performance

- Zod schemas are compiled once and reused
- Validation errors early-return without DB queries
- Sanitization adds minimal overhead (~0.1ms per string)
- Consider caching parsed schemas for hot paths
