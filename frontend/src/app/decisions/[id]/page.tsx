"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getToken } from "@/lib/auth";
import { getDecision } from "@/lib/decision";
import { getMe } from "@/lib/user";
import type { Decision, AICharacter } from "@/types";

const CHARACTER_META: Record<string, { emoji: string; label: string; color: string }> = {
  harsh:  { emoji: "😈", label: "毒舌キャラ",     color: "text-red-600" },
  kind:   { emoji: "🌸", label: "優しいキャラ",   color: "text-pink-600" },
  sporty: { emoji: "🔥", label: "体育会系キャラ", color: "text-orange-500" },
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">AIが結果を取得中...</p>
        </div>
      </div>
    );
  }

  if (error || !decision) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 mb-4 text-sm">{error || "決断が見つかりません"}</p>
          <button onClick={() => router.push("/dashboard")} className="text-purple-600 hover:underline text-sm">
            ← ホームへ戻る
          </button>
        </div>
      </div>
    );
  }

  const charKey = decision.is_random ? "kind" : character;
  const char = CHARACTER_META[charKey] ?? CHARACTER_META["kind"];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between sticky top-0 z-10">
        <span className="text-lg font-extrabold text-purple-700 tracking-tight">NudgeMe</span>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-gray-400 hover:text-purple-600 transition-colors"
        >
          ← 新しい悩みを相談
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {/* あなたの悩み */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">あなたの悩み</p>
          <p className="text-gray-800 font-medium mb-3">{decision.question}</p>
          <div className="flex flex-wrap gap-2">
            {decision.options.map((opt) => (
              <span
                key={opt}
                className={`px-3 py-1 rounded-full text-sm border ${
                  opt === decision.ai_choice
                    ? "border-purple-400 bg-purple-50 text-purple-700 font-semibold"
                    : "border-gray-200 text-gray-400"
                }`}
              >
                {opt}
              </span>
            ))}
          </div>
        </div>

        {/* AI の決断 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{decision.is_random ? "🎲" : char.emoji}</span>
            <div>
              <p className="text-xs text-gray-400">{decision.is_random ? "運任せ" : char.label}</p>
              <p className="text-sm font-bold text-gray-700">{decision.is_random ? "運任せの結果" : "AI の決断"}</p>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl px-5 py-4 mb-4">
            <p className="text-xs text-purple-400 font-semibold mb-1">選んだのはこれ！</p>
            <p className="text-2xl font-extrabold text-purple-700">{decision.ai_choice}</p>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{decision.ai_reason}</p>
        </div>

        {/* アクション */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors shadow-md shadow-purple-100 text-sm"
          >
            別の悩みを相談する
          </button>
          <button
            onClick={() => router.push("/history")}
            className="px-5 py-3.5 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-500 font-semibold rounded-xl transition-colors text-sm"
          >
            履歴
          </button>
        </div>
      </div>
    </div>
  );
}
