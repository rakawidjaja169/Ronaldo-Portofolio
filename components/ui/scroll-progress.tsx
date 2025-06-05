"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion, useScroll, useSpring, useTransform } from "framer-motion"

interface ScrollProgressProps {
  hideDelay?: number
}

export function ScrollProgress({ hideDelay = 2000 }: ScrollProgressProps) {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { scrollYProgress } = useScroll()

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  // Memoized function to handle scroll visibility
  const handleScrollVisibility = useCallback(() => {
    setIsVisible(true)

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Hide progress bar after specified delay of no scrolling
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false)
    }, hideDelay)
  }, [hideDelay])

  useEffect(() => {
    // Check if we're in the browser environment
    if (typeof window === "undefined") return

    // Show initially if page is already scrolled
    if (window.scrollY > 0) {
      handleScrollVisibility()
    }

    // Add scroll event listener
    window.addEventListener("scroll", handleScrollVisibility, { passive: true })

    // Cleanup function
    return () => {
      window.removeEventListener("scroll", handleScrollVisibility)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [handleScrollVisibility])

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 h-1"
      initial={{ opacity: 0, y: -4 }}
      animate={{
        opacity: isVisible ? 1 : 0,
        y: isVisible ? 0 : -4,
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />

      {/* Progress fill */}
      <motion.div
        className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 shadow-lg shadow-orange-500/20"
        style={{
          scaleX,
          transformOrigin: "0%",
        }}
      />

      {/* Glow effect */}
      <motion.div
        className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-orange-400 to-orange-600 blur-sm opacity-30"
        style={{
          scaleX,
          transformOrigin: "0%",
        }}
      />

      {/* Moving highlight */}
      <motion.div
        className="absolute top-0 h-full w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        style={{
          left: useTransform(scrollYProgress, [0, 1], ["-80px", "100%"]),
        }}
        animate={{
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  )
}
