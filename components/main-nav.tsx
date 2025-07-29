"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Package2, Menu } from "lucide-react" // Importar Menu
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SupabaseStatusIndicator } from "./supabase-status-indicator"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet" // Importar Sheet components
import { useEffect, useState } from "react"

interface MainNavProps {
  userRole: string | null
  userName: string | null
}

export function MainNav({ userRole: initialUserRole, userName: initialUserName }: MainNavProps) {
  const pathname = usePathname()
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()
  
  // Estado local para verificar autenticação em tempo real
  const [userRole, setUserRole] = useState<string | null>(initialUserRole)
  const [userName, setUserName] = useState<string | null>(initialUserName)
  const [isLoading, setIsLoading] = useState(true)

  // Verificar estado de autenticação em tempo real
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("role, full_name")
              .eq("id", user.id)
              .single()

            if (profile) {
              setUserRole(profile.role || "common")
              setUserName(profile.full_name || user.email || null)
            } else {
              setUserRole(null)
              setUserName(null)
            }
          } catch (profileError) {
            console.error("Erro ao buscar perfil:", profileError)
            setUserRole(null)
            setUserName(null)
          }
        } else {
          setUserRole(null)
          setUserName(null)
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        setUserRole(null)
        setUserName(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUserRole(null)
        setUserName(null)
      } else if (event === 'SIGNED_IN' && session?.user) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, full_name")
            .eq("id", session.user.id)
            .single()

          if (profile) {
            setUserRole(profile.role || "common")
            setUserName(profile.full_name || session.user.email || null)
          }
        } catch (profileError) {
          console.error("Erro ao buscar perfil após login:", profileError)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Sessão encerrada",
        description: "Você foi desconectado com sucesso.",
      })
      router.push('/login') // Redirecionar para login ao invés de refresh
    }
  }

  // Se não há usuário logado, mostrar apenas o logo e link para login
  if (!userRole && !isLoading) {
    return (
      <header className="flex h-16 w-full shrink-0 items-center pt-4">
        <div className="flex w-full max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Package2 className="h-6 w-6" />
            <span className="font-bold">UNIP SGSEI</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={cn(
                "transition-colors hover:text-foreground",
                pathname === "/login" ? "text-foreground" : "text-muted-foreground",
              )}
            >
              Login
            </Link>
            <SupabaseStatusIndicator />
          </div>
        </div>
      </header>
    )
  }

  const navLinks = (
    <>
      {userRole === "common" && (
        <Link
          href="/dashboard"
          className={cn(
            "transition-colors hover:text-foreground",
            pathname === "/dashboard" ? "text-foreground" : "text-muted-foreground",
          )}
        >
          Agendamentos
        </Link>
      )}
      {userRole === "moderator" && (
        <>
          <Link
            href="/moderator"
            className={cn(
              "transition-colors hover:text-foreground",
              pathname === "/moderator" ? "text-foreground" : "text-muted-foreground",
            )}
          >
            Aprovações
          </Link>
          <Link
            href="/reports"
            className={cn(
              "transition-colors hover:text-foreground",
              pathname === "/reports" ? "text-foreground" : "text-muted-foreground",
            )}
          >
            Relatórios
          </Link>
        </>
      )}
      {userRole === "admin" && (
        <>
          <Link
            href="/admin"
            className={cn(
              "transition-colors hover:text-foreground",
              pathname === "/admin" ? "text-foreground" : "text-muted-foreground",
            )}
          >
            Administração
          </Link>
          <Link
            href="/moderator"
            className={cn(
              "transition-colors hover:text-foreground",
              pathname === "/moderator" ? "text-foreground" : "text-muted-foreground",
            )}
          >
            Aprovações
          </Link>
          <Link
            href="/reports"
            className={cn(
              "transition-colors hover:text-foreground",
              pathname === "/reports" ? "text-foreground" : "text-muted-foreground",
            )}
          >
            Relatórios
          </Link>
        </>
      )}
    </>
  )

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b bg-background px-4 pt-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:pt-4">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden bg-transparent">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Navigation Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium pt-6">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
              <Package2 className="h-6 w-6" />
              <span className="sr-only">UNIP SGSEI</span>
              <span>UNIP SGSEI</span>
            </Link>
            {navLinks}
          </nav>
        </SheetContent>
      </Sheet>

      <Link href="/" className="flex items-center gap-2 font-semibold hidden sm:flex">
        <Package2 className="h-6 w-6" />
        <span className="sr-only">UNIP SGSEI</span>
        <span className="hidden md:inline">UNIP SGSEI</span>
      </Link>
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        {navLinks}
      </nav>
      <div className="ml-auto flex items-center gap-4">
        <SupabaseStatusIndicator />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLogout}
          className="text-sm"
        >
          Sair
        </Button>
        {userName && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="rounded-full">
                {userName.charAt(0).toUpperCase()}
                <span className="sr-only">Menu do usuário</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{userName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
