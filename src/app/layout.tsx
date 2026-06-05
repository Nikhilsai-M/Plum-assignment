import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ClipboardList, FilePlus2, History, Inbox, ShieldCheck } from "lucide-react";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Plum OPD Adjudication",
  description: "AI-assisted OPD claim adjudication with deterministic policy rules."
};

const nav = [
  { href: "/", label: "Dashboard", icon: Activity },
  { href: "/new-claim", label: "New Claim", icon: FilePlus2 },
  { href: "/claims", label: "History", icon: History },
  { href: "/manual-review", label: "Manual Review", icon: Inbox },
  { href: "/policy", label: "Policy", icon: ShieldCheck }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="flex min-h-screen">
            <aside className="hidden w-64 shrink-0 border-r bg-white/95 lg:block">
              <div className="flex h-16 items-center gap-3 border-b px-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
                  <ClipboardList size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Plum OPD</p>
                  <p className="text-xs text-muted-foreground">Claim adjudication</p>
                </div>
              </div>
              <nav className="space-y-1 p-3">
                {nav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Icon size={17} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </aside>
            <main className="min-w-0 flex-1">
              <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur lg:hidden">
                <div className="flex min-h-16 items-center justify-between px-4">
                  <Link href="/" className="font-semibold">Plum OPD</Link>
                  <Link href="/new-claim" className="text-sm font-medium text-primary">New claim</Link>
                </div>
                <nav className="flex gap-1 overflow-x-auto px-3 pb-3" aria-label="Mobile navigation">
                  {nav.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex shrink-0 items-center gap-2 rounded-md border bg-white px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm"
                      >
                        <Icon size={14} aria-hidden="true" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </header>
              <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
