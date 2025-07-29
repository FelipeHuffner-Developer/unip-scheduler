"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export function AuthForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  const clearForm = () => {
    setEmail("")
    setPassword("")
    setFullName("")
  }

  const handleToggleMode = () => {
    clearForm()
    setIsSignUp(!isSignUp)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast({
        title: "Erro de Login",
        description: error.message,
        variant: "destructive",
      })
    } else {
      // Após login bem-sucedido, verificar o papel do usuário
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()

          const userRole = profile?.role || "common"
          
          console.log("AuthForm: Usuário logado:", user.email)
          console.log("AuthForm: Perfil do usuário:", profile)
          console.log("AuthForm: Papel do usuário:", userRole)
          
          // Redirecionar baseado no papel do usuário
          if (userRole === "admin") {
            console.log("AuthForm: Redirecionando para /admin")
            router.push('/admin')
          } else if (userRole === "moderator") {
            console.log("AuthForm: Redirecionando para /moderator")
            router.push('/moderator')
          } else {
            console.log("AuthForm: Redirecionando para /dashboard")
            router.push('/dashboard')
          }
        } catch (profileError) {
          console.error("AuthForm: Erro ao buscar perfil do usuário:", profileError)
          // Se há erro, redirecionar para dashboard como fallback
          router.push('/dashboard')
        }
      } else {
        // Se não conseguiu obter usuário, redirecionar para dashboard
        console.log("AuthForm: Não foi possível obter usuário, redirecionando para /dashboard")
        router.push('/dashboard')
      }

      toast({
        title: "Login bem-sucedido!",
        description: "Você foi redirecionado para o painel.",
      })
    }
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim() || email.split("@")[0], // Use provided name or fallback to email
        },
      },
    })
    if (error) {
      toast({
        title: "Erro de Cadastro",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Cadastro bem-sucedido!",
        description: "Verifique seu e-mail para confirmar sua conta.",
      })
      setIsSignUp(false) // Switch back to login after signup
      setFullName("") // Clear the form
    }
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isSignUp ? "Cadastre-se na UNIP" : "Login na UNIP"}</CardTitle>
        <CardDescription>
          {isSignUp
            ? "Crie sua conta para acessar o sistema de agendamentos."
            : "Entre com suas credenciais para acessar o sistema."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="grid gap-4">
          {isSignUp && (
            <div className="grid gap-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Seu nome completo"
                required={isSignUp}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu.email@unip.br"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Carregando..." : isSignUp ? "Cadastrar" : "Entrar"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          {isSignUp ? (
            <>
              Já tem uma conta?{" "}
              <Button variant="link" onClick={handleToggleMode} className="p-0 h-auto">
                Faça login
              </Button>
            </>
          ) : (
            <>
              Não tem uma conta?{" "}
              <Button variant="link" onClick={handleToggleMode} className="p-0 h-auto">
                Cadastre-se
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
