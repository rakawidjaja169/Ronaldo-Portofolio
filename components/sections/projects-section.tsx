"use client"

import Image from "next/image"
import Link from "next/link"
import { Code } from "lucide-react"
import { motion } from "framer-motion"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { projects } from "@/lib/data"
import { AnimatedSection } from "@/components/ui/animated-section"
import { StaggeredList } from "@/components/ui/staggered-list"

export function ProjectsSection() {
  return (
    <section id="projects" className="py-12">
      <AnimatedSection>
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <motion.div
            animate={{
              rotate: [0, 0, 10, -10, 0],
              scale: [1, 1.1, 1.1, 1],
            }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
          >
            <Code className="h-8 w-8 text-orange-500" />
          </motion.div>
          Projects
        </h2>
      </AnimatedSection>

      <StaggeredList
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        delay={0.3}
        staggerDelay={0.15}
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
                  <p className="text-muted-foreground line-clamp-2">{project.description}</p>
                </CardContent>
                <CardFooter>
                  <div className="flex flex-wrap gap-2">
                    {project.tools.slice(0, 3).map((tool) => (
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
                    {project.tools.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{project.tools.length - 3} more
                      </Badge>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          </Link>
        ))}
      </StaggeredList>
    </section>
  )
}
