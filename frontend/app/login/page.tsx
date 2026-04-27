"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, saveToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Заповніть всі поля"); return; }

    setLoading(true);
    setError("");
    try {
      const res = await login(email, password);
      saveToken(res.token);
      router.push("/dashboard");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Помилка входу. Перевір email і пароль.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Over The Top</h1>
          <p className="text-gray-400 mt-1">Вхід до акаунту</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="text-gray-400 text-sm block mb-1">Email</label>
            <input
              type="email" value={email} autoComplete="email"
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm
                placeholder:text-gray-600 focus:outline-none focus:border-gray-500 transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-gray-400 text-sm">Пароль</label>
            </div>
            <input
              type="password" value={password} autoComplete="current-password"
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm
                placeholder:text-gray-600 focus:outline-none focus:border-gray-500 transition"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 bg-white text-gray-950 rounded-lg font-semibold text-sm
              hover:bg-gray-200 transition disabled:opacity-50 mt-2"
          >
            {loading ? "Входимо..." : "Увійти"}
          </button>

          <p className="text-center text-gray-500 text-sm pt-1">
            Немає акаунту?{" "}
            <a href="/register" className="text-white hover:underline">Зареєструватись</a>
          </p>
        </form>
      </div>
    </div>
  );
}
