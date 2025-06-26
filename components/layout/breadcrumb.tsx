"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const pathname = usePathname()

  // Auto-generate breadcrumb from pathname if items not provided
  const breadcrumbItems = items || generateBreadcrumb(pathname)

  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}>
      <Link 
        href="/" 
        className="flex items-center hover:text-primary transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4" />
          {item.href ? (
            <Link 
              href={item.href}
              className="hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}

function generateBreadcrumb(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumb: BreadcrumbItem[] = []

  // Define route mappings
  const routeNames: Record<string, string> = {
    'courses': 'หลักสูตร',
    'employees': 'จัดการพนักงาน',
    'scores': 'คะแนน',
    'tests': 'แบบทดสอบ',
    'admin': 'จัดการระบบ',
    'reports': 'รายงานสถิติ',
    'export': 'Export ข้อมูล',
    'questions': 'คำถาม'
  }

  let currentPath = ''

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const label = routeNames[segment] || segment
    const isLast = index === segments.length - 1

    breadcrumb.push({
      label,
      href: isLast ? undefined : currentPath
    })
  })

  return breadcrumb
}