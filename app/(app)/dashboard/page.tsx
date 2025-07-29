"use client"

import { BookingForm } from "@/components/booking-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { useEffect, useState } from "react"

interface Booking {
  id: string
  item_type: "room" | "equipment"
  item_id: string
  start_time: string
  end_time: string
  status: "pending" | "approved" | "rejected"
  notes: string | null
  created_at: string
  user_id: string
}

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [itemNames, setItemNames] = useState<Record<string, string>>({})
  const [userNames, setUserNames] = useState<Record<string, string>>({}) // Novo estado para nomes de usuários

  const supabase = createClient()

  useEffect(() => {
    const fetchBookingsAndRelatedData = async () => {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: fetchedBookings, error } = await supabase
        .from("bookings")
        .select(`*`) // Removido o select aninhado para profiles
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar agendamentos:", error)
      } else {
        setBookings(fetchedBookings || [])

        const roomIds = fetchedBookings?.filter((b) => b.item_type === "room").map((b) => b.item_id) || []
        const equipmentIds = fetchedBookings?.filter((b) => b.item_type === "equipment").map((b) => b.item_id) || []
        const userIds = fetchedBookings?.map((b) => b.user_id) || [] // Coleta todos os user_ids

        const uniqueRoomIds = [...new Set(roomIds)]
        const uniqueEquipmentIds = [...new Set(equipmentIds)]
        const uniqueUserIds = [...new Set(userIds)]

        const names: Record<string, string> = {}
        const profileNames: Record<string, string> = {}

        // Buscar nomes de salas
        if (uniqueRoomIds.length > 0) {
          const { data: roomsData, error: roomsError } = await supabase
            .from("rooms")
            .select("id, name")
            .in("id", uniqueRoomIds)
          if (roomsError) console.error("Erro ao buscar nomes de salas:", roomsError)
          roomsData?.forEach((room) => (names[room.id] = room.name))
        }

        // Buscar nomes de equipamentos
        if (uniqueEquipmentIds.length > 0) {
          const { data: equipmentData, error: equipmentError } = await supabase
            .from("equipment")
            .select("id, name")
            .in("id", uniqueEquipmentIds)
          if (equipmentError) console.error("Erro ao buscar nomes de equipamentos:", equipmentError)
          equipmentData?.forEach((eq) => (names[eq.id] = eq.name))
        }

        // Buscar nomes de perfis
        if (uniqueUserIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", uniqueUserIds)
          if (profilesError) console.error("Erro ao buscar nomes de perfis:", profilesError)
          profilesData?.forEach(
            (profile) => (profileNames[profile.id] = profile.full_name || profile.email || "Usuário Desconhecido"),
          )
        }

        setItemNames(names)
        setUserNames(profileNames)
      }
      setLoading(false)
    }

    fetchBookingsAndRelatedData()
  }, [supabase])

  if (loading) {
    return <p>Carregando seus agendamentos...</p>
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <BookingForm />

      <Card>
        <CardHeader>
          <CardTitle>Meus Agendamentos</CardTitle>
          <CardDescription>Visualize o status das suas solicitações de agendamento.</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length > 0 ? (
            <div className="grid gap-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="border rounded-md p-4">
                  <p className="font-semibold">
                    {booking.item_type === "room" ? "Sala" : "Equipamento"}:{" "}
                    {itemNames[booking.item_id] || "Nome Desconhecido"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Solicitante: {userNames[booking.user_id] || "Desconhecido"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Data: {format(new Date(booking.start_time), "dd/MM/yyyy")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Horário: {format(new Date(booking.start_time), "HH:mm")} -{" "}
                    {format(new Date(booking.end_time), "HH:mm")}
                  </p>
                  <p className="text-sm">
                    Status:{" "}
                    <span
                      className={`font-medium ${
                        booking.status === "approved"
                          ? "text-green-600"
                          : booking.status === "rejected"
                            ? "text-red-600"
                            : "text-yellow-600"
                      }`}
                    >
                      {booking.status === "pending"
                        ? "Aguardando Aprovação" // Alterado de "Pendente"
                        : booking.status === "approved"
                          ? "Aprovado"
                          : "Rejeitado"}
                    </span>
                  </p>
                  {booking.notes && <p className="text-sm text-muted-foreground mt-2">Obs: {booking.notes}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Você ainda não fez nenhum agendamento.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
