"use client";

import { motion } from "framer-motion";

export function AppLoader() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8
      }
    }
  };

  const dotVariants = {
    pulse: {
      scale: [1, 1.2, 1],
      opacity: [0.6, 1, 0.6],
      transition: {
        duration: 2,
        repeat: Infinity
      }
    }
  };

  return (
    <motion.div
      className="app-loader-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="app-loader-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Orbiting dots background */}
        <motion.div
          className="loader-orbit"
          animate={{ rotate: 360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <motion.div
            className="orbit-dot orbit-dot-1"
            variants={dotVariants}
            animate="pulse"
          />
          <motion.div
            className="orbit-dot orbit-dot-2"
            variants={dotVariants}
            animate="pulse"
            style={{ animationDelay: "0.67s" }}
          />
          <motion.div
            className="orbit-dot orbit-dot-3"
            variants={dotVariants}
            animate="pulse"
            style={{ animationDelay: "1.33s" }}
          />
        </motion.div>

        {/* Center animated circle */}
        <motion.div
          className="loader-center"
          variants={itemVariants}
        >
          <motion.div
            className="loader-pulse-ring"
            animate={{
              scale: [1, 1.4],
              opacity: [1, 0]
            }}
            transition={{
              duration: 1.5,
              ease: "easeOut",
              repeat: Infinity
            }}
          />
          <motion.div
            className="loader-core"
            animate={{
              scale: [1, 0.95, 1],
              boxShadow: [
                "0 0 0 0 rgba(223, 255, 91, 0.7)",
                "0 0 0 10px rgba(223, 255, 91, 0.3)",
                "0 0 0 0 rgba(223, 255, 91, 0)"
              ]
            }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
              repeat: Infinity
            }}
          />
        </motion.div>

        {/* Loading text */}
        <motion.p
          className="loader-text"
          variants={itemVariants}
          animate={{
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity
          }}
        >
          Loading your progress...
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

export function PageLoader() {
  return (
    <motion.div
      className="page-loader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="page-loader-spinner"
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          ease: "linear",
          repeat: Infinity
        }}
      >
        <div className="spinner-segment" />
        <div className="spinner-segment" />
        <div className="spinner-segment" />
        <div className="spinner-segment" />
      </motion.div>
      <motion.p
        className="page-loader-text"
        animate={{
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          duration: 1.5,
          ease: "easeInOut",
          repeat: Infinity
        }}
      >
        Processing...
      </motion.p>
    </motion.div>
  );
}
