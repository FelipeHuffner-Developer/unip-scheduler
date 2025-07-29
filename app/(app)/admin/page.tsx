import { RoomManagement } from "@/components/admin/room-management"
import { EquipmentManagement } from "@/components/admin/equipment-management"
import { SupplyManagement } from "@/components/admin/supply-management"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.log("AdminPage: Usuário não logado, redirecionando para /login")
    redirect("/login")
  }

  console.log("AdminPage: Usuário logado:", user.email)

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError) {
    console.error("AdminPage: Erro ao buscar perfil:", profileError)
    redirect("/dashboard")
  }

  console.log("AdminPage: Perfil do usuário:", profile)

  if (profile?.role !== "admin") {
    console.log(`AdminPage: Usuário com papel '${profile?.role}', redirecionando para /dashboard`)
    redirect("/dashboard") // Redirect if not admin
  }

  console.log("AdminPage: Usuário admin confirmado, renderizando página")

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold">Painel Administrativo UNIP SGSEI</h1>
      <p className="text-muted-foreground">Gerencie salas, equipamentos e insumos do sistema.</p>

      <RoomManagement />
      <EquipmentManagement />
      <SupplyManagement />

      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Usuários (Manual)</CardTitle>
          <CardDescription>
            Para alterar o papel de um usuário (admin, moderador, comum), acesse o painel do Supabase, vá em `Database`
            &gt; `Tables` &gt; `profiles` e edite a coluna `role` para o usuário desejado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Novos usuários são automaticamente definidos como 'common'.</p>
        </CardContent>
      </Card>
    </div>
  )
}
