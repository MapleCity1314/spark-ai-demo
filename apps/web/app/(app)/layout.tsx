import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Press_Start_2P, ZCOOL_KuaiLe } from "next/font/google";
import "./app.css";

const arcadeFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-arcade"
});

const bodyFont = ZCOOL_KuaiLe({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "DOPPLE 逆转人格",
  description: "DOPPLE 逆转人格交易辩论体验"
};

export default function AppLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <div className={`mirror-court ${arcadeFont.variable} ${bodyFont.variable}`}>
      <div className="mirror-shell crt-overlay">
        {children}
      </div>
    </div>
  );
}
