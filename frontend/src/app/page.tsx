import Link from "next/link";

const features = [
  {
    icon: "🧠",
    title: "性格診断でパーソナライズ",
    desc: "4タイプの性格診断で、あなたにぴったりのナッジスタイルを見つけます。",
  },
  {
    icon: "🤖",
    title: "AIキャラが背中を押す",
    desc: "毒舌・優しい・体育会系の3キャラから選んで、あなたのスタイルで背中を押してもらおう。",
  },
  {
    icon: "📊",
    title: "決断履歴を振り返る",
    desc: "過去の決断を一覧で確認。後悔した？しなかった？フィードバックで自己理解を深めよう。",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
      {/* ナビゲーション */}
      <nav className="flex justify-between items-center px-6 py-4 max-w-5xl mx-auto">
        <span className="text-xl font-bold text-purple-700 tracking-tight">NudgeMe</span>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
          >
            ログイン
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            無料で始める
          </Link>
        </div>
      </nav>

      {/* ヒーロー */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-20 text-center">
        <span className="inline-block px-3 py-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded-full mb-6">
          行動経済学 × AI
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
          決められない？<br />
          <span className="text-purple-600">AIがあなたの背中を押します。</span>
        </h1>
        <p className="text-lg text-gray-600 mb-3 leading-relaxed">
          NudgeMe は「ナッジ」の考え方を使い、あなたの性格タイプに合わせた<br className="hidden sm:block" />
          AIキャラクターが最適な決断をサポートします。
        </p>
        <p className="text-sm text-gray-400 mb-10">
          ナッジとは ── 強制せず、そっと背中を押して望ましい行動を促す行動経済学の手法です。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register"
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-200 transition-all hover:-translate-y-0.5"
          >
            無料で始める →
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 border-2 border-purple-200 text-purple-700 font-semibold rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            ログイン
          </Link>
        </div>
      </section>

      {/* 機能カード */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-center text-2xl font-bold text-gray-800 mb-10">
          NudgeMe でできること
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6 hover:shadow-md hover:border-purple-200 transition-all"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-gray-800 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-purple-600 py-16 px-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">今すぐ決断しよう</h2>
        <p className="text-purple-200 mb-8 text-sm">登録無料・30秒でスタート</p>
        <Link
          href="/register"
          className="inline-block px-8 py-3 bg-white text-purple-700 font-semibold rounded-xl hover:bg-purple-50 transition-colors"
        >
          無料で始める →
        </Link>
      </section>

      <footer className="text-center py-6 text-xs text-gray-400">
        © 2026 NudgeMe
      </footer>
    </main>
  );
}
