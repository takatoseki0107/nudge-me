import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NudgeMe — AIがあなたの背中を押す",
  description: "優柔不断な人をAIがナッジして意思決定を助けるWebアプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-slate-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
