"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearToken } from "@/lib/auth";
import { getMe } from "@/lib/user";
import { createDecision, createRandomDecision, updateCharacter } from "@/lib/decision";
import type { AICharacter, User } from "@/types";

const CHARACTERS: { value: AICharacter; label: string; emoji: string; desc: string; color: string }[] = [
  { value: "harsh",  label: "毒舌",     emoji: "😈", desc: "ズバッと本音で背中を押す",   color: "border-red-400 bg-red-50 text-red-700" },
  { value: "kind",   label: "優しい",   emoji: "🌸", desc: "温かく寄り添って応援する",   color: "border-pink-400 bg-pink-50 text-pink-700" },
  { value: "sporty", label: "体育会系", emoji: "🔥", desc: "熱血全力でノリよく決める",   color: "border-orange-400 bg-orange-50 text-orange-700" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [character, setCharacter] = useState<AICharacter>("kind");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    getMe()
      .then((u) => {
        setUser(u);
        if (u.ai_character) setCharacter(u.ai_character);
      })
      .catch(() => { clearToken(); router.push("/login"); });
  }, [router]);

  function addOption() {
    if (options.length < 4) setOptions([...options, ""]);
  }

  function removeOption(i: number) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== i));
  }

  function setOption(i: number, val: string) {
    const next = [...options];
    next[i] = val;
    setOptions(next);
  }

  async function handleCharacterChange(c: AICharacter) {
    setCharacter(c);
    try { await updateCharacter(c); } catch { /* non-critical */ }
  }

  function validate(): string {
    if (question.trim().length === 0) return "悩みを入力してください";
    if (question.length > 200) return "悩みは200文字以内で入力してください";
    const filled = options.filter((o) => o.trim().length > 0);
    if (filled.length < 2) return "選択肢を2つ以上入力してください";
    return "";
  }

  async function handleSubmit(isRandom: boolean) {
    const msg = validate();
    if (msg) { setError(msg); return; }
    setError("");
    setLoading(true);

    const filled = options.filter((o) => o.trim().length > 0);
    try {
      const decision = isRandom
        ? await createRandomDecision({ question: question.trim(), options: filled })
        : await createDecision({ question: question.trim(), options: filled, character });
      router.push(`/decisions/${decision.id}`);
    } catch {
      setError("AIの判断中にエラーが発生しました。しばらくしてから再試行してください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">NudgeMe</h1>
        <div className="flex items-center gap-4">
          {user && <span className="text-sm text-gray-500">{user.email}</span>}
          <button
            onClick={() => router.push("/history")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            履歴
          </button>
          <button
            onClick={() => { clearToken(); router.push("/login"); }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ログアウト
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* キャラクター選択 */}
        <section className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            AIキャラクター
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {CHARACTERS.map((c) => (
              <button
                key={c.value}
                onClick={() => handleCharacterChange(c.value)}
                className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                  character === c.value
                    ? c.color + " border-opacity-100"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <span className="text-2xl mb-1">{c.emoji}</span>
                <span className="text-sm font-semibold">{c.label}</span>
                <span className="text-xs mt-1 text-center leading-tight opacity-75">{c.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 入力フォーム */}
        <section className="bg-white rounded-2xl shadow p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            どんなことで悩んでいますか？
          </h2>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              悩み <span className="text-gray-400 font-normal">（最大200文字）</span>
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="例：転職すべきか、今の会社に残るべきか..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-right text-xs text-gray-400 mt-1">{question.length} / 200</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選択肢 <span className="text-gray-400 font-normal">（2〜4つ）</span>
            </label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => setOption(i, e.target.value)}
                    placeholder={`選択肢 ${i + 1}`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(i)}
                      className="px-3 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="削除"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 4 && (
              <button
                onClick={addOption}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                + 選択肢を追加
              </button>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl transition-colors"
            >
              {loading ? "AIが考え中..." : "AIに決めてもらう"}
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="px-5 py-3 border-2 border-gray-300 hover:border-gray-400 disabled:opacity-50 text-gray-600 font-semibold rounded-xl transition-colors"
              title="運任せで決める"
            >
              🎲
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
