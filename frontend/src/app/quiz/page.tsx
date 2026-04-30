"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getQuestions, saveResult } from "@/lib/personality";
import { updatePersonality } from "@/lib/user";
import { getToken } from "@/lib/auth";
import type { PersonalityQuestion, PersonalityType } from "@/types";

const PERSONALITY_LABELS: Record<PersonalityType, { label: string; desc: string; emoji: string }> = {
  analytical:  { label: "分析タイプ",  desc: "データと論理で最適解を導くあなたに、根拠あるナッジを届けます。", emoji: "🔍" },
  spontaneous: { label: "直感タイプ",  desc: "直感を大切にするあなたに、シンプルで背中を押すナッジを届けます。", emoji: "⚡" },
  empathetic:  { label: "共感タイプ",  desc: "感情を大切にするあなたに、寄り添いながら一緒に考えるナッジを届けます。", emoji: "💜" },
  competitive: { label: "競争タイプ",  desc: "成長と結果を追うあなたに、前へ進む力強いナッジを届けます。", emoji: "🏆" },
};

function extractType(option: string): PersonalityType {
  const match = option.match(/（(\w+)）$/);
  return (match?.[1] ?? "analytical") as PersonalityType;
}

export default function QuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRetake = searchParams.get("mode") === "retake";

  const [questions, setQuestions] = useState<PersonalityQuestion[]>([]);
  const [answers, setAnswers] = useState<(PersonalityType | null)[]>([]);
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<PersonalityType | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    getQuestions()
      .then((qs) => {
        setQuestions(qs);
        setAnswers(new Array(qs.length).fill(null));
      })
      .catch(() => setError("質問の取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [router]);

  function handleSelect(option: string) {
    const type = extractType(option);
    const next = [...answers];
    next[current] = type;
    setAnswers(next);
    if (current < questions.length - 1) {
      setTimeout(() => setCurrent((c) => c + 1), 200);
    }
  }

  async function handleSubmit() {
    if (answers.some((a) => a === null)) return;
    setSubmitting(true);
    setError("");
    try {
      let personality_type: PersonalityType;
      if (isRetake) {
        const counts: Record<PersonalityType, number> = { analytical: 0, spontaneous: 0, empathetic: 0, competitive: 0 };
        (answers as PersonalityType[]).forEach((a) => { counts[a]++; });
        personality_type = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as PersonalityType;
        await updatePersonality(personality_type);
      } else {
        const res = await saveResult(answers as PersonalityType[]);
        personality_type = res.personality_type;
      }
      setResult(personality_type);
    } catch {
      setError("診断結果の保存に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">読み込み中...</p>
        </div>
      </main>
    );
  }

  if (result) {
    const r = PERSONALITY_LABELS[result];
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-purple-100 p-8 text-center">
          <div className="text-5xl mb-4">{r.emoji}</div>
          <p className="text-xs font-semibold text-purple-500 uppercase tracking-widest mb-2">診断結果</p>
          <h2 className="text-3xl font-extrabold text-purple-700 mb-3">{r.label}</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-8">{r.desc}</p>
          <button
            onClick={() => router.push(isRetake ? "/profile" : "/dashboard")}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors shadow-md shadow-purple-200"
          >
            {isRetake ? "プロフィールへ戻る →" : "はじめる →"}
          </button>
        </div>
      </main>
    );
  }

  const q = questions[current];
  const answered = answers.filter((a) => a !== null).length;
  const allAnswered = answered === questions.length;
  const progress = ((answered) / questions.length) * 100;

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <span className="text-xl font-extrabold text-purple-700 tracking-tight">NudgeMe</span>
          <p className="text-sm text-gray-500 mt-0.5">{isRetake ? "性格再診断" : "性格診断"}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-8">
          {/* プログレス */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Q{current + 1} / {questions.length}</span>
              <span>{answered} 問回答済み</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <h2 className="text-lg font-bold text-gray-800 mb-5 leading-snug">
            {q.question}
          </h2>

          <div className="space-y-3 mb-6">
            {q.options.map((option) => {
              const type = extractType(option);
              const label = option.replace(/（\w+）$/, "").trim();
              const selected = answers[current] === type;
              return (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    selected
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 text-gray-700"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            {current > 0 && (
              <button
                onClick={() => setCurrent((c) => c - 1)}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                ← 前へ
              </button>
            )}
            {current < questions.length - 1 ? (
              <button
                onClick={() => setCurrent((c) => c + 1)}
                disabled={answers[current] === null}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                次へ →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!allAnswered || submitting}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                {submitting ? "診断中..." : "診断結果を見る"}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
