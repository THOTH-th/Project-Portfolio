import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "THOTH · Project Portfolio Dashboard",
  description:
    "Full-loop intake and execution control for the THOTH project portfolio.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

// Applies the persisted theme before first paint to avoid a flash of the
// wrong color scheme.
const themeScript = `(function(){try{var s=localStorage.getItem('thoth.portfolio.v1');var t=s?JSON.parse(s).settings&&JSON.parse(s).settings.theme:null;document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light');}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
