"use client"

import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

interface DashboardContentProps {
  children: React.ReactNode
}

export function DashboardContent({ children }: DashboardContentProps) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <div
      className={cn(
        "flex flex-col  transition-[margin] duration-200 ease-linear",
        "md:ml-[var(--sidebar-width)]",
        isCollapsed && "md:ml-0"
      )}
    >
      {children}
    </div>
  )
}

