"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, clearToken } from "@/lib/auth";
import { getDecisions, updateRegret } from "@/lib/decision";
import type { Decision } from "@/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });
}

function RegretBadge({ regret }: { regret: boolean | null }) {
  if (regret === null) return null;
  return regret ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">
      😔 後悔した
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-600">
      ✓ 後悔なし
    </span>
  );
}

function HistoryCard({
  decision,
  onRegretUpdate,
}: {
  decision: Decision;
  onRegretUpdate: (id: string, regret: boolean) => void;
}) {
  const [updating, setUpdating] = useState(false);

  async function handleRegret(regret: boolean) {
    setUpdating(true);
    try {
      await updateRegret(decision.id, regret);
      onRegretUpdate(decision.id, regret);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
      {/* 上段: 悩み + 日付 + バッジ */}
      <div className="flex justify-between items-start gap-3">
        <p className="font-semibold text-gray-800 flex-1 leading-snug">{decision.question}</p>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="text-xs text-gray-300">{formatDate(decision.created_at)}</span>
          <RegretBadge regret={decision.regret} />
        </div>
      </div>

      {/* 選択肢 */}
      <div className="flex flex-wrap gap-1.5">
        {decision.options.map((opt, i) => (
          <span
            key={i}
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              opt === decision.ai_choice
                ? "border-purple-300 bg-purple-50 text-purple-700"
                : "border-gray-100 bg-gray-50 text-gray-400"
            }`}
          >
            {opt === decision.ai_choice && "✓ "}{opt}
          </span>
        ))}
      </div>

      {/* AI の理由（折りたたみ風） */}
      {decision.ai_reason && (
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{decision.ai_reason}</p>
      )}

      {/* フィードバックボタン */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
        <span className="text-xs text-gray-400 mr-1">結果は？</span>
        <button
          onClick={() => handleRegret(false)}
          disabled={updating}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            decision.regret === false
              ? "bg-green-500 text-white shadow-sm"
              : "bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600"
          }`}
        >
          後悔なし
        </button>
        <button
          onClick={() => handleRegret(true)}
          disabled={updating}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            decision.regret === true
              ? "bg-red-500 text-white shadow-sm"
              : "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600"
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

  function handleRegretUpdate(id: string, regret: boolean) {
    setDecisions((prev) => prev.map((d) => (d.id === id ? { ...d, regret } : d)));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-100 px-5 py-3 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-purple-600 transition-colors text-sm">
            ←
          </Link>
          <span className="text-lg font-extrabold text-purple-700 tracking-tight">NudgeMe</span>
          <span className="text-sm text-gray-400 font-medium">決定履歴</span>
        </div>
        <button
          onClick={() => { clearToken(); router.push("/login"); }}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ログアウト
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {loading && (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">読み込み中...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>
        )}

        {!loading && !error && decisions.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-gray-500 font-medium mb-2">まだ決定履歴がありません</p>
            <p className="text-gray-400 text-sm mb-6">AIに悩みを相談して、決断を記録しよう。</p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              AIに決めてもらう →
            </Link>
          </div>
        )}

        {!loading && decisions.length > 0 && (
          <>
            <p className="text-xs text-gray-400 mb-4">{decisions.length} 件の決定履歴</p>
            <div className="space-y-4">
              {decisions.map((d) => (
                <HistoryCard key={d.id} decision={d} onRegretUpdate={handleRegretUpdate} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
