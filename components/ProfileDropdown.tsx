/**
 * ProfileDropdown Component
 *
 * GitHub-style profile dropdown menu for user actions.
 * Shows user avatar, name, and menu options (Settings, Whop Hub, Logout)
 */

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Settings, LogOut, CreditCard, ChevronDown, PlayCircle } from "lucide-react";

interface ProfileDropdownProps {
  firmName: string;
  userEmail: string;
  manageUrl?: string;
}

export default function ProfileDropdown({
  firmName,
  userEmail,
  manageUrl,
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
      router.push("/");
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/20">
          <span className="text-sm font-bold text-primary">
            {firmName.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* User Name - Hidden on mobile */}
        <span className="hidden lg:block text-sm font-medium text-foreground">
          {firmName}
        </span>

        {/* Chevron Icon */}
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground truncate">
              {firmName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {userEmail}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Tutorial */}
            <Link
              href="/tutorial"
              className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <PlayCircle className="w-4 h-4 text-muted-foreground" />
              <span>Tutorial</span>
            </Link>

            {/* Settings */}
            <Link
              href="/configuracion"
              className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span>Configuración</span>
            </Link>

            {/* Whop Hub / Manage Subscription */}
            {manageUrl ? (
              <a
                href={manageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span>Suscripción</span>
              </a>
            ) : (
              <a
                href="https://whop.com/hub"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span>Whop Hub</span>
              </a>
            )}
          </div>

          {/* Logout Section */}
          <div className="border-t border-border py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
