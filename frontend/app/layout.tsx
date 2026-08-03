import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pass Scout",
  description: "European midfielder pass analysis — xT, xP, progression ratings",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="brand">
              Pass<span>Scout</span>
            </Link>
            <nav className="nav">
              <Link href="/">Home</Link>
              <Link href="/profile">Profile</Link>
              <Link href="/compare">Compare</Link>
              <Link href="/maps">Maps</Link>
              <Link href="/players">Lista</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
