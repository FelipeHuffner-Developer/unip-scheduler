"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { CalendarIcon, Download } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BookingReport {
  id: string
  item_type: "room" | "equipment"
  item_id: string
  start_time: string
  end_time: string
  status: "pending" | "approved" | "rejected"
  user_id: string
  itemName?: string
  userName?: string
}

interface SupplyReport {
  id: string
  name: string
  quantity: number
  unit: string | null
  created_at: string
}

interface Room {
  id: string
  name: string
}

interface Equipment {
  id: string
  name: string
}

export function CategoryReports() {
  const [reportType, setReportType] = useState<"bookings" | "supplies">("bookings")
  const [bookings, setBookings] = useState<BookingReport[]>([])
  const [supplies, setSupplies] = useState<SupplyReport[]>([])
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [rooms, setRooms] = useState<Room[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>(undefined)
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | undefined>(undefined)
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined)

  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchItemsForFilters()
  }, [])

  useEffect(() => {
    if (reportType === "bookings") {
      fetchBookingsReport()
    } else {
      fetchSuppliesReport()
    }
  }, [reportType, startDate, endDate, selectedRoomId, selectedEquipmentId, selectedStatus])

  const fetchItemsForFilters = async () => {
    const { data: roomsData, error: roomsError } = await supabase.from("rooms").select("id, name")
    if (roomsError) console.error("Erro ao buscar salas para filtro:", roomsError)
    setRooms(roomsData || [])

    const { data: equipmentData, error: equipmentError } = await supabase.from("equipment").select("id, name")
    if (equipmentError) console.error("Erro ao buscar equipamentos para filtro:", equipmentError)
    setEquipment(equipmentData || [])
  }

  const fetchBookingsReport = async () => {
    setLoading(true)
    let query = supabase.from("bookings").select(`*`).order("created_at", { ascending: false })

    if (startDate) {
      query = query.gte("start_time", startDate.toISOString())
    }
    if (endDate) {
      const endOfDay = new Date(endDate)
      endOfDay.setHours(23, 59, 59, 999)
      query = query.lte("end_time", endOfDay.toISOString())
    }

    if (selectedRoomId === "all") {
      query = query.eq("item_type", "room")
    } else if (selectedRoomId) {
      query = query.eq("item_type", "room").eq("item_id", selectedRoomId)
    } else if (selectedEquipmentId === "all") {
      query = query.eq("item_type", "equipment")
    } else if (selectedEquipmentId) {
      query = query.eq("item_type", "equipment").eq("item_id", selectedEquipmentId)
    }

    if (selectedStatus && selectedStatus !== "all") {
      query = query.eq("status", selectedStatus)
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

  const fetchSuppliesReport = async () => {
    setLoading(true)
    let query = supabase.from("supplies").select("*").order("created_at", { ascending: false })

    if (startDate) {
      query = query.gte("created_at", startDate.toISOString())
    }
    if (endDate) {
      const endOfDay = new Date(endDate)
      endOfDay.setHours(23, 59, 59, 999)
      query = query.lte("created_at", endOfDay.toISOString())
    }

    const { data, error } = await query

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } else {
      setSupplies(data || [])
    }
    setLoading(false)
  }

  const handleClearFilters = () => {
    setStartDate(undefined)
    setEndDate(undefined)
    setSelectedRoomId(undefined)
    setSelectedEquipmentId(undefined)
    setSelectedStatus(undefined)
  }

  const exportToCsv = (data: any[], filename: string, headers: string[]) => {
    if (data.length === 0) {
      toast({ title: "Nenhum dado para exportar", description: "Não há dados para gerar o CSV.", variant: "default" })
      return
    }

    const csvRows = []
    csvRows.push(headers.join(","))

    for (const row of data) {
      const values = headers.map((header) => {
        let value: any = row[header.toLowerCase().replace(/ /g, "_")]

        if (header === "Início" || header === "Término" || header === "Data de Registro") {
          const dateValue = row[header.toLowerCase().replace(/ /g, "_")]
          if (dateValue) {
            const dateObj = new Date(dateValue)
            value = !isNaN(dateObj.getTime()) ? format(dateObj, "dd/MM/yyyy HH:mm") : ""
          } else {
            value = "" // Fallback for null/undefined date values
          }
        } else if (header === "Item") {
          value = row.itemName || row.name || ""
        } else if (header === "Tipo") {
          value = row.item_type === "room" ? "Sala" : row.item_type === "equipment" ? "Equipamento" : ""
        } else if (header === "Solicitante") {
          value = row.userName || ""
        } else if (header === "Status") {
          value =
            row.status === "pending"
              ? "Aguardando Aprovação"
              : row.status === "approved"
                ? "Aprovado"
                : row.status === "rejected"
                  ? "Rejeitado"
                  : ""
        }

        // Ensure value is a string before checking for commas/quotes
        const stringValue = String(value)
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      })
      csvRows.push(values.join(","))
    }

    const csvString = csvRows.join("\n")
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", filename)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleExport = () => {
    if (reportType === "bookings") {
      const headers = ["Item", "Tipo", "Solicitante", "Início", "Término", "Status"]
      exportToCsv(bookings, "relatorio_agendamentos.csv", headers)
    } else {
      const headers = ["Nome", "Quantidade", "Unidade", "Data de Registro"]
      exportToCsv(supplies, "relatorio_insumos.csv", headers)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Relatórios por Categoria</CardTitle>
        <div className="flex gap-2">
          <Select
            value={reportType}
            onValueChange={(value: "bookings" | "supplies") => {
              setReportType(value)
              handleClearFilters()
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de Relatório" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bookings">Agendamentos</SelectItem>
              <SelectItem value="supplies">Insumos</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} variant="outline" size="icon" className="bg-transparent">
            <Download className="h-4 w-4" />
            <span className="sr-only">Exportar CSV</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4">
          Visualize relatórios detalhados de {reportType === "bookings" ? "agendamentos" : "insumos"}.
        </CardDescription>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="grid gap-2">
            <Label htmlFor="start-date">Data Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Selecione</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="end-date">Data Fim</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Selecione</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          {reportType === "bookings" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="room-filter">Filtrar por Sala</Label>
                <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                  <SelectTrigger id="room-filter">
                    <SelectValue/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={undefined}>Nenhum</SelectItem>
                    <SelectItem value="all">Todas as Salas</SelectItem>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="equipment-filter">Filtrar por Equipamento</Label>
                <Select value={selectedEquipmentId} onValueChange={setSelectedEquipmentId}>
                  <SelectTrigger id="equipment-filter">
                    <SelectValue/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={undefined}>Nenhum</SelectItem>
                    <SelectItem value="all">Todos os Equipamentos</SelectItem>
                    {equipment.map((eq) => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status-filter">Filtrar por Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger id="status-filter">
                    <SelectValue/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={undefined}>Nenhum</SelectItem>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="pending">Aguardando Aprovação</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="flex items-end">
            <Button variant="outline" onClick={handleClearFilters} className="w-full bg-transparent">
              Limpar Filtros
            </Button>
          </div>
        </div>

        {loading ? (
          <p>Carregando relatório...</p>
        ) : reportType === "bookings" ? (
          bookings.length === 0 ? (
            <p className="text-muted-foreground">Nenhum agendamento encontrado com os filtros aplicados.</p>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Término</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.itemName}</TableCell>
                      <TableCell>{booking.item_type === "room" ? "Sala" : "Equipamento"}</TableCell>
                      <TableCell>{booking.userName}</TableCell>
                      <TableCell>{format(new Date(booking.start_time), "dd/MM/yyyy HH:mm")}</TableCell>
                      <TableCell>{format(new Date(booking.end_time), "HH:mm")}</TableCell>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        ) : supplies.length === 0 ? (
          <p className="text-muted-foreground">Nenhum insumo encontrado com os filtros aplicados.</p>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Data de Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplies.map((supply) => (
                  <TableRow key={supply.id}>
                    <TableCell className="font-medium">{supply.name}</TableCell>
                    <TableCell>{supply.quantity}</TableCell>
                    <TableCell>{supply.unit || "-"}</TableCell>
                    <TableCell>{format(new Date(supply.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
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
