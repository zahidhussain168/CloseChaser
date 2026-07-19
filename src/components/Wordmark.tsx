/** The RuledOff wordmark: the name with a double-rule under "off". */
export function Wordmark({ size = 26 }: { size?: number }) {
  return (
    <span
      className="font-display font-semibold leading-none"
      style={{ fontSize: size, color: "var(--ink)" }}
    >
      Ruled
      <span className="relative inline-block">
        Off
        <span
          aria-hidden="true"
          className="absolute left-0 right-0"
          style={{ bottom: -4, height: 3 }}
        >
          <span
            className="absolute left-0 right-0"
            style={{ top: 0, height: 1.5, background: "var(--cleared)" }}
          />
          <span
            className="absolute left-0 right-0"
            style={{ top: 3, height: 1.5, background: "var(--cleared)" }}
          />
        </span>
      </span>
    </span>
  );
}
