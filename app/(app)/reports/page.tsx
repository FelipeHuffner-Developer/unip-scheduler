import { CategoryReports } from "@/components/reports/category-reports"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function ReportsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.log("ReportsPage: Usuário não logado, redirecionando para /login")
    redirect("/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError) {
    console.error("ReportsPage: Erro ao buscar perfil do usuário:", profileError)
    console.log("ReportsPage: Redirecionando para /dashboard devido a erro no perfil.")
    redirect("/dashboard") // Este redirecionamento é para /dashboard, não /admin
  }

  if (profile?.role !== "admin" && profile?.role !== "moderator") {
    console.log(`ReportsPage: Papel do usuário é '${profile?.role}', redirecionando para /dashboard.`)
    redirect("/dashboard") // Este redirecionamento é para /dashboard, não /admin
  }

  console.log(`ReportsPage: Papel do usuário é '${profile?.role}', renderizando a página de relatórios.`)
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold">Relatórios UNIP SGSEI</h1>
      <p className="text-muted-foreground">Visualize dados de agendamentos e insumos.</p>

      <CategoryReports />
    </div>
  )
}
