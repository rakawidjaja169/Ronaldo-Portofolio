"use client"

import type React from "react"

import { useState } from "react"
import { Mail, Send } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { AnimatedSection } from "@/components/ui/animated-section"
import { ParallaxContainer } from "@/components/ui/parallax-container"

export function ContactSection() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          subject: formData.get("subject"),
          message: formData.get("message"),
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        toast({
          title: "Message sent!",
          description: "Thank you for your message. I'll get back to you soon.",
        })

        // Reset the form
        event.currentTarget.reset()
      } else {
        throw new Error("Failed to send message")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send your message. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="py-12 relative">
      <ParallaxContainer className="absolute inset-0 z-0 pointer-events-none" speed={0.1}>
        <div className="absolute right-0 top-0 w-1/2 h-1/2 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute left-0 bottom-0 w-1/3 h-1/3 bg-orange-500/5 rounded-full blur-3xl" />
      </ParallaxContainer>

      <AnimatedSection className="relative z-10">
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <motion.div
            animate={{
              y: [0, -5, 0],
              rotate: [0, 5, 0],
            }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
          >
            <Mail className="h-8 w-8 text-orange-500" />
          </motion.div>
          Contact Me
        </h2>
      </AnimatedSection>

      <div className="grid md:grid-cols-2 gap-8 relative z-10">
        <AnimatedSection delay={0.3}>
          <h3 className="text-xl font-semibold mb-4">Get in Touch</h3>
          <p className="text-muted-foreground mb-6">
            I'm always open to new opportunities and collaborations. Whether you have a question or just want to say hi,
            I'll try my best to get back to you!
          </p>
          <div className="space-y-4">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              viewport={{ once: true }}
            >
              <h4 className="font-medium">Email</h4>
              <p className="text-muted-foreground">john.doe@example.com</p>
            </motion.div>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              viewport={{ once: true }}
            >
              <h4 className="font-medium">Location</h4>
              <p className="text-muted-foreground">San Francisco, CA</p>
            </motion.div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.5}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <motion.div
                className="space-y-2"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                viewport={{ once: true }}
              >
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="Your name"
                  className="border-2 focus:border-orange-500 transition-all duration-300"
                />
              </motion.div>
              <motion.div
                className="space-y-2"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                viewport={{ once: true }}
              >
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="Your email"
                  className="border-2 focus:border-orange-500 transition-all duration-300"
                />
              </motion.div>
            </div>
            <motion.div
              className="space-y-2"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              viewport={{ once: true }}
            >
              <label htmlFor="subject" className="text-sm font-medium">
                Subject
              </label>
              <Input
                id="subject"
                name="subject"
                required
                placeholder="Subject"
                className="border-2 focus:border-orange-500 transition-all duration-300"
              />
            </motion.div>
            <motion.div
              className="space-y-2"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              viewport={{ once: true }}
            >
              <label htmlFor="message" className="text-sm font-medium">
                Message
              </label>
              <Textarea
                id="message"
                name="message"
                required
                placeholder="Your message"
                rows={5}
                className="border-2 focus:border-orange-500 transition-all duration-300"
              />
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 transition-all duration-300"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Send Message
                  </>
                )}
              </Button>
            </motion.div>
          </form>
        </AnimatedSection>
      </div>
    </section>
  )
}
