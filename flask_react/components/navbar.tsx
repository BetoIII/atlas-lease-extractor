import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui"

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logo.svg" alt="Atlas Data Co-op Logo" width={32} height={32} className="h-8 w-8" />
            <span className="inline-block font-bold">Atlas Data Co-op</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-4">
            <Link
              href="/why-atlas"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Why Atlas
            </Link>
            {/* <Link
              href="/why-tokenize"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Why Tokenize
            </Link> */}
            <Link
              href="https://x.com/betoiii"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Twitter
            </Link>
            <Button asChild variant="default">
              <Link href="#signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}
