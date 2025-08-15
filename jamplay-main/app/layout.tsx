import "./globals.css";
import Image from "next/image";
import Link from "next/link";
import AuthListener from "./auth-listener";
// no change to AuthListener; removing temporary debug banner

export const metadata = {
  title: "JamPlay",
  description: "AI Prompt Game hub",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AuthListener />

        <header className="border-b">
          <div className="container flex h-14 items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" width={120} height={28} alt="JamPlay" />
            </Link>
            <nav className="ml-auto flex items-center gap-4">
              <Link href="/browse" className="text-sm">Browse</Link>
              <Link href="/create" className="text-sm">Create</Link>
              <Link href="/admin" className="text-sm">Admin</Link>
            </nav>
          </div>
        </header>

        <main className="container py-6">{children}</main>

        <footer className="border-t mt-10">
          <div className="container py-6 text-sm text-neutral-600">
            © {new Date().getFullYear()} JamPlay
          </div>
        </footer>
      </body>
    </html>
  );
}
