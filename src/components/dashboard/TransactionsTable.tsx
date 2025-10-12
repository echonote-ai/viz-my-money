import { useState } from "react";
import { Transaction } from "@/pages/Dashboard";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface TransactionsTableProps {
  transactions: Transaction[];
  onUpdate: () => void;
}

const TransactionsTable = ({ transactions, onUpdate }: TransactionsTableProps) => {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState<Partial<Transaction>>({});
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData(transaction);
  };

  const handleSave = async () => {
    if (!editingTransaction) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          category: formData.category,
          subcategory: formData.subcategory,
          income: formData.income,
          expense: formData.expense,
          note: formData.note,
          labels: formData.labels,
        })
        .eq("id", editingTransaction.id);

      if (error) throw error;

      toast.success("Transaction updated successfully");
      setEditingTransaction(null);
      onUpdate();
    } catch (error: any) {
      toast.error("Failed to update transaction");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id);

      if (error) throw error;

      toast.success("Transaction deleted");
      onUpdate();
    } catch (error: any) {
      toast.error("Failed to delete transaction");
    }
  };

  const displayedTransactions = transactions.slice(0, itemsPerPage);

  return (
    <>
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <div className="flex gap-1">
              <Button
                variant={itemsPerPage === 50 ? "default" : "outline"}
                size="sm"
                onClick={() => setItemsPerPage(50)}
              >
                50
              </Button>
              <Button
                variant={itemsPerPage === 100 ? "default" : "outline"}
                size="sm"
                onClick={() => setItemsPerPage(100)}
              >
                100
              </Button>
              <Button
                variant={itemsPerPage === 150 ? "default" : "outline"}
                size="sm"
                onClick={() => setItemsPerPage(150)}
              >
                150
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subcategory</TableHead>
                  <TableHead className="text-right">Income</TableHead>
                  <TableHead className="text-right">Expense</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No transactions found for this period
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>{transaction.subcategory || "-"}</TableCell>
                      <TableCell className="text-right text-primary font-medium">
                        {transaction.income > 0 ? `$${transaction.income.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right text-secondary font-medium">
                        {transaction.expense > 0 ? `$${transaction.expense.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {transaction.note || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(transaction)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(transaction.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {transactions.length > 0 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Showing {displayedTransactions.length} of {transactions.length} transactions
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingTransaction} onOpenChange={() => setEditingTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>Make changes to this transaction</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={formData.category || ""}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Input
                  value={formData.subcategory || ""}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Income</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.income || 0}
                  onChange={(e) =>
                    setFormData({ ...formData, income: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Expense</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.expense || 0}
                  onChange={(e) =>
                    setFormData({ ...formData, expense: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Input
                value={formData.note || ""}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
            <Button onClick={handleSave} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TransactionsTable;
