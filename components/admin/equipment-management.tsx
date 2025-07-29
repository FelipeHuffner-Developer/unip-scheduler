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

interface Equipment {
  id: string
  name: string
  description: string | null
  quantity: number
  is_available: boolean
  currentStatus?: string // Adicionado para o status dinâmico
}

interface Booking {
  item_id: string
  item_type: "room" | "equipment"
  start_time: string
  end_time: string
}

export function EquipmentManagement() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentEquipment, setCurrentEquipment] = useState<Equipment | null>(null)
  const [equipmentName, setEquipmentName] = useState("")
  const [equipmentDescription, setEquipmentDescription] = useState("")
  const [equipmentQuantity, setEquipmentQuantity] = useState<number | string>("")
  const [equipmentAvailable, setEquipmentAvailable] = useState(true)

  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchEquipmentWithStatus()
  }, [])

  const fetchEquipmentWithStatus = async () => {
    setLoading(true)
    const now = new Date()

    // 1. Fetch all equipment
    const { data: allEquipment, error: equipmentError } = await supabase
      .from("equipment")
      .select("*")
      .order("name", { ascending: true })

    if (equipmentError) {
      toast({ title: "Erro", description: equipmentError.message, variant: "destructive" })
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

    // 3. Determine current status for each equipment
    const equipmentWithStatus = (allEquipment || []).map((eq) => {
      let status = "Disponível"
      if (!eq.is_available) {
        status = "Indisponível (Admin)"
      } else {
        const isBookedNow = (approvedBookings || []).some((booking) => {
          if (booking.item_type === "equipment" && booking.item_id === eq.id) {
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
      return { ...eq, currentStatus: status }
    })

    setEquipment(equipmentWithStatus)
    setLoading(false)
  }

  const resetForm = () => {
    setCurrentEquipment(null)
    setEquipmentName("")
    setEquipmentDescription("")
    setEquipmentQuantity("")
    setEquipmentAvailable(true)
    setIsDialogOpen(false)
  }

  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const equipmentData = {
      name: equipmentName,
      description: equipmentDescription,
      quantity: Number(equipmentQuantity),
      is_available: equipmentAvailable,
    }

    if (currentEquipment) {
      // Update existing equipment
      const { error } = await supabase.from("equipment").update(equipmentData).eq("id", currentEquipment.id)
      if (error) {
        toast({ title: "Erro ao atualizar equipamento", description: error.message, variant: "destructive" })
      } else {
        toast({ title: "Sucesso", description: "Equipamento atualizado com sucesso!" })
        fetchEquipmentWithStatus() // Refresh with new status
        resetForm()
      }
    } else {
      // Add new equipment
      const { error } = await supabase.from("equipment").insert(equipmentData)
      if (error) {
        toast({ title: "Erro ao adicionar equipamento", description: error.message, variant: "destructive" })
      } else {
        toast({ title: "Sucesso", description: "Equipamento adicionado com sucesso!" })
        fetchEquipmentWithStatus() // Refresh with new status
        resetForm()
      }
    }
    setLoading(false)
  }

  const handleEdit = (eq: Equipment) => {
    setCurrentEquipment(eq)
    setEquipmentName(eq.name)
    setEquipmentDescription(eq.description || "")
    setEquipmentQuantity(eq.quantity)
    setEquipmentAvailable(eq.is_available)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este equipamento?")) return

    setLoading(true)
    const { error } = await supabase.from("equipment").delete().eq("id", id)
    if (error) {
      toast({ title: "Erro ao excluir equipamento", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Sucesso", description: "Equipamento excluído com sucesso!" })
      fetchEquipmentWithStatus() // Refresh with new status
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Gerenciamento de Equipamentos</CardTitle>
        <Button onClick={() => setIsDialogOpen(true)}>Adicionar Equipamento</Button>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4">
          Gerencie os equipamentos disponíveis para agendamento na UNIP.
        </CardDescription>
        {loading ? (
          <p>Carregando equipamentos...</p>
        ) : equipment.length === 0 ? (
          <p className="text-muted-foreground">Nenhum equipamento cadastrado ainda.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Disponível (Admin)</TableHead>
                <TableHead>Status Atual</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.map((eq) => (
                <TableRow key={eq.id}>
                  <TableCell className="font-medium">{eq.name}</TableCell>
                  <TableCell>{eq.description}</TableCell>
                  <TableCell>{eq.quantity}</TableCell>
                  <TableCell>{eq.is_available ? "Sim" : "Não"}</TableCell>
                  <TableCell>
                    <span
                      className={`font-medium ${
                        eq.currentStatus === "Em Uso"
                          ? "text-yellow-500"
                          : eq.currentStatus === "Disponível"
                            ? "text-green-500"
                            : "text-red-500"
                      }`}
                    >
                      {eq.currentStatus}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(eq)} className="mr-2">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(eq.id)}>
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
            <DialogTitle>{currentEquipment ? "Editar Equipamento" : "Adicionar Novo Equipamento"}</DialogTitle>
            <CardDescription>
              {currentEquipment ? "Atualize os detalhes do equipamento." : "Preencha os detalhes do novo equipamento."}
            </CardDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEquipment} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Equipamento</Label>
              <Input id="name" value={equipmentName} onChange={(e) => setEquipmentName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Input
                id="description"
                value={equipmentDescription}
                onChange={(e) => setEquipmentDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                value={equipmentQuantity}
                onChange={(e) => setEquipmentQuantity(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is_available" checked={equipmentAvailable} onCheckedChange={setEquipmentAvailable} />
              <Label htmlFor="is_available">Disponível (Admin)</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {currentEquipment ? "Salvar Alterações" : "Adicionar Equipamento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
