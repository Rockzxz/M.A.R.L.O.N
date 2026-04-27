import { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import StatCard from "./components/StatCard";
import BookFormModal from "./components/BookFormModal";
import BorrowFormModal from "./components/BorrowFormModal";
import BorrowerBorrowModal from "./components/BorrowerBorrowModal";
import MyBorrowings from "./components/MyBorrowings";
import ConfirmModal from "./components/ConfirmModal";
import LoginPage from "./components/LoginPage";
import Register from "./components/Register";
import VerifyEmail from "./components/VerifyEmail";
import ProfilePage from "./components/Profilepage";
import { api, ProfileData } from "./services/api";
import { Book, Borrowing, HistoryItem } from "./types";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authView, setAuthView] = useState<"login" | "register" | "verify">(
    "login",
  );
  const [emailForVerification, setEmailForVerification] = useState("");

  const [currentPage, setCurrentPage] = useState("dashboard");
  const [userRole, setUserRole] = useState<"admin" | "borrower" | null>(null);
  const [userProfile, setUserProfile] = useState<ProfileData | null>(null);

  const [books, setBooks] = useState<Book[]>([]);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deleteBookId, setDeleteBookId] = useState<number | null>(null);

  const [bookSearch, setBookSearch] = useState("");
  const [borrowingSearch, setBorrowingSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");

  const fetchProfile = async () => {
    try {
      const profile = await api.getProfile();
      setUserProfile(profile);
      setUserRole(profile.role);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

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
      const message = err.message || "Failed to fetch data.";

      if (
        message
          .toLowerCase()
          .includes("authentication credentials were not provided") ||
        message.toLowerCase().includes("invalid token")
      ) {
        api.logout();
        setIsLoggedIn(false);
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchProfile();
      fetchAll();
    }
  }, [isLoggedIn]);

  const filteredBooks = useMemo(() => {
    return books.filter((book) =>
      [book.title, book.author, book.genre || "", book.isbn || ""]
        .join(" ")
        .toLowerCase()
        .includes(bookSearch.toLowerCase()),
    );
  }, [books, bookSearch]);

  const activeBorrowings = useMemo(
    () => borrowings.filter((item) => !item.return_date),
    [borrowings],
  );

  const filteredBorrowings = useMemo(() => {
    return activeBorrowings.filter((item) =>
      [
        item.borrower_name,
        item.borrower_contact_number,
        item.borrower_email_address,
        item.book_details?.title || "",
        item.borrow_date,
        item.due_date,
        item.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(borrowingSearch.toLowerCase()),
    );
  }, [activeBorrowings, borrowingSearch]);

  const historyRecords = useMemo(() => {
    return history.map((historyItem) => {
      const relatedBorrowing = borrowings.find(
        (b) => b.id === historyItem.transaction,
      );

      return {
        ...historyItem,
        borrower_name: relatedBorrowing?.borrower_name || "-",
        borrower_contact_number:
          relatedBorrowing?.borrower_contact_number || "-",
        borrower_email_address: relatedBorrowing?.borrower_email_address || "-",
        book_title:
          relatedBorrowing?.book_details?.title ||
          `Book ID: ${relatedBorrowing?.book || "-"}`,
        overdue_days: relatedBorrowing?.overdue_days ?? 0,
      };
    });
  }, [history, borrowings]);

  const filteredHistory = useMemo(() => {
    return historyRecords.filter((item) =>
      [
        item.id,
        item.transaction,
        item.borrower_name,
        item.borrower_contact_number,
        item.borrower_email_address,
        item.book_title,
        item.borrow_date,
        item.return_date || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(historySearch.toLowerCase()),
    );
  }, [historyRecords, historySearch]);

  const availableBooksCount = useMemo(
    () => books.filter((b) => b.copies_available > 0).length,
    [books],
  );

  const overdueCount = useMemo(
    () =>
      activeBorrowings.filter((item) => (item.overdue_days || 0) > 0).length,
    [activeBorrowings],
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

  const handleBorrowForMe = async (data: any) => {
    try {
      await api.borrowForMe(data);
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

  const handleApprove = async (id: number) => {
    try {
      await api.approveBorrowing(id);
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (id: number) => {
    if (!window.confirm("Are you sure you want to reject this request?"))
      return;
    try {
      await api.rejectBorrowing(id);
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    api.logout();
    setIsLoggedIn(false);
    setCurrentPage("dashboard");
    setUserRole(null);
    setUserProfile(null);
  };

  const pageTitleMap: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: "Dashboard",
      subtitle:
        userRole === "borrower"
          ? "Your library account overview."
          : "Overview of library books, transactions, and records.",
    },
    books: {
      title: userRole === "borrower" ? "Available Books" : "Books Management",
      subtitle:
        userRole === "borrower"
          ? "Browse and borrow available books from our library."
          : "Add, edit, search, and manage available books.",
    },
    borrowings: {
      title: "Borrowings",
      subtitle: "Track active borrowing records and return transactions.",
    },
    "my-borrowings": {
      title: "My Borrowings",
      subtitle: "View your active borrowings and deadlines.",
    },
    history: {
      title: "History",
      subtitle: "Review completed return records and borrowing history.",
    },
    profile: {
      title: "Profile",
      subtitle: "View personal account information.",
    },
  };

  if (!isLoggedIn) {
    if (authView === "login") {
      return (
        <LoginPage
          onLoginSuccess={() => {
            setIsLoggedIn(true);
            setCurrentPage("dashboard");
          }}
          // Assuming LoginPage has a way to switch to Register,
          // otherwise you can add a button below it.
        />
      );
    } else if (authView === "register") {
      return (
        <Register
          onSuccess={(email) => {
            setEmailForVerification(email);
            setAuthView("verify");
          }}
          onSwitchToLogin={() => setAuthView("login")}
        />
      );
    } else if (authView === "verify") {
      return (
        <VerifyEmail
          email={emailForVerification}
          onSuccess={() => {
            setAuthView("login");
          }}
        />
      );
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-50">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
        userRole={userRole || undefined}
      />

      <main className="flex-1 p-8">
        <Header
          title={pageTitleMap[currentPage]?.title || "Dashboard"}
          subtitle={pageTitleMap[currentPage]?.subtitle || ""}
        />

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 px-5 py-4 shadow-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/60 shadow-lg p-8 text-slate-600">
            Loading data...
          </div>
        ) : (
          <>
            {currentPage === "dashboard" && userRole === "admin" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                  <StatCard label="Total Books" value={books.length} />
                  <StatCard
                    label="Available Titles"
                    value={availableBooksCount}
                  />
                  <StatCard
                    label="Active Borrowings"
                    value={activeBorrowings.length}
                  />
                  <StatCard label="Overdue Records" value={overdueCount} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                  <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-white/60 p-6 h-fit">
                    <h3 className="text-2xl font-bold text-slate-800 mb-5">
                      Recent Borrowings
                    </h3>
                    <div className="space-y-3">
                      {borrowings.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4 flex justify-between items-center shadow-sm"
                        >
                          <div>
                            <p className="font-semibold text-slate-800">
                              {item.borrower_name}
                            </p>
                            <p className="text-sm text-slate-500">
                              {item.book_details?.title ||
                                `Book ID: ${item.book}`}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-semibold ${
                              item.return_date
                                ? "bg-slate-200 text-slate-700"
                                : item.status === "Pending"
                                  ? "bg-slate-100 text-slate-600"
                                  : (item.overdue_days || 0) > 0
                                    ? "bg-red-100 text-red-700"
                                    : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {item.return_date
                              ? "Returned"
                              : item.status === "Pending"
                                ? "Pending"
                                : (item.overdue_days || 0) > 0
                                  ? `Overdue: ${item.overdue_days || 0} day(s)`
                                  : "Active"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-white/60 p-6">
                    <h3 className="text-2xl font-bold text-slate-800 mb-5">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => {
                          setEditingBook(null);
                          setBookModalOpen(true);
                        }}
                        className="rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-5 text-left shadow-lg hover:scale-[1.02] transition"
                      >
                        <p className="font-bold text-lg">Add Book</p>
                        <p className="text-sm text-blue-100 mt-1">
                          Register a new book in the system.
                        </p>
                      </button>

                      <button
                        onClick={() => setCurrentPage("books")}
                        className="rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 text-white p-5 text-left shadow-lg hover:scale-[1.02] transition"
                      >
                        <p className="font-bold text-lg">Manage Books</p>
                        <p className="text-sm text-amber-100 mt-1">
                          Edit or remove book records.
                        </p>
                      </button>

                      <button
                        onClick={() => setCurrentPage("history")}
                        className="rounded-3xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white p-5 text-left shadow-lg hover:scale-[1.02] transition"
                      >
                        <p className="font-bold text-lg">View History</p>
                        <p className="text-sm text-violet-100 mt-1">
                          Check completed borrowing records.
                        </p>
                      </button>

                      <button
                        onClick={() => setCurrentPage("borrowings")}
                        className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-5 text-left shadow-lg hover:scale-[1.02] transition"
                      >
                        <p className="font-bold text-lg">Borrowings</p>
                        <p className="text-sm text-emerald-100 mt-1">
                          Manage borrowing transactions.
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentPage === "dashboard" && userRole === "borrower" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <StatCard
                    label="Available Books"
                    value={availableBooksCount}
                  />
                  <StatCard
                    label="My Active Borrowings"
                    value={activeBorrowings.length}
                  />
                  <StatCard label="Overdue Items" value={overdueCount} />
                </div>

                <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-white/60 p-6">
                  <h3 className="text-2xl font-bold text-slate-800 mb-5">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setBorrowModalOpen(true)}
                      className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-5 text-left shadow-lg hover:scale-[1.02] transition"
                    >
                      <p className="font-bold text-lg">Borrow a Book</p>
                      <p className="text-sm text-emerald-100 mt-1">
                        Browse and borrow from available books.
                      </p>
                    </button>

                    <button
                      onClick={() => setCurrentPage("my-borrowings")}
                      className="rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-5 text-left shadow-lg hover:scale-[1.02] transition"
                    >
                      <p className="font-bold text-lg">My Borrowings</p>
                      <p className="text-sm text-blue-100 mt-1">
                        View your borrowings and deadlines.
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentPage === "books" && userRole === "admin" && (
              <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 p-7">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <input
                    type="text"
                    placeholder="Search by title, author, genre, or ISBN"
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    className="w-full md:max-w-xl rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />

                  <button
                    onClick={() => {
                      setEditingBook(null);
                      setBookModalOpen(true);
                    }}
                    className="px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-lg hover:scale-[1.02] transition"
                  >
                    Add Book
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl">
                  <table className="w-full text-left min-w-[1000px]">
                    <thead>
                      <tr className="text-slate-600 border-b border-slate-200">
                        <th className="py-4 pr-4 font-bold">Title</th>
                        <th className="py-4 pr-4 font-bold">Author</th>
                        <th className="py-4 pr-4 font-bold">ISBN</th>
                        <th className="py-4 pr-4 font-bold">Genre</th>
                        <th className="py-4 pr-4 font-bold">Year</th>
                        <th className="py-4 pr-4 font-bold">Available</th>
                        <th className="py-4 pr-4 font-bold">Borrowed</th>
                        <th className="py-4 pr-4 font-bold">Status</th>
                        <th className="py-4 pr-4 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBooks.map((book) => (
                        <tr
                          key={book.id}
                          className="border-b border-slate-100 hover:bg-blue-50/60 transition"
                        >
                          <td className="py-5 pr-4 font-semibold text-slate-800">
                            {book.title}
                          </td>
                          <td className="py-5 pr-4 text-slate-700">
                            {book.author}
                          </td>
                          <td className="py-5 pr-4 text-slate-700">
                            {book.isbn || "-"}
                          </td>
                          <td className="py-5 pr-4 text-slate-700">
                            {book.genre || "-"}
                          </td>
                          <td className="py-5 pr-4 text-slate-700">
                            {book.year_published || "-"}
                          </td>
                          <td className="py-5 pr-4 font-semibold text-slate-800">
                            {book.copies_available}
                          </td>
                          <td className="py-5 pr-4 font-semibold text-slate-800">
                            {book.copies_borrowed}
                          </td>
                          <td className="py-5 pr-4">
                            <span
                              className={`text-xs px-4 py-2 rounded-full font-bold ${
                                book.copies_available > 0
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {book.copies_available > 0
                                ? "Available"
                                : "Borrowed"}
                            </span>
                          </td>
                          <td className="py-5 pr-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingBook(book);
                                  setBookModalOpen(true);
                                }}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow hover:opacity-95"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleteBookId(book.id)}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 text-white font-medium shadow hover:opacity-95"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {filteredBooks.length === 0 && (
                        <tr>
                          <td
                            colSpan={9}
                            className="py-10 text-center text-slate-500"
                          >
                            No books found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {currentPage === "books" && userRole === "borrower" && (
              <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 p-7">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <input
                    type="text"
                    placeholder="Search by title, author, genre, or ISBN"
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    className="w-full md:max-w-xl rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />

                  <button
                    onClick={() => setBorrowModalOpen(true)}
                    className="px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold shadow-lg hover:scale-[1.02] transition"
                  >
                    Borrow a Book
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl">
                  <table className="w-full text-left min-w-[900px]">
                    <thead>
                      <tr className="text-slate-600 border-b border-slate-200">
                        <th className="py-4 pr-4 font-bold">Title</th>
                        <th className="py-4 pr-4 font-bold">Author</th>
                        <th className="py-4 pr-4 font-bold">Genre</th>
                        <th className="py-4 pr-4 font-bold">Year</th>
                        <th className="py-4 pr-4 font-bold">
                          Copies Available
                        </th>
                        <th className="py-4 pr-4 font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBooks
                        .filter((b) => b.copies_available > 0)
                        .map((book) => (
                          <tr
                            key={book.id}
                            className="border-b border-slate-100 hover:bg-blue-50/60 transition"
                          >
                            <td className="py-5 pr-4 font-semibold text-slate-800">
                              {book.title}
                            </td>
                            <td className="py-5 pr-4 text-slate-700">
                              {book.author}
                            </td>
                            <td className="py-5 pr-4 text-slate-700">
                              {book.genre || "-"}
                            </td>
                            <td className="py-5 pr-4 text-slate-700">
                              {book.year_published || "-"}
                            </td>
                            <td className="py-5 pr-4 font-semibold text-emerald-600">
                              {book.copies_available} available
                            </td>
                            <td className="py-5 pr-4">
                              <button
                                onClick={() => {
                                  setEditingBook(book);
                                  setBorrowModalOpen(true);
                                }}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-medium shadow hover:opacity-95"
                              >
                                Borrow
                              </button>
                            </td>
                          </tr>
                        ))}

                      {filteredBooks.filter((b) => b.copies_available > 0)
                        .length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-10 text-center text-slate-500"
                          >
                            No available books found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {currentPage === "borrowings" && userRole === "admin" && (
              <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 p-7">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <input
                    type="text"
                    placeholder="Search borrower, contact, email, book, or date"
                    value={borrowingSearch}
                    onChange={(e) => setBorrowingSearch(e.target.value)}
                    className="w-full md:max-w-xl rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />

                  <button
                    onClick={() => setBorrowModalOpen(true)}
                    className="px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold shadow-lg hover:scale-[1.02] transition"
                  >
                    New Borrowing
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl">
                  <table className="w-full text-left min-w-[1100px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600">
                        <th className="py-4 pr-4 font-bold">Borrower</th>
                        <th className="py-4 pr-4 font-bold">Contact</th>
                        <th className="py-4 pr-4 font-bold">Email</th>
                        <th className="py-4 pr-4 font-bold">Book</th>
                        <th className="py-4 pr-4 font-bold">Borrow Date</th>
                        <th className="py-4 pr-4 font-bold">Due Date</th>
                        <th className="py-4 pr-4 font-bold">Status</th>
                        <th className="py-4 pr-4 font-bold">Overdue</th>
                        <th className="py-4 pr-4 font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBorrowings.map((item) => {
                        const isPending = item.status === "Pending";
                        return (
                          <tr
                            key={item.id}
                            className="border-b border-slate-100 hover:bg-blue-50/60 transition"
                          >
                            <td className="py-5 pr-4 font-semibold text-slate-800">
                              {item.borrower_name}
                            </td>
                            <td className="py-5 pr-4">
                              {item.borrower_contact_number}
                            </td>
                            <td className="py-5 pr-4">
                              {item.borrower_email_address}
                            </td>
                            <td className="py-5 pr-4">
                              {item.book_details?.title ||
                                `Book ID: ${item.book}`}
                            </td>
                            <td className="py-5 pr-4">{item.borrow_date}</td>
                            <td className="py-5 pr-4">
                              {isPending ? (
                                <span className="text-slate-400">TBD</span>
                              ) : (
                                item.due_date
                              )}
                            </td>
                            <td className="py-5 pr-4">
                              <span
                                className={`text-xs px-4 py-2 rounded-full font-bold ${
                                  isPending
                                    ? "bg-slate-100 text-slate-600"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {isPending ? "Pending" : "Active"}
                              </span>
                            </td>
                            <td className="py-5 pr-4">
                              <span
                                className={`text-xs px-4 py-2 rounded-full font-bold ${
                                  isPending
                                    ? "text-slate-400 bg-transparent px-0"
                                    : (item.overdue_days || 0) > 0
                                      ? "bg-red-100 text-red-700"
                                      : "text-slate-600 bg-transparent px-0"
                                }`}
                              >
                                {isPending
                                  ? "-"
                                  : `${item.overdue_days || 0} day(s)`}
                              </span>
                            </td>
                            <td className="py-5 pr-4">
                              {isPending ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleApprove(item.id)}
                                    className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-medium shadow hover:bg-emerald-700 text-sm transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReject(item.id)}
                                    className="px-3 py-2 rounded-xl border border-red-200 text-red-600 font-medium shadow-sm hover:bg-red-50 text-sm transition-colors"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleReturnBook(item.id)}
                                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium shadow hover:opacity-95"
                                >
                                  Return
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {filteredBorrowings.length === 0 && (
                        <tr>
                          <td
                            colSpan={8}
                            className="py-10 text-center text-slate-500"
                          >
                            No active borrowing records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {currentPage === "my-borrowings" && userRole === "borrower" && (
              <MyBorrowings
                borrowings={activeBorrowings}
                onReturnBook={handleReturnBook}
              />
            )}

            {currentPage === "history" && userRole === "admin" && (
              <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 p-7">
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search history ID, borrower, email, book, or date"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full md:max-w-xl rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>

                <div className="overflow-x-auto rounded-2xl">
                  <table className="w-full text-left min-w-[1100px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600">
                        <th className="py-4 pr-4 font-bold">ID</th>
                        <th className="py-4 pr-4 font-bold">Borrower</th>
                        <th className="py-4 pr-4 font-bold">Contact</th>
                        <th className="py-4 pr-4 font-bold">Email</th>
                        <th className="py-4 pr-4 font-bold">Book</th>
                        <th className="py-4 pr-4 font-bold">Borrow Date</th>
                        <th className="py-4 pr-4 font-bold">Return Date</th>
                        <th className="py-4 pr-4 font-bold">Overdue</th>
                        <th className="py-4 pr-4 font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100 hover:bg-blue-50/60 transition"
                        >
                          <td className="py-5 pr-4 font-semibold text-slate-800">
                            {item.id}
                          </td>
                          <td className="py-5 pr-4 font-semibold text-slate-800">
                            {item.borrower_name}
                          </td>
                          <td className="py-5 pr-4">
                            {item.borrower_contact_number}
                          </td>
                          <td className="py-5 pr-4">
                            {item.borrower_email_address}
                          </td>
                          <td className="py-5 pr-4">{item.book_title}</td>
                          <td className="py-5 pr-4">{item.borrow_date}</td>
                          <td className="py-5 pr-4">
                            {item.return_date || "-"}
                          </td>
                          <td className="py-5 pr-4">
                            <span
                              className={`text-xs px-4 py-2 rounded-full font-bold ${
                                (item.overdue_days || 0) > 0
                                  ? "bg-red-100 text-red-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {item.overdue_days || 0} day(s)
                            </span>
                          </td>
                          <td className="py-5 pr-4">
                            <span className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-semibold text-sm">
                              Completed
                            </span>
                          </td>
                        </tr>
                      ))}

                      {filteredHistory.length === 0 && (
                        <tr>
                          <td
                            colSpan={9}
                            className="py-10 text-center text-slate-500"
                          >
                            No history records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {currentPage === "profile" && (
              <ProfilePage borrowings={borrowings} history={history} />
            )}
          </>
        )}

        {userRole === "admin" && (
          <>
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
          </>
        )}

        {userRole === "borrower" && (
          <>
            <BorrowerBorrowModal
              open={borrowModalOpen}
              books={books}
              onClose={() => {
                setBorrowModalOpen(false);
                setEditingBook(null);
              }}
              onSubmit={handleBorrowForMe}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
