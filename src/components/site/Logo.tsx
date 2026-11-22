import { Link } from "@tanstack/react-router";

export function Logo({ tone = "default" }: { tone?: "default" | "light" }) {
  return (
    <Link to="/" className="group inline-flex items-center gap-2.5">
      <span className="relative grid size-9 place-items-center rounded-full bg-gradient-terracotta shadow-warm">
        <svg viewBox="0 0 32 32" className="size-5 text-primary-foreground" aria-hidden="true">
          <path
            d="M6 22c3-7 7-10 10-10s7 3 10 10M10 22c2-4 4-6 6-6s4 2 6 6M16 6v4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="16" cy="25" r="1.6" fill="currentColor" />
        </svg>
      </span>
      <span
        className={`font-display text-xl font-semibold tracking-tight ${tone === "light" ? "text-earth-foreground" : "text-foreground"}`}
      >
        Craft<span className="text-primary">Bridge</span>
      </span>
    </Link>
  );
}
