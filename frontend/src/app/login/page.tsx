"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login, saveToken } from "@/lib/auth";
import { getMe } from "@/lib/user";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token } = await login(email, password);
      saveToken(token);
      const user = await getMe();
      router.push(user.personality_type ? "/dashboard" : "/quiz");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "メールアドレスまたはパスワードが正しくありません";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-extrabold text-purple-700 tracking-tight">
            NudgeMe
          </Link>
          <p className="text-sm text-gray-500 mt-1">おかえりなさい</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-8">
          <h1 className="text-xl font-bold text-gray-800 mb-6">ログイン</h1>

          {justRegistered && (
            <div className="mb-5 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
              登録が完了しました。ログインしてください。
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                メールアドレス
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-gray-50 transition"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                パスワード
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-gray-50 transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold rounded-xl transition-colors mt-2"
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            アカウントをお持ちでない方は{" "}
            <Link href="/register" className="text-purple-600 hover:underline font-medium">
              新規登録
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
