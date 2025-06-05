"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { useScrollAnimation, useSequence, useStaggerItem } from "@/lib/hooks/use-scroll-animation"

interface StaggeredListProps {
  children: ReactNode
  className?: string
  delay?: number
  staggerDelay?: number
  direction?: "up" | "down" | "left" | "right" | "scale"
  threshold?: number
}

export function StaggeredList({
  children,
  className = "",
  delay = 0.2,
  staggerDelay = 0.1,
  direction = "up",
  threshold = 0.1,
}: StaggeredListProps) {
  const { ref, isInView } = useScrollAnimation(threshold)
  const sequence = useSequence(delay, staggerDelay)
  const item = useStaggerItem(direction)

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={sequence}
      className={className}
    >
      {Array.isArray(children) ? (
        children.map((child, index) => (
          <motion.div key={index} variants={item}>
            {child}
          </motion.div>
        ))
      ) : (
        <motion.div variants={item}>{children}</motion.div>
      )}
    </motion.div>
  )
}
