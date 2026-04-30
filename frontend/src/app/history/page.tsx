"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearToken } from "@/lib/auth";
import { getDecisions, updateRegret } from "@/lib/decision";
import type { Decision } from "@/types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });
}

function HistoryCard({
  decision,
  onRegretUpdate,
}: {
  decision: Decision;
  onRegretUpdate: (id: number, regret: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleRegret(regret: boolean) {
    setLoading(true);
    try {
      await updateRegret(decision.id, regret);
      onRegretUpdate(decision.id, regret);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow p-5 space-y-3">
      <div className="flex justify-between items-start">
        <p className="font-semibold text-gray-800 flex-1 pr-4">{decision.question}</p>
        <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(decision.created_at)}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {decision.options.map((opt, i) => (
          <span
            key={i}
            className={`px-3 py-1 rounded-full text-sm ${
              opt === decision.ai_choice
                ? "bg-blue-100 text-blue-700 font-semibold"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {opt}
          </span>
        ))}
      </div>

      <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
        <span className="font-medium text-blue-600">AI の選択: </span>
        {decision.ai_choice}
        {decision.ai_reason && (
          <p className="mt-1 text-gray-500 text-xs">{decision.ai_reason}</p>
        )}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <span className="text-sm text-gray-500">結果は？</span>
        <button
          onClick={() => handleRegret(false)}
          disabled={loading}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            decision.regret === false
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700"
          }`}
        >
          後悔なし
        </button>
        <button
          onClick={() => handleRegret(true)}
          disabled={loading}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            decision.regret === true
              ? "bg-red-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-700"
          }`}
        >
          後悔した
        </button>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    getDecisions()
      .then(setDecisions)
      .catch(() => setError("履歴の取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [router]);

  function handleRegretUpdate(id: number, regret: boolean) {
    setDecisions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, regret } : d))
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← 戻る
          </button>
          <h1 className="text-xl font-bold text-gray-800">決定履歴</h1>
        </div>
        <button
          onClick={() => { clearToken(); router.push("/login"); }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ログアウト
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {loading && (
          <div className="text-center text-gray-400 py-16">読み込み中...</div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        {!loading && !error && decisions.length === 0 && (
          <div className="text-center text-gray-400 py-16">
            <p className="text-4xl mb-4">📋</p>
            <p>まだ決定履歴がありません</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              AIに決めてもらう →
            </button>
          </div>
        )}

        {!loading && decisions.length > 0 && (
          <div className="space-y-4">
            {decisions.map((d) => (
              <HistoryCard key={d.id} decision={d} onRegretUpdate={handleRegretUpdate} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
