"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { CheckCircle, XCircle, Ban } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Booking {
  id: string
  user_id: string
  item_type: "room" | "equipment"
  item_id: string
  start_time: string
  end_time: string
  status: "pending" | "approved" | "rejected"
  notes: string | null
  created_at: string
  itemName?: string
  userName?: string
}

export function BookingApproval() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined) // Alterado para undefined

  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchBookings()
  }, [filterStatus])

  const fetchBookings = async () => {
    setLoading(true)
    let query = supabase.from("bookings").select(`*`).order("created_at", { ascending: true })

    if (filterStatus && filterStatus !== "all") {
      // Se filterStatus não for undefined e não for "all"
      query = query.eq("status", filterStatus)
    }

    const { data: fetchedBookings, error } = await query

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } else {
      const itemIds = fetchedBookings?.map((b) => b.item_id) || []
      const userIds = fetchedBookings?.map((b) => b.user_id) || []

      const uniqueItemIds = [...new Set(itemIds)]
      const uniqueUserIds = [...new Set(userIds)]

      const itemNamesMap: Record<string, string> = {}
      const userNamesMap: Record<string, string> = {}

      if (uniqueItemIds.length > 0) {
        const { data: roomsData, error: roomsError } = await supabase
          .from("rooms")
          .select("id, name")
          .in("id", uniqueItemIds)
        if (roomsError) console.error("Erro ao buscar nomes de salas:", roomsError)
        roomsData?.forEach((room) => (itemNamesMap[room.id] = room.name))

        const { data: equipmentData, error: equipmentError } = await supabase
          .from("equipment")
          .select("id, name")
          .in("id", uniqueItemIds)
        if (equipmentError) console.error("Erro ao buscar nomes de equipamentos:", equipmentError)
        equipmentData?.forEach((eq) => (itemNamesMap[eq.id] = eq.name))
      }

      if (uniqueUserIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", uniqueUserIds)
        if (profilesError) console.error("Erro ao buscar nomes de perfis:", profilesError)
        profilesData?.forEach(
          (profile) => (userNamesMap[profile.id] = profile.full_name || profile.email || "Usuário Desconhecido"),
        )
      }

      const bookingsWithNames = (fetchedBookings || []).map((booking) => ({
        ...booking,
        itemName: itemNamesMap[booking.item_id] || "Nome Desconhecido",
        userName: userNamesMap[booking.user_id] || "Usuário Desconhecido",
      }))
      setBookings(bookingsWithNames)
    }
    setLoading(false)
  }

  const handleStatusChange = async (bookingId: string, newStatus: "approved" | "rejected") => {
    setLoading(true)
    const { error } = await supabase.from("bookings").update({ status: newStatus }).eq("id", bookingId)

    if (error) {
      toast({ title: "Erro ao atualizar status", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Sucesso", description: `Agendamento ${newStatus === "approved" ? "aprovado" : "rejeitado"}!` })
      fetchBookings() // Refresh the list
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Aprovação de Agendamentos</CardTitle>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={undefined}>Nenhum</SelectItem>
            <SelectItem value="all">Todos os Status</SelectItem> {/* Reintroduzido "Todos os Status" */}
            <SelectItem value="pending">Aguardando Aprovação</SelectItem>
            <SelectItem value="approved">Aprovados</SelectItem>
            <SelectItem value="rejected">Rejeitados</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4">Revise e gerencie as solicitações de agendamento.</CardDescription>
        {loading ? (
          <p>Carregando agendamentos...</p>
        ) : bookings.length === 0 ? (
          <p className="text-muted-foreground">Nenhum agendamento encontrado com o status selecionado.</p>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      {booking.item_type === "room" ? "Sala" : "Equipamento"}: {booking.itemName}
                    </TableCell>
                    <TableCell>{booking.userName}</TableCell>
                    <TableCell>
                      {format(new Date(booking.start_time), "dd/MM/yyyy HH:mm")} -{" "}
                      {format(new Date(booking.end_time), "HH:mm")}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{booking.notes || "-"}</TableCell>
                    <TableCell>
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
                          ? "Aguardando Aprovação"
                          : booking.status === "approved"
                            ? "Aprovado"
                            : "Rejeitado"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {booking.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStatusChange(booking.id, "approved")}
                            className="text-green-600 hover:text-green-700"
                            disabled={loading}
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span className="sr-only">Aprovar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStatusChange(booking.id, "rejected")}
                            className="text-red-600 hover:text-red-700"
                            disabled={loading}
                          >
                            <XCircle className="h-4 w-4" />
                            <span className="sr-only">Rejeitar</span>
                          </Button>
                        </>
                      )}
                      {booking.status === "approved" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStatusChange(booking.id, "rejected")} // Mudar para rejeitado
                          className="text-red-600 hover:text-red-700"
                          disabled={loading}
                          title="Cancelar Aprovação"
                        >
                          <Ban className="h-4 w-4" />
                          <span className="sr-only">Cancelar Aprovação</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
