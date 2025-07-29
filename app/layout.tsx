import type React from "react"
import type { Metadata } from "next/types"
import { Inter } from "next/font/google"
import "./globals.css"
import { MainNav } from "@/components/main-nav"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "UNIP SGSEI",
  description: "Sistema de Gerenciamento de Salas, Equipamentos e Insumos para a UNIP.",
    generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>
        <div className="flex min-h-screen w-full flex-col">
          <MainNav userRole={null} userName={null} />
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  )
}
