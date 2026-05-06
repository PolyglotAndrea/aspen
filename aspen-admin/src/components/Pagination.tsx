import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 text-sm text-zinc-400">
      <span>共 {total} 条</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="p-1 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-white">{page} / {totalPages}</span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
