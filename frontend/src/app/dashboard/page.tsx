"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearToken } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
    }
  }, [router]);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">NudgeMe</h1>
        <p className="text-gray-600 mb-8">ログインに成功しました</p>
        <button
          onClick={handleLogout}
          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
        >
          ログアウト
        </button>
      </div>
    </main>
  );
}
