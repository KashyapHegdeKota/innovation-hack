"use client";

import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, RefreshCcw, Plus } from "lucide-react";
import apiClient from "../../lib/api-client";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    setFetching(true);
    setError(null);
    try {
      const response = await apiClient.get("/api/data");
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch data");
    } finally {
      setFetching(false);
    }
  };

  const createData = async () => {
    try {
      await apiClient.post("/api/data", {
        title: `New Hackathon Project ${Date.now()}`,
        description: "Created from the dashboard"
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create data");
    }
  };

  if (loading) return <div className="p-24 text-center">Loading auth...</div>;
  if (!user) return null;

  return (
    <main className="flex min-h-screen flex-col items-center p-12">
      <div className="z-10 max-w-5xl w-full flex flex-col gap-8">
        <header className="flex justify-between items-center border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">Dashboard</h1>
            <p className="text-gray-500">Welcome, {user.displayName || user.email}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </header>

        <section className="grid gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Data (Protected API Call)</h2>
            <div className="flex gap-2">
              <button
                onClick={fetchData}
                disabled={fetching}
                className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <RefreshCcw size={18} className={fetching ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                onClick={createData}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus size={18} />
                Add Entry
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.length > 0 ? (
              data.map((item) => (
                <div key={item.id} className="border p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{item.description || "No description"}</p>
                  <div className="mt-4 text-[10px] text-gray-400 font-mono truncate">
                    Author UID: {item.author_id}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 border-2 border-dashed rounded-xl text-gray-400">
                No data found. Click "Refresh" to fetch or "Add Entry" to create.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
