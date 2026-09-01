'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

interface PaginationProps {
  page:       number;
  totalPages: number;
  onPage:     (p: number) => void;
}

export function Pagination({ page, totalPages, onPage }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border">
      <Button
        variant="outline" size="sm"
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
      >
        <ChevronLeft className="h-4 w-4" /> ก่อนหน้า
      </Button>
      <span className="text-xs text-muted-foreground">
        หน้า {page} / {totalPages}
      </span>
      <Button
        variant="outline" size="sm"
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
      >
        ถัดไป <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
