import { useState } from "react";
import { Book } from "@/pages/Dashboard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Plus, Trash2 } from "lucide-react";

interface BookSelectorProps {
  books: Book[];
  selectedBook: Book | null;
  onSelectBook: (book: Book) => void;
  onCreateBook: (name: string, currency: string) => void;
  onDeleteBook: (bookId: string) => void;
}

const BookSelector = ({
  books,
  selectedBook,
  onSelectBook,
  onCreateBook,
  onDeleteBook,
}: BookSelectorProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newBookName, setNewBookName] = useState("");
  const [newBookCurrency, setNewBookCurrency] = useState("USD");

  const handleCreate = () => {
    if (newBookName.trim()) {
      onCreateBook(newBookName, newBookCurrency);
      setNewBookName("");
      setNewBookCurrency("USD");
      setIsDialogOpen(false);
    }
  };

  const handleDelete = () => {
    if (selectedBook) {
      onDeleteBook(selectedBook.id);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="bg-card rounded-xl p-6 shadow-md border">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Your Books</h2>
            <p className="text-sm text-muted-foreground">
              Select or create a finance book
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {books.length > 0 && (
            <>
              <Select
                value={selectedBook?.id || ""}
                onValueChange={(value) => {
                  const book = books.find((b) => b.id === value);
                  if (book) onSelectBook(book);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select a book" />
                </SelectTrigger>
                <SelectContent>
                  {books.map((book) => (
                    <SelectItem key={book.id} value={book.id}>
                      {book.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedBook && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </>
          )}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Book
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Book</DialogTitle>
                <DialogDescription>
                  Create a new finance book to track a specific account or category
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="book-name">Book Name</Label>
                  <Input
                    id="book-name"
                    placeholder="e.g., Personal Expenses, Business Account"
                    value={newBookName}
                    onChange={(e) => setNewBookName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={newBookCurrency} onValueChange={setNewBookCurrency}>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CNY">CNY (¥)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} className="w-full">
                  Create Book
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Book?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedBook?.name}"? This will permanently delete all transactions in this book. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BookSelector;
