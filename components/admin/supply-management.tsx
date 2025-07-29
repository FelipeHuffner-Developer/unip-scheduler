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
import { Trash2, Edit } from "lucide-react"
import { cn } from "@/lib/utils"

interface Supply {
  id: string
  name: string
  description: string | null
  quantity: number
  unit: string | null
  min_quantity: number | null
}

export function SupplyManagement() {
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentSupply, setCurrentSupply] = useState<Supply | null>(null)
  const [supplyName, setSupplyName] = useState("")
  const [supplyDescription, setSupplyDescription] = useState("")
  const [supplyQuantity, setSupplyQuantity] = useState<number | string>("")
  const [supplyUnit, setSupplyUnit] = useState("")
  const [minSupplyQuantity, setMinSupplyQuantity] = useState<number | string>("")

  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchSupplies()
  }, [])

  const fetchSupplies = async () => {
    setLoading(true)
    const { data, error } = await supabase.from("supplies").select("*").order("name", { ascending: true })
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } else {
      setSupplies(data || [])
      if (data) {
        data.forEach((supply) => {
          if (supply.min_quantity !== null && supply.quantity < supply.min_quantity) {
            toast({
              title: "Alerta de Estoque Baixo!",
              description: `O insumo "${supply.name}" está abaixo da quantidade mínima (${supply.quantity} de ${supply.min_quantity}).`,
              variant: "destructive",
              duration: 5000,
            })
          }
        })
      }
    }
    setLoading(false)
  }

  const resetForm = () => {
    setCurrentSupply(null)
    setSupplyName("")
    setSupplyDescription("")
    setSupplyQuantity("")
    setSupplyUnit("")
    setMinSupplyQuantity("")
    setIsDialogOpen(false)
  }

  const handleSaveSupply = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supplyData = {
      name: supplyName,
      description: supplyDescription,
      quantity: Number(supplyQuantity),
      unit: supplyUnit,
      min_quantity: minSupplyQuantity === "" ? null : Number(minSupplyQuantity),
    }

    if (currentSupply) {
      const { error } = await supabase.from("supplies").update(supplyData).eq("id", currentSupply.id)
      if (error) {
        toast({ title: "Erro ao atualizar insumo", description: error.message, variant: "destructive" })
      } else {
        toast({ title: "Sucesso", description: "Insumo atualizado com sucesso!" })
        fetchSupplies()
        resetForm()
      }
    } else {
      const { error } = await supabase.from("supplies").insert(supplyData)
      if (error) {
        toast({ title: "Erro ao adicionar insumo", description: error.message, variant: "destructive" })
      } else {
        toast({ title: "Sucesso", description: "Insumo adicionado com sucesso!" })
        fetchSupplies()
        resetForm()
      }
    }
    setLoading(false)
  }

  const handleEdit = (supply: Supply) => {
    setCurrentSupply(supply)
    setSupplyName(supply.name)
    setSupplyDescription(supply.description || "")
    setSupplyQuantity(supply.quantity)
    setSupplyUnit(supply.unit || "")
    setMinSupplyQuantity(supply.min_quantity !== null ? supply.min_quantity : "")
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este insumo?")) return

    setLoading(true)
    const { error } = await supabase.from("supplies").delete().eq("id", id)
    if (error) {
      toast({ title: "Erro ao excluir insumo", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Sucesso", description: "Insumo excluído com sucesso!" })
      fetchSupplies()
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Gerenciamento de Insumos</CardTitle>
        <Button onClick={() => setIsDialogOpen(true)}>Adicionar Insumo</Button>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4">Gerencie os insumos disponíveis para registro na UNIP.</CardDescription>
        {loading ? (
          <p>Carregando insumos...</p>
        ) : supplies.length === 0 ? (
          <p className="text-muted-foreground">Nenhum insumo cadastrado ainda.</p>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Mín. Estoque</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplies.map((supply) => (
                  <TableRow
                    key={supply.id}
                    className={cn({
                      "bg-red-900/20 hover:bg-red-900/30":
                        supply.min_quantity !== null && supply.quantity < supply.min_quantity,
                    })}
                  >
                    <TableCell className="font-medium">{supply.name}</TableCell>
                    <TableCell>{supply.description}</TableCell>
                    <TableCell>{supply.quantity}</TableCell>
                    <TableCell>{supply.min_quantity !== null ? supply.min_quantity : "-"}</TableCell>
                    <TableCell>{supply.unit}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(supply)} className="mr-2">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(supply.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentSupply ? "Editar Insumo" : "Adicionar Novo Insumo"}</DialogTitle>
            <CardDescription>
              {currentSupply ? "Atualize os detalhes do insumo." : "Preencha os detalhes do novo insumo."}
            </CardDescription>
          </DialogHeader>
          <form onSubmit={handleSaveSupply} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Insumo</Label>
              <Input id="name" value={supplyName} onChange={(e) => setSupplyName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Input
                id="description"
                value={supplyDescription}
                onChange={(e) => setSupplyDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantidade Atual</Label>
              <Input
                id="quantity"
                type="number"
                value={supplyQuantity}
                onChange={(e) => setSupplyQuantity(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="min_quantity">Quantidade Mínima (Alerta)</Label>
              <Input
                id="min_quantity"
                type="number"
                value={minSupplyQuantity}
                onChange={(e) => setMinSupplyQuantity(e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit">Unidade (Ex: unidades, caixas, litros)</Label>
              <Input id="unit" value={supplyUnit} onChange={(e) => setSupplyUnit(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {currentSupply ? "Salvar Alterações" : "Adicionar Insumo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
