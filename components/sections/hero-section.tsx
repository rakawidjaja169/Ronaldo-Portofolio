"use client"

import Image from "next/image"
import Link from "next/link"
import { Github, Linkedin, Twitter } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { ParallaxContainer } from "@/components/ui/parallax-container"

export function HeroSection() {
  return (
    <section className="relative bg-black text-white overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        {/* Dynamic Bouncing Orb */}
        <motion.div 
          className="absolute w-[300px] h-[300px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,140,0,0.7) 0%, rgba(249,115,22,0.3) 50%, rgba(0,0,0,0) 80%)',
            filter: 'blur(50px)',
            zIndex: 1,
            mixBlendMode: 'screen',
            willChange: 'transform, opacity'
          }}
          initial={{
            x: '10%',
            y: '10%',
            opacity: 0.8,
            scale: 1
          }}
          animate={{
            // Random positions with smooth transitions
            x: ['10%', '80%', '20%', '70%', '30%', '60%', '40%', '90%', '20%', '60%', '10%'],
            y: ['10%', '20%', '80%', '30%', '70%', '40%', '60%', '20%', '80%', '30%', '10%'],
            scale: [1, 1.2, 0.8, 1.1, 0.9, 1.3, 0.7, 1.1, 0.8, 1.2, 1]
          }}
          transition={{
            duration: 20, // Total duration for one full cycle
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
            // Add some randomness to the timing
            repeatType: "loop"
          }}
        />
      </div>

      <div className="container relative z-10 px-4 py-24 md:py-32 flex flex-col md:flex-row items-center gap-8">
        <div className="w-full md:w-1/2 space-y-6">
          <motion.h1
            className="text-4xl md:text-6xl font-bold"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Hi, I'm <span className="text-orange-500">Ronaldo Katriel Widjaja</span>
          </motion.h1>

          <motion.h2
            className="text-2xl md:text-3xl font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Software Engineer & Project Lead
          </motion.h2>

          <motion.p
            className="text-lg text-gray-300 max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            I build exceptional and accessible digital experiences for the web. Specialized in full-stack development
            with modern technologies.
          </motion.p>

          <motion.div
            className="flex gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Button asChild className="bg-orange-500 hover:bg-orange-600 transition-all duration-300 hover:scale-105">
              <Link href="#contact">Contact Me</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-orange-500 text-orange-500 hover:bg-orange-500/10 transition-all duration-300 hover:scale-105"
            >
              <Link href="#projects">View Projects</Link>
            </Button>
          </motion.div>

          <motion.div
            className="flex gap-4 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            {[
              { icon: <Github className="h-6 w-6" />, href: "https://github.com", label: "GitHub" },
              { icon: <Linkedin className="h-6 w-6" />, href: "https://linkedin.com", label: "LinkedIn" },
              { icon: <Twitter className="h-6 w-6" />, href: "https://twitter.com", label: "Twitter" },
            ].map((social, index) => (
              <motion.div
                key={social.label}
                whileHover={{ scale: 1.2, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Link
                  href={social.href}
                  target="_blank"
                  className="text-gray-300 hover:text-orange-500 transition-colors"
                >
                  {social.icon}
                  <span className="sr-only">{social.label}</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="w-full md:w-1/2 flex justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.8,
            delay: 0.5,
            type: "spring",
            stiffness: 100,
          }}
        >
          <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-orange-500">
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(249, 115, 22, 0)",
                  "0 0 0 10px rgba(249, 115, 22, 0.3)",
                  "0 0 0 20px rgba(249, 115, 22, 0.1)",
                  "0 0 0 0 rgba(249, 115, 22, 0)",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
              }}
              className="absolute inset-0 rounded-full"
            />
            <Image src="/placeholder.svg?height=320&width=320" alt="Ronaldo Katriel Widjaja" fill className="object-cover" priority />
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent"></div>
    </section>
  )
}
