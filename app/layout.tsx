import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Afterglow | Live Events & Tickets",
  description: "Discover concerts, sports, theater, and unforgettable live events. Find tickets for your next great night out.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <header className="site-header">
            <a className="brand" href="/" aria-label="Afterglow home">
              <span className="brand-mark" aria-hidden="true">✳</span>
              <span className="brand-name">afterglow<span>.</span></span>
            </a>
            <nav className="header-nav" aria-label="Main navigation"><a href="/roadtrip">Road Trip Planner</a></nav>
            <div className="header-note">The best nights start here</div>
          </header>
          <main>{children}</main>
          <footer className="site-footer">
            <div className="footer-inner">
              <span className="footer-brand">afterglow.</span>
              <span>We may earn a commission when you buy through links on this site, at no extra cost to you.</span>
              <span>Find your people. Feel the moment.</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
