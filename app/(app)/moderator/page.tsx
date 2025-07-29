import { BookingApproval } from "@/components/moderator/booking-approval"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function ModeratorPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || (profile?.role !== "admin" && profile?.role !== "moderator")) {
    redirect("/dashboard") // Redirect if not admin or moderator
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold">Painel do Moderador UNIP</h1>
      <p className="text-muted-foreground">Gerencie as solicitações de agendamento.</p>

      <BookingApproval />

      <Card>
        <CardHeader>
          <CardTitle>Visão Geral dos Agendamentos</CardTitle>
          <CardDescription>Para relatórios detalhados, acesse a seção de Relatórios.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Aqui você pode aprovar ou rejeitar agendamentos pendentes.</p>
        </CardContent>
      </Card>
    </div>
  )
}
