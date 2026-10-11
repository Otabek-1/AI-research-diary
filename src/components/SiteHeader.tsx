"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

type NavKey = "archive" | "map" | "treasure" | "about";

const links: { key: NavKey; label: string; href: string }[] = [
  { key: "treasure", label: "Treasure Map", href: "/treasure-map" },
  { key: "archive", label: "Archive", href: "/#archive" },
  { key: "map", label: "Structure", href: "/#map" },
  { key: "about", label: "About", href: "/#about" },
];

export function SiteHeader({ active, children }: { active?: NavKey; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="site-header-inner">
        <Link className="wordmark" href="/" onClick={() => setOpen(false)}>
          <span className="wordmark-mark" aria-hidden="true" />
          FIELD / NOTES<span className="wordmark-tag">01</span>
        </Link>
        <nav className={`site-nav${open ? " is-open" : ""}`} aria-label="Primary navigation">
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={active === link.key ? "is-active" : undefined}
              aria-current={active === link.key ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="site-header-tools">
          {children}
          <button
            type="button"
            className="icon-button menu-button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ note, status }: { note?: string; status?: string }) {
  return (
    <footer className="site-footer">
      <span className="wordmark">
        <span className="wordmark-mark" aria-hidden="true" />
        FIELD / NOTES
      </span>
      <span>{note ?? "A quiet record of ongoing study, since 2026."}</span>
      {status && <span className="footer-status">{status}</span>}
    </footer>
  );
}
