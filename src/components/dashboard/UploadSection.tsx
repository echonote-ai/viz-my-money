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

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseNumber = (value: string): number => {
    if (!value) return 0;
    // Remove commas and parse
    const cleaned = value.replace(/,/g, '');
    return parseFloat(cleaned) || 0;
  };

  const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return '';
    
    // Try to parse different date formats
    const cleaned = dateStr.trim();
    
    // Format: YYYY/MM/DD or YYYY-MM-DD
    if (/^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/.test(cleaned)) {
      const parts = cleaned.split(/[/-]/);
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // Format: MM/DD/YYYY or MM-DD-YYYY
    if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(cleaned)) {
      const parts = cleaned.split(/[/-]/);
      const year = parts[2];
      const month = parts[0].padStart(2, '0');
      const day = parts[1].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return cleaned;
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split("\n");
    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
    
    const transactions = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < 3) continue;

      const transaction: any = {};
      headers.forEach((header, index) => {
        const value = values[index] || "";
        
        // Map headers (English and Chinese)
        if (header.includes("date") || header === "date") {
          transaction.date = normalizeDate(value);
        }
        else if (header.includes("category") && !header.includes("sub")) {
          transaction.category = value;
        }
        else if (header.includes("subcategory") || header.includes("sub")) {
          transaction.subcategory = value;
        }
        else if (header.includes("income")) {
          transaction.income = parseNumber(value);
        }
        else if (header.includes("expense")) {
          transaction.expense = parseNumber(value);
        }
        else if (header.includes("note") || header.includes("description")) {
          transaction.note = value;
        }
        else if (header.includes("paid")) {
          transaction.paid_from = value;
        }
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
