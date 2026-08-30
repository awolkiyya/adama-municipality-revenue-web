"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Landmark, LogIn, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // run `npx shadcn add dropdown-menu` if not already installed

import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";

const navItems = [
  { title: "Services", href: "#services" },
  { title: "About", href: "#about" },
  { title: "Contact", href: "#contact" },
] as const;

// The hero already distinguishes these two systems — the nav's sign-in
// should route to the same two destinations rather than a single
// ambiguous "Sign In" that guesses for the visitor.
const portals = [
  { title: "Citizen Portal", href: "/citizen/auth/login" },
  { title: "Office System", href: "/office/auth/login" },
];

/** True once the page has scrolled past a small threshold. Used to add
 *  a shadow only when there's content behind the header to separate
 *  from — a static border looks flat once the page actually scrolls. */
function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

/** Tracks which anchor-linked section is currently in view, so the nav
 *  highlights wherever the visitor actually is on the page. Safely does
 *  nothing if a section id isn't present on the current page (e.g. this
 *  same Navbar reused on a page without #services). */
function useActiveSection(hrefs: readonly string[]) {
  const [activeHref, setActiveHref] = useState<string | null>(null);

  useEffect(() => {
    const sections = hrefs
      .map((href) => ({ href, el: document.querySelector(href) }))
      .filter((entry): entry is { href: string; el: Element } => !!entry.el);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (mostVisible) {
          const match = sections.find((s) => s.el === mostVisible.target);
          if (match) setActiveHref(match.href);
        }
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );

    sections.forEach(({ el }) => observer.observe(el));
    return () => observer.disconnect();
  }, [hrefs]);

  return activeHref;
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrolled = useScrolled();
  const activeHref = useActiveSection(navItems.map((item) => item.href));

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur transition-shadow duration-200 supports-[backdrop-filter]:bg-background/60 ${
        scrolled ? "shadow-sm" : "shadow-none"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 font-bold">
          <div className="rounded-lg bg-primary p-2 text-primary-foreground">
            <Landmark className="h-5 w-5" />
          </div>
          <span className="block">Galii Mana Qopheessaa</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => {
            const isActive = activeHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "true" : undefined}
                className={`relative py-1 text-sm font-medium transition-colors after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 ${
                  isActive
                    ? "text-foreground after:scale-x-100"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* Right */}
        <div className="hidden items-center gap-2 md:flex">
          <div className="flex items-center gap-1 rounded-full border p-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-1.5">
                <LogIn className="h-4 w-4" />
                Sign In
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {portals.map((portal) => (
                <DropdownMenuItem key={portal.href} asChild>
                  <Link href={portal.href}>{portal.title}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="flex w-[300px] flex-col">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-left">
                <div className="rounded-lg bg-primary p-1.5 text-primary-foreground">
                  <Landmark className="h-4 w-4" />
                </div>
                Galii Mana Qopheessaa
              </SheetTitle>
            </SheetHeader>

            <nav className="mt-6 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-md px-3 py-2.5 text-base font-medium transition-colors ${
                    activeHref === item.href
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.title}
                </Link>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>

              <div className="flex flex-col gap-2">
                <Button asChild onClick={() => setMobileOpen(false)}>
                  <Link href="/citizen/auth/login">Citizen Portal</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  onClick={() => setMobileOpen(false)}
                >
                  <Link href="/office/auth/login">Office System</Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}