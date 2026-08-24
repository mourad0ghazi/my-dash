import type { Variants } from 'framer-motion'

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: .45, ease: [0.22, 1, 0.36, 1] } },
}
export const staggerContainer: Variants = {
  hidden: {}, visible: { transition: { staggerChildren: .08, delayChildren: .08 } },
}
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: .96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: .25 } },
  exit: { opacity: 0, scale: .97, y: 6, transition: { duration: .16 } },
}
export const slideInRight: Variants = {
  hidden: { x: 80, opacity: 0 }, visible: { x: 0, opacity: 1 }, exit: { x: 80, opacity: 0 },
}
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: .32 } }, exit: { opacity: 0, y: -5, transition: { duration: .15 } },
}
