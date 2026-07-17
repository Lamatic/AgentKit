"use client";

import { Plane, Sparkles, History } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { APP_CONFIG } from "@/lib/constants";

interface HeaderProps {
  bookingsCount: number;
  onBookingsClick: () => void;
}

export const Header = ({ bookingsCount, onBookingsClick }: HeaderProps) => {
  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <div>
          <div>
            <div>
              <div>
                <Plane />
              </div>
              <div>
                <h1>{APP_CONFIG.name}</h1>
                <p>{APP_CONFIG.tagline}</p>
              </div>
            </div>
            <div>
              <Button onClick={onBookingsClick}>
                <History />
                <span>Bookings</span>
                {bookingsCount > 0 && <span>{bookingsCount}</span>}
              </Button>
              <div>
                <Sparkles />
                <span>AI-powered</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
