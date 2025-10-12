import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UploadSectionProps {
  bookId: string;
  userId: string;
  onUploadComplete: () => void;
}

const UploadSection = ({ bookId, userId, onUploadComplete }: UploadSectionProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    
    const transactions = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      if (values.length < 3) continue;

      const transaction: any = {};
      headers.forEach((header, index) => {
        const value = values[index]?.trim() || "";
        
        // Map common header variations
        if (header.includes("date")) transaction.date = value;
        else if (header.includes("category") && !header.includes("sub")) transaction.category = value;
        else if (header.includes("subcategory") || header.includes("sub")) transaction.subcategory = value;
        else if (header.includes("income")) transaction.income = parseFloat(value) || 0;
        else if (header.includes("expense")) transaction.expense = parseFloat(value) || 0;
        else if (header.includes("note") || header.includes("description")) transaction.note = value;
        else if (header.includes("paid")) transaction.paid_from = value;
      });

      if (transaction.date && transaction.category) {
        transactions.push(transaction);
      }
    }
    
    return transactions;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setIsUploading(true);

    try {
      const text = await file.text();
      const parsedTransactions = parseCSV(text);

      if (parsedTransactions.length === 0) {
        toast.error("No valid transactions found in CSV");
        return;
      }

      const transactionsToInsert = parsedTransactions.map((t) => ({
        book_id: bookId,
        user_id: userId,
        date: t.date,
        category: t.category || "Uncategorized",
        subcategory: t.subcategory || null,
        income: t.income || 0,
        expense: t.expense || 0,
        note: t.note || null,
        paid_from: t.paid_from || null,
        labels: null,
      }));

      const { error } = await supabase
        .from("transactions")
        .insert(transactionsToInsert);

      if (error) throw error;

      toast.success(`Successfully uploaded ${parsedTransactions.length} transactions`);
      onUploadComplete();
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload CSV");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="p-6 border-2 border-dashed border-border hover:border-primary/50 transition-colors">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <FileSpreadsheet className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-1">Upload CSV File</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Upload your spending data with columns: Date, Category, Subcategory, Income, Expense, Note, Paid from
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          size="lg"
          className="gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Choose CSV File
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default UploadSection;
