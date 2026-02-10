/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function createNoopSupabaseServerClient() {
  const emptyResult = { data: null, error: null } as const;

  const makeBuilder = () => {
    const builder: any = {
      select: () => builder,
      eq: () => builder,
      neq: () => builder,
      in: () => builder,
      gte: () => builder,
      lte: () => builder,
      order: () => builder,
      limit: () => builder,
      range: () => builder,
      single: () => builder,
      maybeSingle: () => builder,
      insert: () => builder,
      update: () => builder,
      upsert: () => builder,
      delete: () => builder,
      // Make it awaitable (Supabase builders are thenable).
      then: (onFulfilled: any, onRejected: any) =>
        Promise.resolve(emptyResult).then(onFulfilled, onRejected),
    };

    return builder;
  };

  return {
    from: () => makeBuilder(),
    rpc: async () => emptyResult,
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
  } as any;
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  // Demo/no-env mode: return a noop client instead of crashing.
  // Pages that support demo mode can render empty/mocked states.
  if (!supabaseUrl || !supabaseAnonKey) {
    return createNoopSupabaseServerClient();
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name, options) {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });
}

/* eslint-enable @typescript-eslint/no-explicit-any */
