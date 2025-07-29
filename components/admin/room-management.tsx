"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Trash2, Edit } from "lucide-react"

interface Room {
  id: string
  name: string
  capacity: number
  description: string | null
  location: string
  is_available: boolean
  currentStatus?: string // Adicionado para o status dinâmico
}

interface Booking {
  item_id: string
  item_type: "room" | "equipment"
  start_time: string
  end_time: string
}

export function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null)
  const [roomName, setRoomName] = useState("")
  const [roomCapacity, setRoomCapacity] = useState<number | string>("")
  const [roomDescription, setRoomDescription] = useState("")
  const [roomLocation, setRoomLocation] = useState("")
  const [roomAvailable, setRoomAvailable] = useState(true)

  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchRoomsWithStatus()
  }, [])

  const fetchRoomsWithStatus = async () => {
    setLoading(true)
    const now = new Date()

    // 1. Fetch all rooms
    const { data: allRooms, error: roomsError } = await supabase
      .from("rooms")
      .select("*")
      .order("name", { ascending: true })

    if (roomsError) {
      toast({ title: "Erro", description: roomsError.message, variant: "destructive" })
      setLoading(false)
      return
    }

    // 2. Fetch all APPROVED bookings
    const { data: approvedBookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("item_id, item_type, start_time, end_time")
      .eq("status", "approved")

    if (bookingsError) {
      toast({ title: "Erro", description: bookingsError.message, variant: "destructive" })
      setLoading(false)
      return
    }

    // 3. Determine current status for each room
    const roomsWithStatus = (allRooms || []).map((room) => {
      let status = "Disponível"
      if (!room.is_available) {
        status = "Indisponível (Admin)"
      } else {
        const isBookedNow = (approvedBookings || []).some((booking) => {
          if (booking.item_type === "room" && booking.item_id === room.id) {
            const bookingStartTime = new Date(booking.start_time)
            const bookingEndTime = new Date(booking.end_time)
            return now >= bookingStartTime && now <= bookingEndTime
          }
          return false
        })
        if (isBookedNow) {
          status = "Em Uso"
        }
      }
      return { ...room, currentStatus: status }
    })

    setRooms(roomsWithStatus)
    setLoading(false)
  }

  const resetForm = () => {
    setCurrentRoom(null)
    setRoomName("")
    setRoomCapacity("")
    setRoomDescription("")
    setRoomLocation("")
    setRoomAvailable(true)
    setIsDialogOpen(false)
  }

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const roomData = {
      name: roomName,
      capacity: Number(roomCapacity),
      description: roomDescription,
      location: roomLocation,
      is_available: roomAvailable,
    }

    if (currentRoom) {
      // Update existing room
      const { error } = await supabase.from("rooms").update(roomData).eq("id", currentRoom.id)
      if (error) {
        toast({ title: "Erro ao atualizar sala", description: error.message, variant: "destructive" })
      } else {
        toast({ title: "Sucesso", description: "Sala atualizada com sucesso!" })
        fetchRoomsWithStatus() // Refresh with new status
        resetForm()
      }
    } else {
      // Add new room
      const { error } = await supabase.from("rooms").insert(roomData)
      if (error) {
        toast({ title: "Erro ao adicionar sala", description: error.message, variant: "destructive" })
      } else {
        toast({ title: "Sucesso", description: "Sala adicionada com sucesso!" })
        fetchRoomsWithStatus() // Refresh with new status
        resetForm()
      }
    }
    setLoading(false)
  }

  const handleEdit = (room: Room) => {
    setCurrentRoom(room)
    setRoomName(room.name)
    setRoomCapacity(room.capacity)
    setRoomDescription(room.description || "")
    setRoomLocation(room.location)
    setRoomAvailable(room.is_available)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta sala?")) return

    setLoading(true)
    const { error } = await supabase.from("rooms").delete().eq("id", id)
    if (error) {
      toast({ title: "Erro ao excluir sala", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Sucesso", description: "Sala excluída com sucesso!" })
      fetchRoomsWithStatus() // Refresh with new status
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Gerenciamento de Salas</CardTitle>
        <Button onClick={() => setIsDialogOpen(true)}>Adicionar Sala</Button>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4">Gerencie as salas disponíveis para agendamento na UNIP.</CardDescription>
        {loading ? (
          <p>Carregando salas...</p>
        ) : rooms.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma sala cadastrada ainda.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Capacidade</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Disponível (Admin)</TableHead>
                <TableHead>Status Atual</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.name}</TableCell>
                  <TableCell>{room.capacity}</TableCell>
                  <TableCell>{room.location}</TableCell>
                  <TableCell>{room.is_available ? "Sim" : "Não"}</TableCell>
                  <TableCell>
                    <span
                      className={`font-medium ${
                        room.currentStatus === "Em Uso"
                          ? "text-yellow-500"
                          : room.currentStatus === "Disponível"
                            ? "text-green-500"
                            : "text-red-500"
                      }`}
                    >
                      {room.currentStatus}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(room)} className="mr-2">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(room.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentRoom ? "Editar Sala" : "Adicionar Nova Sala"}</DialogTitle>
            <CardDescription>
              {currentRoom ? "Atualize os detalhes da sala." : "Preencha os detalhes da nova sala."}
            </CardDescription>
          </DialogHeader>
          <form onSubmit={handleSaveRoom} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Sala</Label>
              <Input id="name" value={roomName} onChange={(e) => setRoomName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="capacity">Capacidade</Label>
              <Input
                id="capacity"
                type="number"
                value={roomCapacity}
                onChange={(e) => setRoomCapacity(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Localização</Label>
              <Input id="location" value={roomLocation} onChange={(e) => setRoomLocation(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Input id="description" value={roomDescription} onChange={(e) => setRoomDescription(e.target.value)} />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is_available" checked={roomAvailable} onCheckedChange={setRoomAvailable} />
              <Label htmlFor="is_available">Disponível (Admin)</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {currentRoom ? "Salvar Alterações" : "Adicionar Sala"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
