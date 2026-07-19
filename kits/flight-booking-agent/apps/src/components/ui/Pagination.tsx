"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Pagination component for navigating through pages of results
 * @param currentPage - Current active page number
 * @param totalPages - Total number of pages
 * @param onPageChange - Callback function when page changes
 * @param className - Optional additional CSS classes
 */
export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className={`flex items-center justify-center gap-2 mt-6 ${className}`}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {getPageNumbers().map((page, index) =>
        typeof page === "number" ? (
          <Button
            key={`page-${page}`}
            variant={page === currentPage ? "primary" : "secondary"}
            size="sm"
            onClick={() => onPageChange(page)}
            className="min-w-9"
            aria-label={`Page ${page}`}
          >
            {page}
          </Button>
        ) : (
          <span key={`ellipsis-${index}`} className="text-slate-500 px-1">
            …
          </span>
        ),
      )}

      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};
