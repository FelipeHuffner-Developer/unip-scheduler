"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Room {
  id: string
  name: string
  capacity: number
  location: string
  is_available: boolean // Adicionado para filtro administrativo
}

interface Equipment {
  id: string
  name: string
  quantity: number
  is_available: boolean // Adicionado para filtro administrativo
}

interface Booking {
  item_id: string
  item_type: "room" | "equipment"
  start_time: string
  end_time: string
}

export function BookingForm() {
  const [itemType, setItemType] = useState<"room" | "equipment">("room")
  const [selectedItemId, setSelectedItemId] = useState<string>("")
  const [startTime, setStartTime] = useState<string>("")
  const [endTime, setEndTime] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [rooms, setRooms] = useState<Room[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [date, setDate] = useState<Date | undefined>(new Date())

  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchItemsAndAvailability = async () => {
      setLoading(true)
      const now = new Date()

      // 1. Fetch all rooms and equipment (including their admin availability)
      const { data: allRooms, error: roomsError } = await supabase
        .from("rooms")
        .select("id, name, capacity, location, is_available")
      const { data: allEquipment, error: equipmentError } = await supabase
        .from("equipment")
        .select("id, name, quantity, is_available")

      if (roomsError) {
        toast({ title: "Erro", description: roomsError.message, variant: "destructive" })
      }
      if (equipmentError) {
        toast({ title: "Erro", description: equipmentError.message, variant: "destructive" })
      }

      // 2. Fetch all APPROVED bookings
      const { data: approvedBookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("item_id, item_type, start_time, end_time")
        .eq("status", "approved")

      if (bookingsError) {
        toast({ title: "Erro", description: bookingsError.message, variant: "destructive" })
      }

      // 3. Determine which items are currently booked
      const activeBookedItems = new Set<string>()
      ;(approvedBookings || []).forEach((booking) => {
        const bookingStartTime = new Date(booking.start_time)
        const bookingEndTime = new Date(booking.end_time)
        // Check if 'now' is within the booking period
        if (now >= bookingStartTime && now <= bookingEndTime) {
          activeBookedItems.add(booking.item_id)
        }
      })

      // 4. Filter rooms: must be admin-available AND not currently booked
      const availableRooms = (allRooms || []).filter((room) => room.is_available && !activeBookedItems.has(room.id))
      setRooms(availableRooms)

      // 5. Filter equipment: must be admin-available AND not currently booked
      const availableEquipment = (allEquipment || []).filter((eq) => eq.is_available && !activeBookedItems.has(eq.id))
      setEquipment(availableEquipment)

      setLoading(false)
    }
    fetchItemsAndAvailability()
  }, [supabase, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!date) {
      toast({ title: "Erro", description: "Por favor, selecione uma data.", variant: "destructive" })
      setLoading(false)
      return
    }

    const startDateTime = new Date(date)
    const [startHour, startMinute] = startTime.split(":").map(Number)
    startDateTime.setHours(startHour, startMinute, 0, 0)

    const endDateTime = new Date(date)
    const [endHour, endMinute] = endTime.split(":").map(Number)
    endDateTime.setHours(endHour, endMinute, 0, 0)

    if (startDateTime >= endDateTime) {
      toast({
        title: "Erro",
        description: "A hora de início deve ser anterior à hora de término.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para fazer um agendamento.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    // --- Nova Validação de Sobreposição de Agendamentos ---
    const { data: existingBookings, error: overlapError } = await supabase
      .from("bookings")
      .select("id, start_time, end_time")
      .eq("item_id", selectedItemId)
      .eq("item_type", itemType)
      .eq("status", "approved") // Apenas agendamentos aprovados
      .or(`and(start_time.lte.${endDateTime.toISOString()},end_time.gte.${startDateTime.toISOString()})`)

    if (overlapError) {
      toast({
        title: "Erro de Validação",
        description: `Erro ao verificar agendamentos existentes: ${overlapError.message}`,
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    if (existingBookings && existingBookings.length > 0) {
      toast({
        title: "Item Ocupado",
        description:
          "Este item já está agendado e aprovado para o período selecionado. Por favor, escolha outro item ou horário.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }
    // --- Fim da Nova Validação ---

    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      item_type: itemType,
      item_id: selectedItemId,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      notes: notes,
      status: "pending", // Default status
    })

    if (error) {
      toast({
        title: "Erro ao agendar",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Agendamento enviado!",
        description: "Sua solicitação de agendamento foi enviada para aprovação.",
      })
      // Reset form
      setSelectedItemId("")
      setStartTime("")
      setEndTime("")
      setNotes("")
      setDate(new Date())
      router.refresh() // Adicionado para forçar o refresh da página
    }
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Solicitar Agendamento</CardTitle>
        <CardDescription>Preencha os detalhes para agendar uma sala ou equipamento na UNIP.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="item-type">Tipo de Item</Label>
            <Select
              value={itemType}
              onValueChange={(value: "room" | "equipment") => {
                setItemType(value)
                setSelectedItemId("") // Reset selected item when type changes
              }}
            >
              <SelectTrigger id="item-type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="room">Sala</SelectItem>
                <SelectItem value="equipment">Equipamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="item-select">{itemType === "room" ? "Selecione a Sala" : "Selecione o Equipamento"}</Label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger id="item-select">
                <SelectValue placeholder={`Selecione ${itemType === "room" ? "uma sala" : "um equipamento"}`} />
              </SelectTrigger>
              <SelectContent>
                {itemType === "room"
                  ? rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name} (Capacidade: {room.capacity}, Local: {room.location})
                      </SelectItem>
                    ))
                  : equipment.map((eq) => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.name} (Disponível: {eq.quantity})
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">Data do Agendamento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start-time">Hora de Início</Label>
              <Input
                id="start-time"
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-time">Hora de Término</Label>
              <Input id="end-time" type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Observações (Opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Detalhes adicionais sobre o agendamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !selectedItemId || !date || !startTime || !endTime}
          >
            {loading ? "Enviando..." : "Solicitar Agendamento"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
