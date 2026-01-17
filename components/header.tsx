"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X, Sparkles } from "lucide-react"
import { useState, useEffect } from "react"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`
      fixed top-0 left-0 right-0 z-50
      transition-all duration-300
      ${scrolled
        ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-border shadow-lg shadow-black/5'
        : 'bg-transparent'
      }
    `}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group relative">
            <div className="w-200 h-60 relative flex items-center justify-center transition-all group-hover:scale-105">
              <Image
                src="/contablebot-logo.png"
                alt="ContableBot"
                width={200}
                height={460}
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: '#caracteristicas', label: 'Características' },
              { href: '#precios', label: 'Precios' },
              { href: '#reviews', label: 'Testimonios' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                className="font-medium hover:bg-muted/50"
              >
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/register">
              <Button className="font-medium bg-gradient-to-r from-primary to-[hsl(262_83%_58%)] hover:shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all">
                <Sparkles className="w-4 h-4 mr-2" />
                Comenzar Gratis
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`
          md:hidden overflow-hidden transition-all duration-300 ease-in-out
          ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="py-4 space-y-1 border-t border-border">
            {[
              { href: '#caracteristicas', label: 'Características' },
              { href: '#precios', label: 'Precios' },
              { href: '#reviews', label: 'Testimonios' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 space-y-2">
              <Link href="/login" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-center font-medium"
                >
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/register" className="block">
                <Button className="w-full justify-center font-medium bg-gradient-to-r from-primary to-[hsl(262_83%_58%)]">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Comenzar Gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
