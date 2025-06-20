"use client"

import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ExternalLink, Github } from "lucide-react"
import { notFound } from "next/navigation"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { projects } from "@/lib/data"
import { AnimatedSection } from "@/components/ui/animated-section"
import { StaggeredList } from "@/components/ui/staggered-list"
import { ParallaxContainer } from "@/components/ui/parallax-container"

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const project = projects.find((p) => p.slug === params.slug)

  if (!project) {
    notFound()
  }

  return (
    <main className="container px-4 py-12">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
        <Button variant="ghost" asChild className="mb-4 hover:scale-105 transition-transform">
          <Link href="/projects">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <AnimatedSection>
            <h1 className="text-4xl font-bold">{project.title}</h1>
            <p className="text-muted-foreground mt-2">{project.description}</p>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <ParallaxContainer className="aspect-video relative rounded-lg overflow-hidden" speed={0.1}>
              <Image
                src={project.thumbnail || "/placeholder.svg"}
                alt={project.title}
                fill
                className="object-cover"
                priority
              />
            </ParallaxContainer>
          </AnimatedSection>

          <AnimatedSection delay={0.3}>
            <h2 className="text-2xl font-bold">Project Gallery</h2>
            <StaggeredList className="grid gap-4 md:grid-cols-2 mt-4" delay={0.4} staggerDelay={0.15}>
              {project.gallery.map((image, index) => (
                <motion.div
                  key={index}
                  className="aspect-video relative rounded-lg overflow-hidden"
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${project.title} screenshot ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </motion.div>
              ))}
            </StaggeredList>
          </AnimatedSection>

          <AnimatedSection delay={0.5}>
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">About this Project</h2>
                <div className="prose max-w-none dark:prose-invert">
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    viewport={{ once: true }}
                    className="text-foreground"
                  >
                    {project.content}
                  </motion.p>
                </div>
              </div>

              <div className="mt-8">
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  viewport={{ once: true }}
                  className="text-2xl font-bold mb-4"
                >
                  Key Features
                </motion.h3>
                <motion.ul
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  viewport={{ once: true }}
                  className="space-y-3 pl-5 list-disc"
                >
                  {project.features.map((feature, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      viewport={{ once: true }}
                      className="text-foreground"
                    >
                      {feature}
                    </motion.li>
                  ))}
                </motion.ul>
              </div>

              <div className="mt-8">
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  viewport={{ once: true }}
                  className="text-2xl font-bold mb-4"
                >
                  Challenges and Solutions
                </motion.h3>
                <div className="prose max-w-none dark:prose-invert space-y-4">
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    viewport={{ once: true }}
                    className="text-foreground"
                  >
                    One of the main challenges was optimizing performance for large datasets. This was solved by
                    implementing efficient data structures and algorithms, as well as leveraging caching strategies to
                    minimize database queries.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    viewport={{ once: true }}
                    className="text-foreground"
                  >
                    Another challenge was creating an intuitive user interface that could handle complex workflows. Through
                    multiple iterations and user testing, we developed a clean and efficient UI that received positive
                    feedback.
                  </motion.p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>

        <div className="space-y-6">
          <AnimatedSection delay={0.3}>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Project Links</h3>
                  <div className="space-y-2">
                    {project.liveUrl && (
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button
                          asChild
                          variant="outline"
                          className="w-full hover:border-orange-500 hover:text-orange-500 transition-colors"
                        >
                          <Link href={project.liveUrl} target="_blank">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Live Demo
                          </Link>
                        </Button>
                      </motion.div>
                    )}
                    {project.githubUrl && (
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button
                          asChild
                          variant="outline"
                          className="w-full hover:border-orange-500 hover:text-orange-500 transition-colors"
                        >
                          <Link href={project.githubUrl} target="_blank">
                            <Github className="mr-2 h-4 w-4" />
                            Source Code
                          </Link>
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Technologies Used</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.tools.map((tool, index) => (
                      <motion.div
                        key={tool.name}
                        className="flex items-center gap-2 border rounded-md p-2"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        whileHover={{ scale: 1.1, borderColor: "rgba(249, 115, 22, 0.5)" }}
                      >
                        <div className="relative w-5 h-5">
                          <Image
                            src={tool.logo || "/placeholder.svg"}
                            alt={tool.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <span className="text-sm">{tool.name}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                  <h3 className="font-medium mb-2">Project Timeline</h3>
                  <p className="text-sm text-muted-foreground">{project.timeline}</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                  <h3 className="font-medium mb-2">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.categories.map((category, index) => (
                      <motion.div
                        key={category}
                        whileHover={{ scale: 1.1 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 10,
                          delay: 0.7 + index * 0.1
                        }}
                      >
                        <Badge className="bg-orange-500">{category}</Badge>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </AnimatedSection>

          <AnimatedSection delay={0.5}>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium mb-4">Other Projects</h3>
                <StaggeredList className="space-y-4" delay={0.6} staggerDelay={0.1}>
                  {projects
                    .filter((p) => p.slug !== project.slug)
                    .slice(0, 3)
                    .map((p) => (
                      <motion.div
                        key={p.slug}
                        whileHover={{
                          scale: 1.02,
                          backgroundColor: "rgba(249, 115, 22, 0.05)",
                          borderRadius: "0.375rem",
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      >
                        <Link
                          href={`/projects/${p.slug}`}
                          className="flex items-center gap-3 p-2 rounded-md transition-colors"
                        >
                          <div className="relative w-12 h-12 rounded-md overflow-hidden">
                            <Image
                              src={p.thumbnail || "/placeholder.svg"}
                              alt={p.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{p.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                </StaggeredList>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>
      </div>
    </main>
  )
}
