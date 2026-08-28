import type { Metadata } from "next";
import ThemeRegistry from "@/theme/ThemeRegistry";
import "@/styles/globals.scss";

export const metadata: Metadata = {
  title: "Component Testing Studio | Next.js MUI SCSS",
  description: "Interactive showcase and live component testing playground built with Next.js, Material UI (MUI v6), and SCSS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
