import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CareerHub AI — Every Opportunity. One Smart Search.",
  description: "Discover jobs, internships, apprenticeships, fellowships and scholarships from across the web — personalized to your education, skills, location and career goals. Powered by AI matching.",
  keywords: ["jobs", "internships", "careers", "freshers", "apprenticeship", "fellowship", "AI job search", "India jobs", "remote jobs", "government jobs", "CareerHub AI"],
  authors: [{ name: "CareerHub AI" }],
  openGraph: {
    title: "CareerHub AI — Every Opportunity. One Smart Search.",
    description: "Jobs. Internships. Careers. All in one place. Powered by AI matching.",
    siteName: "CareerHub AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CareerHub AI",
    description: "Every Opportunity. One Smart Search.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
