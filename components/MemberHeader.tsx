"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

type MemberHeaderProps = {
  passToken: string;
};

export default function MemberHeader({ passToken }: MemberHeaderProps) {
  const [open, setOpen] = useState(false);

  const items = [
    { label: "I miei ticket", href: `/pass/${passToken}#tickets` },
    { label: "Eventi passati", href: `/pass/${passToken}#past` },
    { label: "Profilo", href: `/pass/${passToken}#profile` },
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        backdropFilter: "blur(12px)",
        background: "rgba(3,3,3,0.82)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          width: "100%",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          boxSizing: "border-box",
        }}
      >
        <Link href={`/pass/${passToken}`} style={{ textDecoration: "none", display: "inline-flex" }}>
          <Image src="/logo.png" alt="Simbiosi" width={150} height={46} priority />
        </Link>

        <nav className="member-nav-desktop">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              style={{ color: "#fff", textDecoration: "none", opacity: 0.86, fontSize: 15 }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="member-nav-toggle"
          aria-label="Apri menu"
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            color: "#fff",
            cursor: "pointer",
            display: "none",
          }}
        >
          ☰
        </button>
      </div>

      {open ? (
        <div className="member-nav-mobile" style={{ display: "none", padding: "0 18px 16px" }}>
          <div style={{ display: "grid", gap: 8 }}>
            {items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  color: "#fff",
                  textDecoration: "none",
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  opacity: 0.9,
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <style>{`
        .member-nav-desktop {
          display: flex;
          align-items: center;
          gap: 22px;
        }

        @media (max-width: 820px) {
          .member-nav-desktop {
            display: none;
          }

          .member-nav-toggle {
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
          }

          .member-nav-mobile {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
}