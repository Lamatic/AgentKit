"use client";

import * as motion from "motion/react-client";
import Link from "next/link";
import { FileText, Github } from "lucide-react";
import Image from "next/image";
import { delaGothicOne, jost } from "@/app/fonts";

export function Header() {
  return (
    <motion.header
      className="rounded-full fixed top-5 right-0 left-0 px-6 py-4"
      initial={{ y: -12 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-2">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lamatic-logo-azWF3QdrlPsL1hXo285W1A2AQo2Vg9.png"
              alt="Lamatic Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <h1
              className={
                "flex gap-2 items-center text-sm md:text-xl lg:text-2xl font-bold tracking-tight select-none text-white " +
                delaGothicOne.className
              }
            >
              <div>Lamatic</div>
              <div> Generator</div>
            </h1>
          </div>
        </Link>
        <div className="flex gap-4">
          <Link
            href="https://lamatic.ai/docs"
            target="_blank"
            rel="noopener noreferrer"
            className=" hidden md:flex text-sm rounded-full px-4 py-2 text-sky-700 items-center gap-2 shadow-sm"
          >
            <FileText className="h-4 w-4" />
            Docs
          </Link>
          <Link
            href="https://github.com/Lamatic/AgentKit"
            target="_blank"
            rel="noopener noreferrer"
            className=" text-xs md:text-sm px-2 py-2 md:px-4 md:py-2 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Github className="h-4 w-4" />
            GitHub
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
