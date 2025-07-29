import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    // Tenta uma consulta simples para verificar a conectividade
    const { data, error } = await supabase.from("profiles").select("id").limit(1)

    if (error) {
      console.error("Erro na verificação de status do Supabase:", error)
      return NextResponse.json({ status: "error", message: error.message }, { status: 500 })
    }

    return NextResponse.json({ status: "active", message: "Supabase está ativo." })
  } catch (e: any) {
    console.error("Exceção na verificação de status do Supabase:", e)
    return NextResponse.json({ status: "error", message: e.message }, { status: 500 })
  }
}
