/**
 * Injects a JSON-LD structured-data block. Rendered server-side so crawlers see
 * it in the initial HTML (no client hydration needed).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Structured data is trusted, build-time content, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
