/** A step number inside a hand-drawn brass circle. */
export function CircledNumber({ n }: { n: string }) {
  return (
    <span className="relative inline-flex h-11 w-11 items-center justify-center">
      <svg
        viewBox="0 0 44 44"
        className="absolute inset-0 h-full w-full"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M22 4.5 C32 3.8, 40.6 11, 40 22 C39.5 32.6, 32 40.4, 21.5 40 C11 39.6, 3.6 31.4, 4 21.5 C4.4 11.4, 12 5.2, 22 4.5 Z"
          stroke="var(--brass)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <span
        className="num relative text-[15px]"
        style={{ color: "var(--brass)" }}
      >
        {n}
      </span>
    </span>
  );
}
