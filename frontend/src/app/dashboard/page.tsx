"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, clearToken } from "@/lib/auth";
import { getMe } from "@/lib/user";
import { createDecision, createRandomDecision, updateCharacter } from "@/lib/decision";
import type { AICharacter, User } from "@/types";

const CHARACTERS: { value: AICharacter; label: string; emoji: string; desc: string }[] = [
  { value: "harsh",  label: "毒舌",     emoji: "😈", desc: "ズバッと本音で押す" },
  { value: "kind",   label: "優しい",   emoji: "🌸", desc: "温かく寄り添う" },
  { value: "sporty", label: "体育会系", emoji: "🔥", desc: "熱血全力で決める" },
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
      .then((u) => { setUser(u); if (u.ai_character) setCharacter(u.ai_character); })
      .catch(() => { clearToken(); router.push("/login"); });
  }, [router]);

  function addOption() { if (options.length < 4) setOptions([...options, ""]); }
  function removeOption(i: number) { if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i)); }
  function setOption(i: number, val: string) { const n = [...options]; n[i] = val; setOptions(n); }

  async function handleCharacterChange(c: AICharacter) {
    setCharacter(c);
    try { await updateCharacter(c); } catch { /* non-critical */ }
  }

  function validate(): string {
    if (!question.trim()) return "悩みを入力してください";
    if (question.length > 200) return "悩みは200文字以内で入力してください";
    if (options.filter((o) => o.trim()).length < 2) return "選択肢を2つ以上入力してください";
    return "";
  }

  async function handleSubmit(isRandom: boolean) {
    const msg = validate();
    if (msg) { setError(msg); return; }
    setError("");
    setLoading(true);
    const filled = options.filter((o) => o.trim());
    try {
      const decision = isRandom
        ? await createRandomDecision({ question: question.trim(), options: filled })
        : await createDecision({ question: question.trim(), options: filled, character });
      router.push(`/decisions/${decision.id}`);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 503) {
        setError("AIサービスが一時的に利用できません。しばらくしてから再試行してください。");
      } else {
        setError("AIの判断中にエラーが発生しました。しばらくしてから再試行してください。");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 px-5 py-3 flex justify-between items-center sticky top-0 z-10">
        <span className="text-lg font-extrabold text-purple-700 tracking-tight">NudgeMe</span>
        <div className="flex items-center gap-4">
          {user && <span className="text-xs text-gray-400 hidden sm:block">{user.email}</span>}
          <Link href="/history" className="text-sm text-gray-500 hover:text-purple-600 font-medium transition-colors">
            履歴
          </Link>
          <Link href="/profile" className="text-sm text-gray-500 hover:text-purple-600 font-medium transition-colors">
            プロフィール
          </Link>
          <button
            onClick={() => { clearToken(); router.push("/login"); }}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* キャラクター選択 */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">AIキャラクター</p>
          <div className="grid grid-cols-3 gap-3">
            {CHARACTERS.map((c) => (
              <button
                key={c.value}
                onClick={() => handleCharacterChange(c.value)}
                className={`flex flex-col items-center py-4 px-2 rounded-xl border-2 transition-all ${
                  character === c.value
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-100 bg-white hover:border-purple-200 hover:bg-purple-50/40"
                }`}
              >
                <span className="text-2xl mb-1.5">{c.emoji}</span>
                <span className={`text-sm font-bold ${character === c.value ? "text-purple-700" : "text-gray-700"}`}>
                  {c.label}
                </span>
                <span className="text-xs mt-1 text-gray-400 text-center leading-tight">{c.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 入力フォーム */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">どんなことで悩んでいますか？</p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              悩み <span className="text-gray-400 font-normal text-xs">最大200文字</span>
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="例：転職すべきか、今の会社に残るべきか..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-gray-50 text-sm transition"
            />
            <p className="text-right text-xs text-gray-300 mt-1">{question.length} / 200</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選択肢 <span className="text-gray-400 font-normal text-xs">2〜4つ</span>
            </label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => setOption(i, e.target.value)}
                    placeholder={`選択肢 ${i + 1}`}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-gray-50 text-sm transition"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(i)}
                      className="px-3 text-gray-300 hover:text-red-400 transition-colors"
                      aria-label="削除"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 4 && (
              <button onClick={addOption} className="mt-2 text-xs text-purple-500 hover:text-purple-700 font-medium transition-colors">
                ＋ 選択肢を追加
              </button>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold rounded-xl transition-colors shadow-md shadow-purple-100 text-sm"
            >
              {loading ? "AIが考え中..." : "AIに決めてもらう"}
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="px-5 py-3.5 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 disabled:opacity-50 text-gray-500 font-semibold rounded-xl transition-colors text-lg"
              title="運任せで決める"
            >
              🎲
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
