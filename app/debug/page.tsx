import { createClient } from "@/lib/supabase/server"

export default async function DebugPage() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Debug - Usuário não logado</h1>
          <p>Faça login primeiro para ver as informações de debug.</p>
        </div>
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Debug - Informações do Usuário</h1>
        
        <div className="grid gap-4">
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Informações do Auth</h2>
            <pre className="bg-muted p-2 rounded text-sm overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>

          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Informações do Perfil</h2>
            {profileError ? (
              <div className="text-red-500">
                <p>Erro ao buscar perfil:</p>
                <pre className="bg-muted p-2 rounded text-sm">
                  {JSON.stringify(profileError, null, 2)}
                </pre>
                <p className="mt-2 text-sm">
                  <strong>Possíveis causas:</strong>
                  <ul className="list-disc list-inside mt-1">
                    <li>O perfil não foi criado automaticamente</li>
                    <li>Problema na configuração do Supabase</li>
                    <li>Falta de trigger para criar perfil automaticamente</li>
                  </ul>
                </p>
              </div>
            ) : (
              <pre className="bg-muted p-2 rounded text-sm overflow-auto">
                {JSON.stringify(profile, null, 2)}
              </pre>
            )}
          </div>

          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Resumo</h2>
            <ul className="space-y-2">
              <li><strong>Email:</strong> {user.email}</li>
              <li><strong>ID:</strong> {user.id}</li>
              <li><strong>Nome:</strong> {profile?.full_name || "Não definido"}</li>
              <li><strong>Papel:</strong> {profile?.role || "Não definido"}</li>
              <li><strong>É Admin:</strong> {profile?.role === "admin" ? "Sim" : "Não"}</li>
              <li><strong>Perfil criado em:</strong> {profile?.created_at ? new Date(profile.created_at).toLocaleString() : "Não disponível"}</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Configuração do Supabase</h2>
            <p className="text-sm text-muted-foreground mb-2">
              Para que o nome apareça corretamente, certifique-se de que:
            </p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>A tabela <code>profiles</code> existe no Supabase</li>
              <li>O campo <code>full_name</code> está presente na tabela</li>
              <li>O trigger para criar perfil automaticamente está configurado</li>
              <li>O usuário foi cadastrado com o nome fornecido</li>
            </ul>
          </div>
        </div>
      </div>
    )
  } catch (error: any) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Debug - Erro</h1>
        <div className="text-red-500">
          <p>Erro ao carregar informações:</p>
          <pre className="bg-muted p-2 rounded text-sm">
            {error.message}
          </pre>
        </div>
      </div>
    )
  }
} 