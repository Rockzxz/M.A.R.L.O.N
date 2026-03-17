import { Book, Borrowing, HistoryItem } from "../types";


const API_BASE = "http://127.0.0.1:8000/api";


async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  let data: any = null;


  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  }


  if (!response.ok) {
    const message =
      data?.error ||
      data?.detail ||
      data?.book?.[0] ||
      data?.due_date?.[0] ||
      "Something went wrong.";
    throw new Error(message);
  }


  return data as T;
}


export const api = {
  getBooks: async (): Promise<Book[]> => {
    const res = await fetch(`${API_BASE}/books/`);
    return handleResponse<Book[]>(res);
  },


  createBook: async (payload: Partial<Book>): Promise<Book> => {
    const res = await fetch(`${API_BASE}/books/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<Book>(res);
  },


  updateBook: async (id: number, payload: Partial<Book>): Promise<Book> => {
    const res = await fetch(`${API_BASE}/books/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<Book>(res);
  },


  deleteBook: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/books/${id}/`, {
      method: "DELETE",
    });


    if (!res.ok) {
      throw new Error("Failed to delete book.");
    }
  },


  getBorrowings: async (): Promise<Borrowing[]> => {
    const res = await fetch(`${API_BASE}/borrowings/`);
    return handleResponse<Borrowing[]>(res);
  },


  createBorrowing: async (payload: Partial<Borrowing>): Promise<Borrowing> => {
    const res = await fetch(`${API_BASE}/borrowings/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<Borrowing>(res);
  },


  returnBook: async (id: number, return_date?: string): Promise<Borrowing> => {
    const res = await fetch(`${API_BASE}/borrowings/${id}/return_book/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(return_date ? { return_date } : {}),
    });
    return handleResponse<Borrowing>(res);
  },


  getHistory: async (): Promise<HistoryItem[]> => {
    const res = await fetch(`${API_BASE}/history/`);
    return handleResponse<HistoryItem[]>(res);
  },
};
