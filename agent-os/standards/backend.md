# Backend Standards

## Next.js API Routes

### Route Structure
```typescript
// src/app/api/[resource]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/client';

// GET handler
export async function GET(request: NextRequest) {
  // Implementation
}

// POST handler
export async function POST(request: NextRequest) {
  // Implementation
}
```

### Dynamic Routes
```typescript
// src/app/api/[resource]/[id]/route.ts

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params;
  // Use id
}
```

## Supabase Patterns

### Client Creation
```typescript
// Server side
import { createClient } from '@/src/lib/supabase/server';

const supabase = await createClient();

// Client side
import { createClient } from '@/src/lib/supabase/client';

const supabase = createClient();
```

### Queries
```typescript
// Basic query
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value);

// Join query
const { data } = await supabase
  .from('matches')
  .select('\n    *,\n    match_teams (*)\n  ')
  .eq('group_id', groupId);
```

### RSL Policies
Always check RLS policies when modifying data:
- All tables have group-based RLS
- Users must be group members
- Admins have elevated permissions via `is_group_admin()`

## Database Patterns

### Migrations
```bash
# Create migration
supabase migration new migration_name

# Apply locally
supabase db reset

# Push to remote
supabase db push
```

### Migration Structure
```sql
-- Up migration
CREATE TABLE new_table (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- other columns
);

-- Down migration (next file)
DROP TABLE IF EXISTS new_table;
```

## Error Handling

### API Error Pattern
```typescript
try {
  const result = await someOperation();
  return NextResponse.json(result);
} catch (error) {
  console.error('Error:', error);
  return NextResponse.json(
    { error: 'Descriptive error message' },
    { status: 500 }
  );
}
```

## External API Calls

### Pattern
```typescript
const response = await fetch(externalUrl, {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

if (!response.ok) {
  throw new Error(`HTTP ${response.status}`);
}

const data = await response.json();
```

## Conventions

### Route Organization
```
src/app/api/
├── groups/
│   └── [groupId]/
│       └── skip-week/
├── partnerships/
│   └── player/
│       └── best-partners/
└── [resource]/
    └── route.ts
```

### Response Types
```typescript
// Success
interface ApiResponse<T> {
  data: T;
}

// Error
interface ApiError {
  error: string;
  details?: string;
}
```

## Anti-patterns (Avoid)
- Don't skip error handling on Supabase calls
- Don't expose sensitive data in API responses
- Don't bypass RLS policies
- Don't do heavy computations in API routes
- Don't forget to validate input data
