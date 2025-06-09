import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export function BackToHome() {
  return (
    <Link
      href="/"
      className="absolute top-4 left-4 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
    >
      <ChevronLeft className="h-4 w-4" />
      Back to Home
    </Link>
  );
}
