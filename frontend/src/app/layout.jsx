import localFont from "next/font/local";
import { MockAuthProvider } from "@/lib/mock-auth";
import "./globals.css";
const inter = localFont({
    src: [
        { path: "../../public/fonts/inter-regular.ttf", weight: "400", style: "normal" },
        { path: "../../public/fonts/inter-medium.ttf", weight: "500", style: "normal" },
        { path: "../../public/fonts/inter-semibold.ttf", weight: "600", style: "normal" },
        { path: "../../public/fonts/inter-bold.ttf", weight: "700", style: "normal" },
    ],
    variable: "--font-inter",
    display: "swap",
});
export const metadata = {
    title: "RoomStay",
    description: "Condo & Apartment Rental Management System",
};
export default function RootLayout({ children }) {
    return (<html lang="en" className={inter.variable}>
      <body>
        <MockAuthProvider>{children}</MockAuthProvider>
      </body>
    </html>);
}
