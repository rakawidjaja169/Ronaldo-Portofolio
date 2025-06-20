"use client"

import { GraduationCap } from "lucide-react"
import { motion } from "framer-motion"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AnimatedSection } from "@/components/ui/animated-section"
import { StaggeredList } from "@/components/ui/staggered-list"
import { HoverCard } from "@/components/ui/hover-card"

export function EducationSection() {
  const educationData = [
    {
      degree: "Bachelor of Computer Science",
      institution: "Universitas Pelita Harapan (UPH)",
      period: "2018 - 2022",
      description: "Graduated with GPA 3.57/4.0 (Cum Laude). Focus on software development and computer science fundamentals.",
      skills: ["Algorithms", "Data Structures", "Software Engineering", "Web Development"],
    },
  ]

  return (
    <section id="education" className="py-12">
      <AnimatedSection>
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 5 }}
          >
            <GraduationCap className="h-8 w-8 text-orange-500" />
          </motion.div>
          Education
        </h2>
      </AnimatedSection>

      <StaggeredList className="grid gap-6" delay={0.3} staggerDelay={0.2}>
        {educationData.map((item, index) => (
          <HoverCard key={index}>
            <Card className="overflow-hidden border-2 border-transparent transition-all duration-300">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{item.degree}</CardTitle>
                    <CardDescription>{item.institution}</CardDescription>
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
