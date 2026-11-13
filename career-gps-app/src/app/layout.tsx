import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apply Wizz — Career GPS",
  description: "One Resume. More Job Roles. Discover the breadth of job roles matched to your career profile.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#0B1D33] text-white selection:bg-[#29FE29] selection:text-[#0B1D33]">
        {children}
      </body>
    </html>
  );
}
