"use client"

import { useEffect, useState } from "react"
import { CircleCheck, CircleX } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function SupabaseStatusIndicator() {
  const [status, setStatus] = useState<"loading" | "active" | "error">("loading")
  const [message, setMessage] = useState("Verificando status do Supabase...")

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch("/api/supabase-status")
        const data = await response.json()
        if (data.status === "active") {
          setStatus("active")
          setMessage("Supabase está ativo.")
        } else {
          setStatus("error")
          setMessage(`Supabase com problemas: ${data.message}`)
        }
      } catch (error) {
        setStatus("error")
        setMessage("Não foi possível conectar ao Supabase.")
      }
    }
    checkStatus()
    const interval = setInterval(checkStatus, 60000) // Verifica a cada minuto
    return () => clearInterval(interval)
  }, [])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-sm">
            {status === "loading" && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
              </span>
            )}
            {status === "active" && <CircleCheck className="h-4 w-4 text-green-500" />}
            {status === "error" && <CircleX className="h-4 w-4 text-red-500" />}
            <span className="sr-only">{message}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
