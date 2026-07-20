/** Wordmark with a teal "ruled off" double underline mark. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={"flex items-center gap-2 " + (className ?? "")}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white shadow-brand">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 12.5 9.5 18 20 6.5"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-[18px] font-bold tracking-tight text-text">RuledOff</span>
    </span>
  );
}
