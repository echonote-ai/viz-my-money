import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import BookSelector from "@/components/dashboard/BookSelector";
import UploadSection from "@/components/dashboard/UploadSection";
import ChartSection from "@/components/dashboard/ChartSection";
import TransactionsTable from "@/components/dashboard/TransactionsTable";

export interface Book {
  id: string;
  name: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  book_id: string;
  paid_from: string | null;
  date: string;
  category: string;
  subcategory: string | null;
  income: number;
  expense: number;
  note: string | null;
  labels: string[] | null;
  created_at: string;
  updated_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadBooks();
    }
  }, [user]);

  useEffect(() => {
    if (selectedBook) {
      loadTransactions(selectedBook.id);
    } else {
      setTransactions([]);
    }
  }, [selectedBook]);

  const loadBooks = async () => {
    try {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setBooks(data || []);
      if (data && data.length > 0) {
        setSelectedBook(data[0]);
      }
    } catch (error: any) {
      toast.error("Failed to load books");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactions = async (bookId: string) => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("book_id", bookId)
        .order("date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      toast.error("Failed to load transactions");
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error: any) {
      toast.error("Failed to sign out");
    }
  };

  const handleCreateBook = async (name: string, currency: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("books")
        .insert({
          user_id: user.id,
          name,
          currency,
        })
        .select()
        .single();

      if (error) throw error;

      setBooks([data, ...books]);
      setSelectedBook(data);
      toast.success("Book created successfully!");
    } catch (error: any) {
      toast.error("Failed to create book");
    }
  };

  const handleUploadComplete = () => {
    if (selectedBook) {
      loadTransactions(selectedBook.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} onSignOut={handleSignOut} />
      
      <div className="container mx-auto px-4 py-8 space-y-6">
        <BookSelector
          books={books}
          selectedBook={selectedBook}
          onSelectBook={setSelectedBook}
          onCreateBook={handleCreateBook}
        />

        {selectedBook && (
          <>
            <UploadSection
              bookId={selectedBook.id}
              userId={user?.id || ""}
              onUploadComplete={handleUploadComplete}
            />

            {transactions.length > 0 && (
              <>
                <ChartSection transactions={transactions} />
                <TransactionsTable
                  transactions={transactions}
                  onUpdate={handleUploadComplete}
                />
              </>
            )}

            {transactions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No transactions yet. Upload a CSV to get started!
                </p>
              </div>
            )}
          </>
        )}

        {books.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground mb-4">
              Welcome! Create your first book to start tracking your finances.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
