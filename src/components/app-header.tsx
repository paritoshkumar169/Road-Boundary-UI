import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"


export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
       
          <span className="text-xl font-bold">Smart Road Vision</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="#" className="text-sm font-medium transition-colors hover:text-primary">
            Documentation
          </Link>
          <Link href="#" className="text-sm font-medium transition-colors hover:text-primary">
            About
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}

