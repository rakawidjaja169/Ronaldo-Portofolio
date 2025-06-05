"use client"

import Link from "next/link"
import { Download } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { HeroSection } from "@/components/sections/hero-section"
import { EducationSection } from "@/components/sections/education-section"
import { ExperienceSection } from "@/components/sections/experience-section"
import { ProjectsSection } from "@/components/sections/projects-section"
import { ContactSection } from "@/components/sections/contact-section"
import { AnimatedSection } from "@/components/ui/animated-section"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />

      <div className="container px-4 py-12 md:py-24 space-y-24">
        <EducationSection />
        <ExperienceSection />
        <ProjectsSection />

        <AnimatedSection id="download" className="py-12 text-center">
          <h2 className="text-3xl font-bold mb-8">Download My Information</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild className="bg-orange-500 hover:bg-orange-600 transition-all duration-300">
                <Link href="/files/resume.pdf" download>
                  <Download className="mr-2 h-4 w-4" /> Download CV
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                asChild
                variant="outline"
                className="border-orange-500 text-orange-500 hover:bg-orange-500/10 transition-all duration-300"
              >
                <Link href="/files/contact.vcf" download>
                  <Download className="mr-2 h-4 w-4" /> Download vCard
                </Link>
              </Button>
            </motion.div>
          </div>
        </AnimatedSection>

        <ContactSection />
      </div>
    </main>
  )
}
