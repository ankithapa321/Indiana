import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import { BackgroundVideo } from "@/components/BackgroundVideo";
import { CartProvider } from "@/components/Cart";
import { WeatherControl } from "@/components/WeatherControl";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });

export const metadata: Metadata = {
  title: "INDIANA STATE APPAREL — Premium Indiana Wear",
  description: "Tees, hoodies, sweatshirts, tank tops and long sleeves. Printed fresh and shipped nationwide.",
  icons: { icon: "/favicon.png", apple: "/favicon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${bebas.variable}`}>
      <body>
        <BackgroundVideo />
        <CartProvider>{children}</CartProvider>
        <WeatherControl />
        <footer className="made-by">
          Made by <a href="https://artxdevllc.com/" target="_blank" rel="noopener noreferrer">ArtXDev</a>
        </footer>
      </body>
    </html>
  );
}
