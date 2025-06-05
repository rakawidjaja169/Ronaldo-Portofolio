"use client"

import { useEffect, useState, useRef } from "react"
import { useInView } from "framer-motion"

export function useScrollAnimation(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: threshold })

  return { ref, isInView }
}

export function useParallax(speed = 0.5) {
  const [offset, setOffset] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return

      const scrollY = window.scrollY
      const elementTop = ref.current.getBoundingClientRect().top + scrollY
      const relativeScroll = scrollY - elementTop

      setOffset(relativeScroll * speed)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [speed])

  return { ref, style: { transform: `translateY(${offset}px)` } }
}

export function useSequence(delay = 0.1, staggerChildren = 0.1) {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay,
        staggerChildren,
        delayChildren: delay,
      },
    },
  }
}

export function useStaggerItem(direction = "up", distance = 20) {
  const variants = {
    up: {
      hidden: { y: distance, opacity: 0 },
      visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 100, damping: 12 },
      },
    },
    down: {
      hidden: { y: -distance, opacity: 0 },
      visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 100, damping: 12 },
      },
    },
    left: {
      hidden: { x: -distance, opacity: 0 },
      visible: {
        x: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 100, damping: 12 },
      },
    },
    right: {
      hidden: { x: distance, opacity: 0 },
      visible: {
        x: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 100, damping: 12 },
      },
    },
    scale: {
      hidden: { scale: 0.8, opacity: 0 },
      visible: {
        scale: 1,
        opacity: 1,
        transition: { type: "spring", stiffness: 100, damping: 12 },
      },
    },
  }

  return variants[direction as keyof typeof variants]
}
