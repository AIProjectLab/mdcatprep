"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { PAYMENTS_DISABLED } from "@/lib/questions";

export default function AppHeader() {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isPro = user?.publicMetadata?.hasAccess === true;
  const isAdmin = user?.publicMetadata?.role === "admin";

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard#results", label: "My Results" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return false;
  };

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-[#faf6ef]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span className="text-lg font-bold text-stone-900">
            MDCAT <span className="text-teal-700">Prep</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive(link.href)
                  ? "bg-teal-50 text-teal-700"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isLoaded && !isPro && !PAYMENTS_DISABLED && (
            <Link
              href="/payment"
              className="hidden rounded-lg border border-teal-700 px-3 py-1.5 text-sm font-semibold text-teal-700 hover:bg-teal-50 md:inline-block"
            >
              Unlock Unlimited
            </Link>
          )}
          {isLoaded && isAdmin && (
            <Link href="/admin" className="hidden text-sm font-medium text-stone-500 hover:text-stone-700 md:inline-block">
              Admin
            </Link>
          )}
          <UserButton />
          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 md:hidden"
            aria-label="Menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="border-t border-stone-200 bg-[#faf6ef] px-4 py-2 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                isActive(link.href)
                  ? "bg-teal-50 text-teal-700"
                  : "text-stone-700 hover:bg-stone-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isLoaded && !isPro && !PAYMENTS_DISABLED && (
            <Link
              href="/payment"
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-50"
            >
              Unlock Unlimited
            </Link>
          )}
          {isLoaded && isAdmin && (
            <Link href="/admin" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm text-stone-600 hover:bg-stone-100">
              Admin
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
