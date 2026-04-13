import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simbiosi",
  description: "Eventi, ticket e pass digitale",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body
        style={{
          margin: 0,
          background: "#030303",
          color: "#fff",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          overflowX: "hidden",
        }}
      >
        {children}
      </body>
    </html>
  );
}