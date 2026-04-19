import React, { useEffect, useMemo, useState } from "react";
import { Borrowing, HistoryItem } from "../types";
import { api, ProfileData } from "../services/api";

type ProfilePageProps = {
  borrowings: Borrowing[];
  history: HistoryItem[];
};

type EditableProfile = {
  name: string;
  email: string;
  address: string;
  age: number;
  birthday: string;
  role: string;
  bio: string;
};

const ProfilePage: React.FC<ProfilePageProps> = ({ borrowings, history }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [userData, setUserData] = useState<EditableProfile>({
    name: "User",
    email: "",
    address: "",
    age: 0,
    birthday: "",
    role: "Library User",
    bio: "No biography available.",
  });

  const [formData, setFormData] = useState<EditableProfile>(userData);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile: ProfileData = await api.getProfile();

        const fullName =
          `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
          profile.username ||
          profile.email ||
          "User";

        const nextData: EditableProfile = {
          name: fullName,
          email: profile.email || "",
          address: profile.address || "No address provided",
          age: profile.age || 0,
          birthday: profile.birthday || "No birthday provided",
          role: "System Administrator",
          bio: "Profile data loaded from the backend.",
        };

        setUserData(nextData);
        setFormData(nextData);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  const initials = useMemo(() => {
    return userData.name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 3);
  }, [userData.name]);

  const recentActivities = useMemo(() => {
    const borrowActivities = borrowings.map((item) => ({
      action: item.return_date ? "Returned" : "Borrowed",
      book: item.book_details?.title || `Book ID: ${item.book}`,
      date: item.return_date || item.borrow_date || "Recent",
    }));

    const historyActivities = history.map((item) => ({
      action: "Completed",
      book:
        (item as any).book_details?.title ||
        (item as any).book_title ||
        `Transaction #${item.transaction}`,
      date: item.return_date || item.borrow_date || "Recent",
    }));

    const profileActivity = {
      action: "Updated",
      book: "Profile Information",
      date: "Recently",
    };

    return [...borrowActivities, ...historyActivities, profileActivity].slice(0, 5);
  }, [borrowings, history]);

  const handleEditToggle = () => {
    setFormData(userData);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(userData);
    setIsEditing(false);
  };

  const handleSave = () => {
    setUserData({
      ...formData,
      age: Number(formData.age) || 0,
    });
    setIsEditing(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "age" ? Number(value) : value,
    }));
  };

  if (loadingProfile) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 p-8 text-slate-600">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 p-8 text-center">
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white text-4xl font-bold shadow-inner">
                {initials}
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 border-4 border-white rounded-full"></div>
            </div>

            {isEditing ? (
              <>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full text-center text-2xl font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full mt-3 text-center text-blue-600 font-semibold bg-white border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400"
                />
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-slate-800">{userData.name}</h2>
                <p className="text-blue-600 font-semibold">{userData.role}</p>
              </>
            )}

            <div className="mt-6 pt-6 border-t border-slate-100 flex justify-around">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">{borrowings.length}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Books</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">
                  {borrowings.filter((b) => !b.return_date).length}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Active</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">
                  {borrowings.filter((b) => b.overdue_days > 0 && !b.return_date).length}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Overdue</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 p-8 h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-slate-800">Personal Information</h3>

              {isEditing ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                  >
                    Save Profile
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleEditToggle}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                  Email Address
                </p>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full text-lg font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
                  />
                ) : (
                  <p className="text-lg font-semibold text-slate-800">{userData.email}</p>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                  Birthday
                </p>
                {isEditing ? (
                  <input
                    type="text"
                    name="birthday"
                    value={formData.birthday}
                    onChange={handleChange}
                    className="w-full text-lg font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
                  />
                ) : (
                  <p className="text-lg font-semibold text-slate-800">{userData.birthday}</p>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                  Age
                </p>
                {isEditing ? (
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full text-lg font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
                  />
                ) : (
                  <p className="text-lg font-semibold text-slate-800">
                    {userData.age} Years Old
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                  Address
                </p>
                {isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full text-lg font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
                  />
                ) : (
                  <p className="text-lg font-semibold text-slate-800">{userData.address}</p>
                )}
              </div>
            </div>

            <div className="mt-10">
              <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
                Biography
              </h4>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="w-full text-slate-600 leading-relaxed bg-white p-5 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-400"
                />
              ) : (
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100 italic">
                  "{userData.bio}"
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 p-8">
        <h3 className="text-2xl font-bold text-slate-800 mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {recentActivities.length === 0 ? (
            <p className="text-slate-500">No recent activity found.</p>
          ) : (
            recentActivities.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-blue-200 transition"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.action === "Borrowed"
                        ? "bg-emerald-100 text-emerald-600"
                        : item.action === "Returned" || item.action === "Completed"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <span className="text-xs font-bold">{item.action[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {item.action}{" "}
                      <span className="text-slate-500 font-normal">"{item.book}"</span>
                    </p>
                    <p className="text-xs text-slate-400 font-medium">{item.date}</p>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
