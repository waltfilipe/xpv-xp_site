import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pass Scout",
  description: "European outfield pass analysis — xT, xP, progression ratings by position pool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="brand">
              <span className="brand-icon"><i className="fa-solid fa-futbol" /></span>
              Pass<span>Scout</span>
            </Link>
            <nav className="nav">
              <Link href="/reports">Reports</Link>
              <Link href="/profile">Profile</Link>
              <Link href="/compare">Compare</Link>
              <Link href="/maps">Maps</Link>
              <Link href="/players">Players</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
