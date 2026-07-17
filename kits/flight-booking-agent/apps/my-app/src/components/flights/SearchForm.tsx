"use client";

import { useState, FormEvent, useEffect } from "react";
import { motion } from "framer-motion";
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
    >
      <div>
        <div>
          <div />
          <div>
            <Search />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Flights from JFK to LHR on July 20 for 2 people"
              disabled={loading}
            />
            <Button type="submit" loading={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>
      </div>
    </motion.form>
  );
};
