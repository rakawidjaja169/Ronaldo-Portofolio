"use client"

import Link from "next/link"
import Image from "next/image"
import { ChevronLeft } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { projects } from "@/lib/data"
import { AnimatedSection } from "@/components/ui/animated-section"
import { StaggeredList } from "@/components/ui/staggered-list"

export default function ProjectsPage() {
  return (
    <main className="container px-4 py-12">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
        <Button variant="ghost" asChild className="mb-4 hover:scale-105 transition-transform">
          <Link href="/">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </motion.div>

      <AnimatedSection>
        <h1 className="text-4xl font-bold">My Projects</h1>
        <p className="text-muted-foreground mt-2">A collection of my work and personal projects</p>
      </AnimatedSection>

      <StaggeredList
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8"
        delay={0.3}
        staggerDelay={0.1}
        direction="scale"
      >
        {projects.map((project) => (
          <Link key={project.slug} href={`/projects/${project.slug}`} className="block h-full">
            <motion.div
              whileHover={{
                scale: 1.03,
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <Card className="h-full overflow-hidden border-2 border-transparent hover:border-orange-500/50 transition-all duration-300">
                <div className="aspect-video relative overflow-hidden">
                  <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.5 }} className="h-full w-full">
                    <Image
                      src={project.thumbnail || "/placeholder.svg"}
                      alt={project.title}
                      fill
                      className="object-cover"
                    />
                  </motion.div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="text-white font-medium">View Project</span>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle>{project.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{project.description}</p>
                </CardContent>
                <CardFooter>
                  <div className="flex flex-wrap gap-2">
                    {project.tools.map((tool) => (
                      <motion.div
                        key={tool.name}
                        className="flex items-center gap-1"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <div className="relative w-5 h-5">
                          <Image
                            src={tool.logo || "/placeholder.svg"}
                            alt={tool.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{tool.name}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          </Link>
        ))}
      </StaggeredList>
    </main>
  )
}
