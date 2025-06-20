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
      title: "Software Engineer & Project Lead",
      company: "Yayasan Pendidikan Pelita Harapan - SDH Head Office",
      period: "March 2023 - Present",
      description: [
        "Defined product roadmaps and led sprint planning for 8+ internal applications, including Data Warehouse, Ticketing System, Asset Management, and Digital Asset Management, aligning delivery with institutional priorities.",
        "Prioritized features using the MoSCoW framework, balancing stakeholder urgency with engineering capacity to ensure timely, high-impact releases.",
        "Launched a new ticketing system with complete logging and reporting, replacing manual tracking and enabling reliable post-launch evaluation and continuous improvement.",
        "Spearheaded delivery of a DRM-enabled Digital Asset Management System with bandwidth-aware compression, improving content security and performance across devices.",
        "Mentored junior developers through code reviews and pair programming, improving team velocity and code quality.",
        "Collaborated with cross-functional teams to gather requirements and translate business needs into technical specifications.",
        "Implemented automated testing and CI/CD pipelines, reducing deployment time by 30% and improving release reliability."
      ],
      skills: ["Vue.js", "React.js", "Node.js", "MySQL", "SQL Server", "Docker", "Laravel", "Project Management", "Agile Methodologies"],
    },
    {
      title: "Software Engineer (Full Stack)",
      company: "Yayasan Pendidikan Pelita Harapan - SDH Head Office",
      period: "March 2022 - February 2023",
      description: [
        "Developed and launched core internal platforms—including Online Admission, LMS, and School Management System—used by thousands across departments, by translating stakeholder requirements into scalable web applications using Laravel, Vue, MySQL, CodeIgniter, and SQL Server.",
        "Participated in agile delivery through sprint planning, backlog grooming, and stand-ups, while leading weekly feedback loops to gather user insights and drive continuous UX and feature improvements.",
        "Optimized database queries and application performance, resulting in 40% faster page load times and improved system responsiveness.",
        "Collaborated with UI/UX designers to implement responsive and accessible interfaces, ensuring optimal user experience across all devices.",
        "Integrated third-party APIs and services to extend platform functionality, including payment gateways and document management systems.",
        "Conducted code reviews and mentored junior developers, fostering knowledge sharing and maintaining code quality standards.",
        "Developed and maintained RESTful APIs to support frontend functionality and mobile applications."
      ],
      skills: ["Laravel", "Vue.js", "MySQL", "SQL Server", "PHP", "CodeIgniter", "RESTful APIs", "Agile Development"],
    },
    {
      title: "Project Manager & Backend Intern",
      company: "PITOO.COOP",
      period: "September 2021 – December 2021",
      description: [
        "Defined MVP scope and prioritized core features—including authentication, user profiles, and real-time multiplayer gameplay—in collaboration with the CTO and CEO.",
        "Led a 3-person development team using Kanban methodology to deliver milestone-based builds and maintain stakeholder alignment throughout the development cycle.",
        "Coordinated backend development and database schema design, ensuring scalable architecture and smooth real-time communication for all players.",
        "Conducted regular playtests and feedback reviews to refine gameplay experience and inform feature adjustments before release.",
        "Implemented real-time game state synchronization using WebSockets, reducing latency by 35% and improving overall game performance.",
        "Created comprehensive API documentation and established development standards to ensure code consistency across the team.",
        "Facilitated daily stand-ups and sprint retrospectives to continuously improve team efficiency and collaboration.",
        "Developed automated testing suites to ensure game stability and reduce post-release bug reports by 45%."
      ],
      skills: ["Node.js", "Supabase", "Scrum", "Kanban", "WebSockets", "Project Management", "Team Leadership", "Agile Methodologies"],
    },
    {
      title: "Assistant Professor",
      company: "Universitas Pelita Harapan (UPH)",
      period: "August 2020 - May 2021",
      description: [
        "Taught and mentored students in Calculus and Operating Systems using real-world applications and iterative assessment, fostering deep understanding, problem-solving skills, and applied technical thinking in a classroom of future engineers.",
        "Developed and delivered comprehensive course materials, including lecture slides, assignments, and hands-on lab exercises that bridged theoretical concepts with practical applications.",
        "Implemented active learning strategies and project-based assessments that increased student engagement and improved average exam scores by 22%.",
        "Provided one-on-one academic advising and mentorship to students, helping them navigate challenging concepts and develop effective study strategies.",
        "Collaborated with faculty members to continuously improve curriculum based on industry trends and student feedback.",
        "Organized and led review sessions and workshops to support student learning outside of regular class hours.",
        "Evaluated and graded students' coursework, providing constructive feedback to facilitate their academic growth.",
        "Stayed current with the latest developments in computer science education and incorporated relevant advancements into course content."
      ],
      skills: ["Calculus", "Operating Systems", "Algorithms", "Teaching", "Curriculum Development", "Student Mentoring", "Academic Assessment"],
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
                {Array.isArray(item.description) ? (
                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                    {item.description.map((desc, i) => (
                      <li key={i}>{desc}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">{item.description}</p>
                )}
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
