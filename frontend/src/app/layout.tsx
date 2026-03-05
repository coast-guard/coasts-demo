import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CRM Demo",
  description: "Simple CRM for Coasts demo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif", background: "#f5f5f5" }}>
        <header
          style={{
            background: "#1a1a2e",
            color: "white",
            padding: "16px 24px",
            fontSize: "20px",
            fontWeight: 600,
          }}
        >
          CRM Demo
        </header>
        <main style={{ maxWidth: 960, margin: "24px auto", padding: "0 16px" }}>{children}</main>
      </body>
    </html>
  );
}
