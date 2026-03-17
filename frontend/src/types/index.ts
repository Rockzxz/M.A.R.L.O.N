export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string | null;
  genre: string | null;
  year_published: number | null;
  copies_available: number;
  copies_borrowed: number;
  status: "Available" | "Borrowed" | "Reserved";
}

export interface Borrowing {
  id: number;
  borrower_name: string;
  borrower_contact_number: string;
  borrower_email_address: string;
  book: number;
  book_details?: Book;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  overdue_days: number;
}

export interface HistoryItem {
  id: number;
  transaction: number;
  borrow_date: string;
  return_date: string | null;
}