import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Stockat Damanhour",
  description: "Manage Your Brand",
  icons: {
    icon: "/maleAvatar.png",
    shortcut: "/maleAvatar.png",
    apple: "/maleAvatar.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
