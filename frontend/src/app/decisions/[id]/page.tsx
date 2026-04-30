"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getToken } from "@/lib/auth";
import { getDecision } from "@/lib/decision";
import { getMe } from "@/lib/user";
import type { Decision, AICharacter } from "@/types";

const CHARACTER_LABELS: Record<string, { emoji: string; label: string }> = {
  harsh:  { emoji: "😈", label: "毒舌" },
  kind:   { emoji: "🌸", label: "優しい" },
  sporty: { emoji: "🔥", label: "体育会系" },
};

export default function DecisionResultPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [character, setCharacter] = useState<AICharacter>("kind");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    Promise.all([getDecision(Number(id)), getMe()])
      .then(([d, u]) => { setDecision(d); setCharacter(u.ai_character); })
      .catch(() => setError("結果の取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">読み込み中...</p>
      </main>
    );
  }

  if (error || !decision) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "決断が見つかりません"}</p>
          <button onClick={() => router.push("/dashboard")} className="text-blue-600 hover:underline">
            ホームへ戻る
          </button>
        </div>
      </main>
    );
  }

  const char = CHARACTER_LABELS[decision.is_random ? "kind" : character] ?? CHARACTER_LABELS["kind"];

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
          ← 新しい悩みを相談する
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {/* 悩み */}
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">あなたの悩み</p>
          <p className="text-gray-800">{decision.question}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {decision.options.map((opt) => (
              <span
                key={opt}
                className={`px-3 py-1 rounded-full text-sm border ${
                  opt === decision.ai_choice
                    ? "border-blue-400 bg-blue-50 text-blue-700 font-semibold"
                    : "border-gray-200 text-gray-500"
                }`}
              >
                {opt}
              </span>
            ))}
          </div>
        </div>

        {/* AI の答え */}
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            {decision.is_random ? (
              <>
                <span className="text-2xl">🎲</span>
                <span className="font-semibold text-gray-700">運任せの結果</span>
              </>
            ) : (
              <>
                <span className="text-2xl">{char.emoji}</span>
                <span className="font-semibold text-gray-700">AI の決断</span>
              </>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 mb-4">
            <p className="text-xs text-blue-500 font-semibold mb-1">選んだのはこれ！</p>
            <p className="text-2xl font-bold text-blue-700">{decision.ai_choice}</p>
          </div>

          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{decision.ai_reason}</p>
        </div>

        {/* アクション */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            別の悩みを相談する
          </button>
        </div>
      </div>
    </main>
  );
}
