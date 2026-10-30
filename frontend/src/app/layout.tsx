import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: "GapPay — gap davralarini raqamli boshqarish",
    template: "%s · GapPay",
  },
  description:
    "GapPay — an'anaviy gap (davra jamg'armasi)ni shaffof va ishonchli boshqarish platformasi: to'lovlar, navbat va tarix bir joyda.",
};

export const viewport: Viewport = {
  themeColor: "#059669",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
