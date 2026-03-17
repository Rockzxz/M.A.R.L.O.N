type Props = {
  currentPage: string;
  setCurrentPage: (page: string) => void;
};


const navItems = [
  { key: "dashboard", label: "Dashboard" },
  { key: "books", label: "Books" },
  { key: "borrowings", label: "Borrowings" },
  { key: "history", label: "History" },
];


export default function Sidebar({ currentPage, setCurrentPage }: Props) {
  return (
    <aside className="w-72 bg-slate-900 text-white min-h-screen p-6 shadow-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-wide">M.A.R.L.O.N</h1>
        <p className="text-slate-300 text-sm mt-2">Library Management System</p>
      </div>


      <nav className="space-y-2">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setCurrentPage(item.key)}
            className={`w-full text-left px-4 py-3 rounded-xl transition font-medium ${
              currentPage === item.key
                ? "bg-blue-600 text-white"
                : "text-slate-200 hover:bg-slate-800"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
