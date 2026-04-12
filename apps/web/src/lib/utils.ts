import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return '—';
  return score.toFixed(1);
}

export function scoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'text-gray-400';
  if (score >= 80) return 'text-green-400';
  if (score >= 65) return 'text-yellow-400';
  if (score >= 50) return 'text-orange-400';
  return 'text-red-400';
}

export function statusBadgeColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-yellow-900 text-yellow-200',
    approved: 'bg-green-900 text-green-200',
    rejected: 'bg-red-900 text-red-200',
    generating: 'bg-blue-900 text-blue-200',
    ready: 'bg-purple-900 text-purple-200',
    published: 'bg-green-800 text-green-100',
    scheduled: 'bg-indigo-900 text-indigo-200',
    failed: 'bg-red-800 text-red-100',
  };
  return map[status] ?? 'bg-gray-800 text-gray-200';
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  return authHeader === expected;
}
