"use client"

import { Briefcase } from "lucide-react"
import { motion } from "framer-motion"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AnimatedSection } from "@/components/ui/animated-section"
import { StaggeredList } from "@/components/ui/staggered-list"
import { HoverCard } from "@/components/ui/hover-card"

export function ExperienceSection() {
  const experienceData = [
    {
      title: "Senior Software Engineer",
      company: "Google",
      period: "2020 - Present",
      description:
        "Lead developer for Google Cloud Platform services. Architected and implemented scalable microservices using Kubernetes and Docker. Improved system performance by 40% through optimization and refactoring.",
      skills: ["React", "Node.js", "Kubernetes", "Go", "Cloud Architecture"],
    },
    {
      title: "Software Engineer",
      company: "Microsoft",
      period: "2018 - 2020",
      description:
        "Worked on the Azure team developing cloud infrastructure services. Implemented CI/CD pipelines and automated testing frameworks. Contributed to open-source projects and internal developer tools.",
      skills: ["TypeScript", "C#", "Azure", "DevOps", "CI/CD"],
    },
    {
      title: "Software Development Intern",
      company: "Amazon",
      period: "Summer 2017",
      description:
        "Developed features for the Amazon Web Services console. Implemented responsive UI components and integrated with backend services.",
      skills: ["JavaScript", "AWS", "React", "Java"],
    },
  ]

  return (
    <section id="experience" className="py-12">
      <AnimatedSection>
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 20, 0] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 4 }}
          >
            <Briefcase className="h-8 w-8 text-orange-500" />
          </motion.div>
          Experience
        </h2>
      </AnimatedSection>

      <StaggeredList className="grid gap-6" delay={0.3} staggerDelay={0.2}>
        {experienceData.map((item, index) => (
          <HoverCard key={index}>
            <Card className="overflow-hidden border-2 border-transparent transition-all duration-300">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.company}</CardDescription>
                  </div>
                  <Badge className="bg-orange-500">{item.period}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{item.description}</p>
                <motion.div
                  className="mt-4 flex flex-wrap gap-2"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  {item.skills.map((skill, skillIndex) => (
                    <motion.div
                      key={skillIndex}
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Badge variant="outline" className="border-orange-500 text-orange-500">
                        {skill}
                      </Badge>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </HoverCard>
        ))}
      </StaggeredList>
    </section>
  )
}
