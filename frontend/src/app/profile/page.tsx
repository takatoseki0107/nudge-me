"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, clearToken } from "@/lib/auth";
import { getMe } from "@/lib/user";
import type { User, PersonalityType } from "@/types";

const PERSONALITY_LABELS: Record<PersonalityType, { label: string; emoji: string }> = {
  analytical:  { label: "分析タイプ",  emoji: "🔍" },
  spontaneous: { label: "直感タイプ",  emoji: "⚡" },
  empathetic:  { label: "共感タイプ",  emoji: "💜" },
  competitive: { label: "競争タイプ",  emoji: "🏆" },
};

const CHARACTER_LABELS: Record<string, { label: string; emoji: string }> = {
  harsh:  { label: "毒舌キャラ",     emoji: "😈" },
  kind:   { label: "優しいキャラ",   emoji: "🌸" },
  sporty: { label: "体育会系キャラ", emoji: "🔥" },
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    getMe()
      .then(setUser)
      .catch(() => { clearToken(); router.push("/login"); })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const personality = user.personality_type ? PERSONALITY_LABELS[user.personality_type] : null;
  const character = CHARACTER_LABELS[user.ai_character] ?? CHARACTER_LABELS["kind"];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-100 px-5 py-3 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-purple-600 transition-colors text-sm">←</Link>
          <span className="text-lg font-extrabold text-purple-700 tracking-tight">NudgeMe</span>
          <span className="text-sm text-gray-400 font-medium">プロフィール</span>
        </div>
        <button
          onClick={() => { clearToken(); router.push("/login"); }}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ログアウト
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {/* ユーザー情報 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">アカウント</p>
          <p className="text-gray-700 font-medium">{user.email}</p>
          <p className="text-xs text-gray-400 mt-1">
            登録日: {new Date(user.created_at).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* 性格タイプ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">性格タイプ</p>
          {personality ? (
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{personality.emoji}</span>
              <div>
                <p className="font-bold text-gray-800">{personality.label}</p>
                <p className="text-xs text-gray-400">現在の診断結果</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm mb-4">まだ診断していません</p>
          )}
          <button
            onClick={() => router.push("/quiz?mode=retake")}
            className="w-full py-3 border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 text-purple-700 font-semibold rounded-xl transition-colors text-sm"
          >
            性格を再診断する
          </button>
        </div>

        {/* AIキャラクター */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">使用中のAIキャラクター</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{character.emoji}</span>
            <div>
              <p className="font-bold text-gray-800">{character.label}</p>
              <p className="text-xs text-gray-400">ダッシュボードから変更できます</p>
            </div>
          </div>
        </div>

        {/* ナビゲーション */}
        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="flex-1 py-3 text-center bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            ダッシュボードへ
          </Link>
          <Link
            href="/history"
            className="flex-1 py-3 text-center border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-500 font-semibold rounded-xl transition-colors text-sm"
          >
            決定履歴
          </Link>
        </div>
      </div>
    </div>
  );
}
