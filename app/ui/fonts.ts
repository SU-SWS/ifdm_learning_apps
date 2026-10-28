import {Open_Sans as OpenSansFont} from "next/font/google";

export const openSans = OpenSansFont({
    variable: "--font-open-sans",
    subsets: ["latin"],
    display: "swap",
    weight: ["300", "400", "500", "600", "700", "800"],
});
