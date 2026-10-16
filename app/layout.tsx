import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "TEAM360 · Không gian điều hành",
  description: "Quản lý công việc, kế hoạch và phối hợp phòng ban.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
