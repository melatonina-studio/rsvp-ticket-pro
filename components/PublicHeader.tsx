"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const navItems = [
  { label: "Eventi", href: "/" },
  { label: "Scenography", href: "/scenography" },
  { label: "Sound System", href: "/sound-system" },
  { label: "Shop", href: "/shop" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(12px)",
        background: "rgba(3,3,3,0.72)",
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
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          <Image
            src="/logo.png"
            alt="Simbiosi"
            width={150}
            height={46}
            priority
          />
        </Link>

        <nav className="site-nav-desktop">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              style={{
                color: "#fff",
                textDecoration: "none",
                opacity: 0.86,
                fontSize: 15,
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="site-nav-toggle"
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
        <div
          className="site-nav-mobile"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "10px 18px 16px",
            display: "none",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: 10,
            }}
          >
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  color: "#fff",
                  textDecoration: "none",
                  padding: "12px 0",
                  opacity: 0.9,
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <style>{`
        .site-nav-desktop {
          display: flex;
          align-items: center;
          gap: 22px;
        }

        @media (max-width: 820px) {
          .site-nav-desktop {
            display: none;
          }

          .site-nav-toggle {
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
          }

          .site-nav-mobile {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
}