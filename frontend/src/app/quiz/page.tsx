"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getQuestions, saveResult } from "@/lib/personality";
import { getToken } from "@/lib/auth";
import type { PersonalityQuestion, PersonalityType } from "@/types";

const PERSONALITY_LABELS: Record<PersonalityType, string> = {
  analytical: "分析タイプ",
  spontaneous: "直感タイプ",
  empathetic: "共感タイプ",
  competitive: "競争タイプ",
};

// Options are stored as "テキスト（type）" — extract the type keyword inside ().
function extractType(option: string): PersonalityType {
  const match = option.match(/（(\w+)）$/);
  return (match?.[1] ?? "analytical") as PersonalityType;
}

export default function QuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<PersonalityQuestion[]>([]);
  const [answers, setAnswers] = useState<(PersonalityType | null)[]>([]);
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<PersonalityType | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
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
      setCurrent((c) => c + 1);
    }
  }

  async function handleSubmit() {
    if (answers.some((a) => a === null)) return;
    setSubmitting(true);
    setError("");
    try {
      const { personality_type } = await saveResult(
        answers as PersonalityType[]
      );
      setResult(personality_type);
    } catch {
      setError("診断結果の保存に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </main>
    );
  }

  if (result) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow p-8 text-center">
          <p className="text-sm text-gray-500 mb-2">あなたの性格タイプ</p>
          <h2 className="text-3xl font-bold text-blue-600 mb-4">
            {PERSONALITY_LABELS[result]}
          </h2>
          <p className="text-gray-600 mb-8">
            診断が完了しました。あなたに合ったナッジでサポートします！
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            はじめる
          </button>
        </div>
      </main>
    );
  }

  const q = questions[current];
  const answered = answers.filter((a) => a !== null).length;
  const allAnswered = answered === questions.length;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow p-8">
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>性格診断</span>
            <span>
              {answered} / {questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(answered / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <h2 className="text-lg font-semibold text-gray-800 mb-6">
          Q{current + 1}. {q.question}
        </h2>

        <div className="space-y-3 mb-8">
          {q.options.map((option) => {
            const type = extractType(option);
            const label = option.replace(/（\w+）$/, "").trim();
            const selected = answers[current] === type;
            return (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                  selected
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-blue-300 text-gray-700"
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
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              前へ
            </button>
          )}
          {current < questions.length - 1 ? (
            <button
              onClick={() => setCurrent((c) => c + 1)}
              disabled={answers[current] === null}
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-lg transition-colors"
            >
              次へ
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold rounded-lg transition-colors"
            >
              {submitting ? "診断中..." : "診断結果を見る"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
