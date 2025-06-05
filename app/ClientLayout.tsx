"use client"

import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import Link from "next/link"
import { Github, Linkedin, Mail, Twitter } from "lucide-react"
import { motion } from "framer-motion"

import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { ScrollProgress } from "@/components/ui/scroll-progress"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const navItems = [
    { name: "Education", href: "/#education" },
    { name: "Experience", href: "/#experience" },
    { name: "Projects", href: "/#projects" },
    { name: "Contact", href: "/#contact" },
  ]

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>John Doe - Software Engineer Portfolio</title>
        <meta
          name="description"
          content="Portfolio website showcasing my projects, skills, and experience as a software engineer."
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen flex-col">
            <ScrollProgress hideDelay={1500} />
            <motion.header
              className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md"
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="container flex h-16 items-center justify-between py-4">
                <motion.div
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Link href="/" className="font-bold text-xl">
                    <span className="text-orange-500">John</span> Doe
                  </Link>
                </motion.div>
                <nav className="hidden md:flex items-center gap-6">
                  {navItems.map((item) => (
                    <motion.div
                      key={item.name}
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-foreground transition-colors relative group"
                      >
                        {item.name}
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all group-hover:w-full" />
                      </Link>
                    </motion.div>
                  ))}
                </nav>
                <div className="flex items-center gap-2">
                  {[
                    { icon: <Github className="h-5 w-5" />, href: "https://github.com", label: "GitHub" },
                    { icon: <Linkedin className="h-5 w-5" />, href: "https://linkedin.com", label: "LinkedIn" },
                    { icon: <Twitter className="h-5 w-5" />, href: "https://twitter.com", label: "Twitter" },
                  ].map((social) => (
                    <motion.div
                      key={social.label}
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Button asChild variant="ghost" size="icon">
                        <Link href={social.href} target="_blank">
                          {social.icon}
                          <span className="sr-only">{social.label}</span>
                        </Link>
                      </Button>
                    </motion.div>
                  ))}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      asChild
                      className="hidden md:flex bg-orange-500 hover:bg-orange-600 transition-all duration-300"
                    >
                      <Link href="/#contact">
                        <Mail className="mr-2 h-4 w-4" />
                        Contact Me
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.header>
            <div className="flex-1">{children}</div>
            <footer className="border-t py-6 md:py-0">
              <div className="container flex flex-col md:flex-row items-center justify-between gap-4 md:h-16">
                <p className="text-sm text-muted-foreground">
                  © {new Date().getFullYear()} John Doe. All rights reserved.
                </p>
                <div className="flex items-center gap-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/#">Back to top</Link>
                    </Button>
                  </motion.div>
                </div>
              </div>
            </footer>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
