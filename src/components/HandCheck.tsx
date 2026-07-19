/** A small hand-drawn-style check for the posting column. */
export function HandCheck({
  color = "var(--cleared)",
  animate = false,
  size = 18,
}: {
  color?: string;
  animate?: boolean;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 13.5 C6 15, 8 18, 9.5 19 C12 15, 15 8.5, 20 5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={
          animate
            ? {
                strokeDasharray: 30,
                strokeDashoffset: 30,
                animation: "checkdraw 260ms ease-out forwards",
              }
            : undefined
        }
      />
    </svg>
  );
}
