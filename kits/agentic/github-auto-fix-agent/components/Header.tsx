"use client";

import { motion } from "framer-motion";
import { Bot, Github, Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="relative mb-14 text-center flex flex-col items-center">
      {/* Animated icon */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative mb-6"
      >
        <div className="h-20 w-20 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25 rotate-3 hover:rotate-0 transition-transform duration-300">
          <Bot className="w-10 h-10 text-white drop-shadow-sm" />
        </div>
        {/* Floating accent badges */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute -top-2 -right-2 h-7 w-7 bg-white border border-primary-200 rounded-full flex items-center justify-center shadow-md"
        >
          <Github className="w-3.5 h-3.5 text-text-primary" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 4, 0] }}
          transition={{
            repeat: Infinity,
            duration: 2.5,
            ease: "easeInOut",
            delay: 0.5,
          }}
          className="absolute -bottom-1 -left-2 h-6 w-6 bg-primary-100 border border-primary-200 rounded-full flex items-center justify-center shadow-sm"
        >
          <Sparkles className="w-3 h-3 text-primary-700" />
        </motion.div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="text-4xl md:text-5xl font-extrabold tracking-tight text-text-primary mb-4"
      >
        GitHub{" "}
        <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 bg-clip-text text-transparent">
          Auto Fix
        </span>{" "}
        Agent
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="text-base md:text-lg text-text-secondary max-w-xl mx-auto leading-relaxed"
      >
        Provide a GitHub issue URL and a file path. Our intelligent agent will
        analyze the root cause and generate a fix. You can then create a Pull
        Request with one click.
      </motion.p>
    </header>
  );
}
