"use client";

import { useState, FormEvent, useEffect } from "react";
import { motion } from "motion/react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface SearchFormProps {
  onSearch: (query: string) => void;
  loading: boolean;
  initialQuery?: string;
  externalQuery?: string;
}

export const SearchForm = ({
  onSearch,
  loading,
  initialQuery = "",
  externalQuery = "",
}: SearchFormProps) => {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    if (externalQuery) {
      setQuery(externalQuery);
    }
  }, [externalQuery]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="relative"
    >
      <div className="relative group">
        <div className="absolute inset-0 bg-linear-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-focus-within:blur-2xl transition-all duration-500" />
        <div className="relative flex items-center bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden focus-within:border-blue-500/50 transition-all duration-300">
          <Search className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Flights from JFK to LHR on July 20 for 2 people"
            className="border-0 bg-transparent focus:ring-0 text-sm sm:text-base"
            disabled={loading}
            aria-label="Search flights"
          />
          <Button type="submit" loading={loading} size="md" className="m-1.5">
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>
    </motion.form>
  );
};
