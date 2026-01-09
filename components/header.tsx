"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, Menu, X } from "lucide-react"
import { useState } from "react"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg text-foreground">Contable Bot</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#caracteristicas"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Características
            </Link>
            <Link href="#precios" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Precios
            </Link>
            <Link href="#reviews" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Testimonios
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Comenzar Ahora</Button>
            </Link>
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              <Link href="#caracteristicas" className="text-sm text-muted-foreground hover:text-foreground">
                Características
              </Link>
              <Link href="#precios" className="text-sm text-muted-foreground hover:text-foreground">
                Precios
              </Link>
              <Link href="#reviews" className="text-sm text-muted-foreground hover:text-foreground">
                Testimonios
              </Link>
              <div className="flex flex-col gap-2 pt-4">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="w-full">
                    Comenzar Ahora
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
