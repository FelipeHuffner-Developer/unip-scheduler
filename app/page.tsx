import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // Se não há usuário, mostrar página de boas-vindas
      return (
        <div className="grid gap-6">
          <h1 className="text-3xl font-bold">Bem-vindo ao UNIP SGSEI</h1>
          <p className="text-muted-foreground">
            Sistema de Gerenciamento de Salas, Equipamentos e Insumos para a UNIP.
          </p>
          
          <div className="rounded-lg border p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Faça login para continuar</h2>
            <p className="text-muted-foreground mb-4">
              Acesse o sistema para gerenciar agendamentos, salas e equipamentos.
            </p>
            <a 
              href="/login" 
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Acessar Sistema
            </a>
          </div>
        </div>
      )
    }

    // Fetch user role to show appropriate content
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Erro ao buscar perfil do usuário:", profileError)
      // Se há erro no perfil, mostrar página de boas-vindas genérica
      return (
        <div className="grid gap-6">
          <h1 className="text-3xl font-bold">Bem-vindo ao UNIP SGSEI</h1>
          <p className="text-muted-foreground">
            Olá! Selecione uma opção no menu de navegação para começar.
          </p>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">Dashboard</h3>
              <p className="text-sm text-muted-foreground">
                Visualize seus agendamentos e faça novas solicitações.
              </p>
            </div>
          </div>
        </div>
      )
    }

    const userRole = profile?.role || "common"
    const userName = profile?.full_name || user.email

    return (
      <div className="grid gap-6">
        <h1 className="text-3xl font-bold">Bem-vindo ao UNIP SGSEI</h1>
        <p className="text-muted-foreground">
          Olá, {userName}! Selecione uma opção no menu de navegação para começar.
        </p>
        
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              Visualize seus agendamentos e faça novas solicitações.
            </p>
          </div>
          
          {userRole === "admin" && (
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">Painel Administrativo</h3>
              <p className="text-sm text-muted-foreground">
                Gerencie salas, equipamentos e insumos.
              </p>
            </div>
          )}
          
          {(userRole === "admin" || userRole === "moderator") && (
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">Moderação</h3>
              <p className="text-sm text-muted-foreground">
                Aprove ou rejeite solicitações de agendamento.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error("Erro ao carregar página inicial:", error)
    // Em caso de erro, mostrar página de boas-vindas simples
    return (
      <div className="grid gap-6">
        <h1 className="text-3xl font-bold">Bem-vindo ao UNIP SGSEI</h1>
        <p className="text-muted-foreground">
          Sistema de Gerenciamento de Salas, Equipamentos e Insumos para a UNIP.
        </p>
        
        <div className="rounded-lg border p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Faça login para continuar</h2>
          <p className="text-muted-foreground mb-4">
            Acesse o sistema para gerenciar agendamentos, salas e equipamentos.
          </p>
          <a 
            href="/login" 
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Acessar Sistema
          </a>
        </div>
      </div>
    )
  }
}
