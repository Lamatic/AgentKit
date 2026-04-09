import { Poppins, Dela_Gothic_One, Jost } from "next/font/google";

export const poppins = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const delaGothicOne = Dela_Gothic_One({
  weight: ["400"],
  subsets: ["latin"],
});

export const jost = Jost({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});
