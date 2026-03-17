import { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import StatCard from "./components/StatCard";
import BookFormModal from "./components/BookFormModal";
import BorrowFormModal from "./components/BorrowFormModal";
import ConfirmModal from "./components/ConfirmModal";
import { api } from "./services/api";
import { Book, Borrowing, HistoryItem } from "./types";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const [books, setBooks] = useState<Book[]>([]);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deleteBookId, setDeleteBookId] = useState<number | null>(null);

  const [search, setSearch] = useState("");

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError("");

      const [booksData, borrowingsData, historyData] = await Promise.all([
        api.getBooks(),
        api.getBorrowings(),
        api.getHistory(),
      ]);

      setBooks(booksData);
      setBorrowings(borrowingsData);
      setHistory(historyData);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filteredBooks = useMemo(() => {
    return books.filter((book) =>
      [book.title, book.author, book.genre || "", book.isbn || ""]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [books, search]);

  const activeBorrowings = useMemo(
    () => borrowings.filter((item) => !item.return_date),
    [borrowings]
  );

  const availableBooksCount = useMemo(
    () => books.filter((b) => b.status === "Available").length,
    [books]
  );

  const overdueCount = useMemo(
    () => activeBorrowings.filter((item) => item.overdue_days > 0).length,
    [activeBorrowings]
  );

  const handleCreateBook = async (data: Partial<Book>) => {
    try {
      await api.createBook(data);
      setBookModalOpen(false);
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEditBook = async (data: Partial<Book>) => {
    if (!editingBook) return;

    try {
      await api.updateBook(editingBook.id, data);
      setEditingBook(null);
      setBookModalOpen(false);
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteBook = async () => {
    if (!deleteBookId) return;

    try {
      await api.deleteBook(deleteBookId);
      setDeleteBookId(null);
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleBorrowBook = async (data: any) => {
    try {
      await api.createBorrowing(data);
      setBorrowModalOpen(false);
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReturnBook = async (id: number) => {
    try {
      await api.returnBook(id);
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const pageTitleMap: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: "Dashboard",
      subtitle: "Overview of library books, transactions, and records.",
    },
    books: {
      title: "Books Management",
      subtitle: "Add, edit, search, and manage available books.",
    },
    borrowings: {
      title: "Borrowings",
      subtitle: "Track active borrowing records and return transactions.",
    },
    history: {
      title: "History",
      subtitle: "Review completed return records and borrowing history.",
    },
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <main className="flex-1 p-8">
        <Header
          title={pageTitleMap[currentPage].title}
          subtitle={pageTitleMap[currentPage].subtitle}
        />

        {error && (
          <div className="mb-4 rounded-xl bg-red-100 border border-red-300 text-red-700 px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl shadow-md p-8 text-slate-600">
            Loading data...
          </div>
        ) : (
          <>
            {currentPage === "dashboard" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                  <StatCard label="Total Books" value={books.length} />
                  <StatCard label="Available Titles" value={availableBooksCount} />
                  <StatCard label="Active Borrowings" value={activeBorrowings.length} />
                  <StatCard label="Overdue Records" value={overdueCount} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Recent Borrowings</h3>
                    <div className="space-y-3">
                      {borrowings.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="border border-slate-200 rounded-xl p-4 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-semibold text-slate-800">{item.borrower_name}</p>
                            <p className="text-sm text-slate-500">
                              {item.book_details?.title || `Book ID: ${item.book}`}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-medium ${
                              item.return_date
                                ? "bg-slate-200 text-slate-700"
                                : item.overdue_days > 0
                                ? "bg-red-100 text-red-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {item.return_date
                              ? "Returned"
                              : item.overdue_days > 0
                              ? `Overdue: ${item.overdue_days} day(s)`
                              : "Active"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => {
                          setEditingBook(null);
                          setBookModalOpen(true);
                        }}
                        className="rounded-2xl bg-blue-600 text-white p-5 text-left hover:bg-blue-700"
                      >
                        <p className="font-bold">Add Book</p>
                        <p className="text-sm text-blue-100 mt-1">
                          Register a new book in the system.
                        </p>
                      </button>

                      <button
                        onClick={() => setBorrowModalOpen(true)}
                        className="rounded-2xl bg-emerald-600 text-white p-5 text-left hover:bg-emerald-700"
                      >
                        <p className="font-bold">Borrow Book</p>
                        <p className="text-sm text-emerald-100 mt-1">
                          Create a new borrowing transaction.
                        </p>
                      </button>

                      <button
                        onClick={() => setCurrentPage("books")}
                        className="rounded-2xl bg-amber-500 text-white p-5 text-left hover:bg-amber-600"
                      >
                        <p className="font-bold">Manage Books</p>
                        <p className="text-sm text-amber-100 mt-1">
                          Edit or remove book records.
                        </p>
                      </button>

                      <button
                        onClick={() => setCurrentPage("history")}
                        className="rounded-2xl bg-violet-600 text-white p-5 text-left hover:bg-violet-700"
                      >
                        <p className="font-bold">View History</p>
                        <p className="text-sm text-violet-100 mt-1">
                          Check completed borrowing records.
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentPage === "books" && (
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                  <input
                    type="text"
                    placeholder="Search by title, author, genre, or ISBN"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border border-slate-300 rounded-xl px-4 py-3 w-full md:max-w-md"
                  />

                  <button
                    onClick={() => {
                      setEditingBook(null);
                      setBookModalOpen(true);
                    }}
                    className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700"
                  >
                    Add Book
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[1000px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600">
                        <th className="py-3 pr-4">Title</th>
                        <th className="py-3 pr-4">Author</th>
                        <th className="py-3 pr-4">ISBN</th>
                        <th className="py-3 pr-4">Genre</th>
                        <th className="py-3 pr-4">Year</th>
                        <th className="py-3 pr-4">Available</th>
                        <th className="py-3 pr-4">Borrowed</th>
                        <th className="py-3 pr-4">Status</th>
                        <th className="py-3 pr-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBooks.map((book) => (
                        <tr key={book.id} className="border-b border-slate-100">
                          <td className="py-4 pr-4 font-semibold text-slate-800">{book.title}</td>
                          <td className="py-4 pr-4">{book.author}</td>
                          <td className="py-4 pr-4">{book.isbn || "-"}</td>
                          <td className="py-4 pr-4">{book.genre || "-"}</td>
                          <td className="py-4 pr-4">{book.year_published || "-"}</td>
                          <td className="py-4 pr-4">{book.copies_available}</td>
                          <td className="py-4 pr-4">{book.copies_borrowed}</td>
                          <td className="py-4 pr-4">
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-medium ${
                                book.status === "Available"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : book.status === "Borrowed"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {book.status}
                            </span>
                          </td>
                          <td className="py-4 pr-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingBook(book);
                                  setBookModalOpen(true);
                                }}
                                className="px-3 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleteBookId(book.id)}
                                className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {filteredBooks.length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-500">
                            No books found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {currentPage === "borrowings" && (
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
                <div className="flex justify-end mb-5">
                  <button
                    onClick={() => setBorrowModalOpen(true)}
                    className="bg-emerald-600 text-white px-5 py-3 rounded-xl hover:bg-emerald-700"
                  >
                    New Borrowing
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[1100px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600">
                        <th className="py-3 pr-4">Borrower</th>
                        <th className="py-3 pr-4">Contact</th>
                        <th className="py-3 pr-4">Email</th>
                        <th className="py-3 pr-4">Book</th>
                        <th className="py-3 pr-4">Borrow Date</th>
                        <th className="py-3 pr-4">Due Date</th>
                        <th className="py-3 pr-4">Return Date</th>
                        <th className="py-3 pr-4">Overdue</th>
                        <th className="py-3 pr-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {borrowings.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100">
                          <td className="py-4 pr-4 font-semibold text-slate-800">
                            {item.borrower_name}
                          </td>
                          <td className="py-4 pr-4">{item.borrower_contact_number}</td>
                          <td className="py-4 pr-4">{item.borrower_email_address}</td>
                          <td className="py-4 pr-4">
                            {item.book_details?.title || `Book ID: ${item.book}`}
                          </td>
                          <td className="py-4 pr-4">{item.borrow_date}</td>
                          <td className="py-4 pr-4">{item.due_date}</td>
                          <td className="py-4 pr-4">{item.return_date || "-"}</td>
                          <td className="py-4 pr-4">
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-medium ${
                                item.overdue_days > 0
                                  ? "bg-red-100 text-red-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {item.overdue_days} day(s)
                            </span>
                          </td>
                          <td className="py-4 pr-4">
                            {!item.return_date ? (
                              <button
                                onClick={() => handleReturnBook(item.id)}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                              >
                                Return
                              </button>
                            ) : (
                              <span className="text-slate-400">Completed</span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {borrowings.length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-500">
                            No borrowing records yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {currentPage === "history" && (
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600">
                        <th className="py-3 pr-4">History ID</th>
                        <th className="py-3 pr-4">Transaction ID</th>
                        <th className="py-3 pr-4">Borrow Date</th>
                        <th className="py-3 pr-4">Return Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100">
                          <td className="py-4 pr-4 font-semibold text-slate-800">{item.id}</td>
                          <td className="py-4 pr-4">{item.transaction}</td>
                          <td className="py-4 pr-4">{item.borrow_date}</td>
                          <td className="py-4 pr-4">{item.return_date || "-"}</td>
                        </tr>
                      ))}

                      {history.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500">
                            No history records yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        <BookFormModal
          open={bookModalOpen}
          onClose={() => {
            setBookModalOpen(false);
            setEditingBook(null);
          }}
          onSubmit={editingBook ? handleEditBook : handleCreateBook}
          editingBook={editingBook}
        />

        <BorrowFormModal
          open={borrowModalOpen}
          books={books}
          onClose={() => setBorrowModalOpen(false)}
          onSubmit={handleBorrowBook}
        />

        <ConfirmModal
          open={deleteBookId !== null}
          title="Delete Book"
          message="Are you sure you want to delete this book record?"
          onCancel={() => setDeleteBookId(null)}
          onConfirm={handleDeleteBook}
        />
      </main>
    </div>
  );
}

export default App;