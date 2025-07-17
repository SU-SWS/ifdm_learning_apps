import {Open_Sans as OpenSansFont, Poppins} from "next/font/google";

export const openSans = OpenSansFont({
    variable: "--font-open-sans",
    subsets: ["latin"],
    display: "swap",
    weight: ["300", "400", "500", "600", "700", "800"],
});

export const poppins = Poppins({
    weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
    style: ['normal', 'italic'],
    variable: '--font-poppins',
    subsets: ['latin'],
})
