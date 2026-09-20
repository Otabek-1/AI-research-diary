import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Field / Notes | A personal research laboratory",
  description: "A living map of research, experiments, and connected ideas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
