"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Calendar,
  FileText,
  User,
  CalendarDays,
  Users,
  Mic,
  type LucideIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { LogoutButton } from "@/components/LogoutButton"
import { cn } from "@/lib/utils"

export type MenuItem = {
  title: string
  href: string
  icon: LucideIcon
}

export type DashboardSidebarProps = {
  title: string
  titleHref: string
  titleColor: string
  menuItems: MenuItem[]
  activeColor: string
}

export function DashboardSidebar({
  title,
  titleHref,
  titleColor,
  menuItems,
  activeColor,
}: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="">
          <Link
            href={titleHref}
            className={cn(
              "text-xl font-bold",
              titleColor === "blue" && "text-blue-600 dark:text-blue-400",
              titleColor === "teal" && "text-teal-600 dark:text-teal-400"
            )}
          >
            {title}
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        isActive &&
                        titleColor === "blue" &&
                        "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
                        isActive &&
                        titleColor === "teal" &&
                        "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-4">
          <LogoutButton />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

// Pre-configured sidebars for patient and doctor
export const patientMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/patient",
    icon: LayoutDashboard,
  },
  {
    title: "Appointments",
    href: "/patient/appointments",
    icon: Calendar,
  },
  {
    title: "Documents",
    href: "/patient/documents",
    icon: FileText,
  },
  {
    title: "Profile",
    href: "/patient/profile",
    icon: User,
  },
]

export const doctorMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/doctor",
    icon: LayoutDashboard,
  },
  {
    title: "Recording",
    href: "/doctor/recording",
    icon: Mic,
  },
  {
    title: "Schedule",
    href: "/doctor/schedule",
    icon: CalendarDays,
  },
  {
    title: "Patients",
    href: "/doctor/patients",
    icon: Users,
  },
]

