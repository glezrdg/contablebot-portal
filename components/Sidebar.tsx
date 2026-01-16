/**
 * Sidebar Component
 *
 * Modern sidebar navigation for desktop screens with glassmorphic design and smooth animations.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  BarChart3,
  Users,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  userRole?: "admin" | "user";
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Control de Calidad",
    href: "/dashboard/qa",
    icon: ShieldCheck,
  },
  {
    name: "Reportes",
    href: "/reportes",
    icon: BarChart3,
  },
  {
    name: "Clientes",
    href: "/clientes",
    icon: Building2,
    adminOnly: true,
  },
  {
    name: "Usuarios",
    href: "/usuarios",
    icon: Users,
    adminOnly: true,
  },
  {
    name: "Configuración",
    href: "/configuracion",
    icon: Settings,
  },
];

export default function Sidebar({ userRole = "user" }: SidebarProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Listen for route changes to show navigation state
  useEffect(() => {
    const handleRouteChangeStart = () => setIsNavigating(true);
    const handleRouteChangeComplete = () => setIsNavigating(false);
    const handleRouteChangeError = () => setIsNavigating(false);

    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);
    router.events.on("routeChangeError", handleRouteChangeError);

    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
      router.events.off("routeChangeError", handleRouteChangeError);
    };
  }, [router]);

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || userRole === "admin"
  );

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return router.pathname === href;
    }
    return router.pathname.startsWith(href);
  };

  return (
    <>
      {/* Sidebar Container */}
      <aside
        className={`
          fixed left-0 top-0 h-screen
          bg-[var(--glass-white)] backdrop-blur-xl
          border-r border-[var(--glass-border)]
          shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]
          dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]
          transition-all duration-300 ease-in-out
          z-40
          ${isCollapsed ? "w-20" : "w-64"}
        `}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--glass-border)]">
          {!isCollapsed && (
            <div className="flex items-center gap-2 animate-fade-in">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center shadow-md">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold text-lg text-foreground">
                ContableBot
              </span>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center shadow-md mx-auto animate-fade-in">
              <FileText className="w-4 h-4 text-primary" />
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`
                  group relative flex items-center gap-3
                  px-3 py-2.5 rounded-lg
                  transition-all duration-200
                  ${
                    active
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-[var(--glass-white)] hover:text-foreground"
                  }
                  ${isCollapsed ? "justify-center" : ""}
                `}
              >
                {/* Active Indicator */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full animate-scale-in" />
                )}

                {/* Icon */}
                <Icon
                  className={`
                    w-5 h-5 flex-shrink-0
                    transition-all duration-200
                    ${active ? "scale-110" : "group-hover:scale-105"}
                  `}
                />

                {/* Label */}
                {!isCollapsed && (
                  <span
                    className={`
                      text-sm font-medium
                      transition-all duration-200
                      ${active ? "font-semibold" : ""}
                    `}
                  >
                    {item.name}
                  </span>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-1.5 bg-slate-900 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                    {item.name}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle Button */}
        <div className="p-3 border-t border-[var(--glass-border)]">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
              w-full flex items-center gap-3
              px-3 py-2.5 rounded-lg
              text-muted-foreground hover:text-foreground
              hover:bg-[var(--glass-white)]
              transition-all duration-200
              ${isCollapsed ? "justify-center" : ""}
            `}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Colapsar</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Spacer to prevent content overlap */}
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${isCollapsed ? "w-20" : "w-64"}
        `}
      />
    </>
  );
}
