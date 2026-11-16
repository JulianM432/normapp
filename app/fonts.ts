import { Lexend, Young_Serif } from "next/font/google";

export const display = Young_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-young-serif",
});

export const body = Lexend({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lexend",
});
