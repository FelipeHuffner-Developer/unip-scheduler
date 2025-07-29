import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
// Remover o uso do cache do React, pois não suporta funções assíncronas
// export const createClient = cache(() => {
export async function createClient() {
  // Verificar se as variáveis de ambiente estão definidas
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não está definida. Verifique seu arquivo .env.local")
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida. Verifique seu arquivo .env.local")
  }

  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // The `cookies().set()` method can only be called in a Server Action or Route Handler
          // This error is typically ignored if we're not setting cookies
          console.warn("Failed to set cookie:", error)
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          // The `cookies().set()` method can only be called in a Server Action or Route Handler
          // This error is typically ignored if we're not removing cookies
          console.warn("Failed to remove cookie:", error)
        }
      },
    },
  })
}
