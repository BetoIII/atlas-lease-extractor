"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function Sidebar() {
  const pathname = usePathname()

  const links = [
    { href: "/dashboard", label: "Documents" },
    { href: "/dashboard/marketplace", label: "Marketplace" },
  ]

  return (
    <aside className="w-48 border-r bg-gray-50 p-4 space-y-2">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`block px-2 py-1 rounded hover:bg-gray-100 ${
            pathname === href ? "font-semibold" : ""
          }`}
        >
          {label}
        </Link>
      ))}
    </aside>
  )
}
