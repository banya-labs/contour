export const ease = {
  out: [0.16, 1, 0.3, 1] as const,
  wipe: [0.23, 1, 0.32, 1] as const,
  snap: [0.4, 0, 0.2, 1] as const,
  gentle: [0.25, 0.46, 0.45, 0.94] as const,
};

export const textReveal = {
  hidden: { y: "100%" },
  visible: {
    y: "0%",
    transition: { duration: 0.7, ease: ease.out },
  },
};

export const textStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.1,
    },
  },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: ease.out },
  },
};

export const clipReveal = {
  hidden: { clipPath: "inset(0 0 100% 0)" },
  visible: {
    clipPath: "inset(0 0 0% 0)",
    transition: { duration: 0.8, ease: ease.out },
  },
};

export const sunRise = {
  hidden: { y: 280, opacity: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 1.8,
      ease: ease.out,
      delay: 0.4,
    },
  },
};
