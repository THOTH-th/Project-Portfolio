import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-3xl font-bold text-fg">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        The page you&apos;re looking for doesn&apos;t exist or may have been
        moved.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-brand px-5 text-sm font-medium text-brand-fg transition hover:brightness-110"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
