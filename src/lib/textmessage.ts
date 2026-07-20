import { firstName } from "@/lib/chase";
import type { Item } from "@/lib/types";

/**
 * The message a bookkeeper sends from their OWN phone.
 *
 * RuledOff never sends SMS itself. It writes the words and hands them over, so
 * the text arrives from a number the client already knows, which is the whole
 * point: it reads as a person, not a system.
 *
 * Kept short deliberately. Long texts get truncated by carriers and read as
 * spam, so this is one line of context, the count, and the link.
 */
export function buildTextMessage(params: {
  firmName: string;
  clientName: string;
  monthLabel: string;
  openItems: Item[];
  url: string;
}): string {
  const { firmName, clientName, monthLabel, openItems, url } = params;
  const who = firstName(clientName);
  const n = openItems.length;

  const what =
    n === 1
      ? `1 thing left for the ${monthLabel} books`
      : `${n} things left for the ${monthLabel} books`;

  return [
    `Hi ${who}, ${firmName} here.`,
    `${what}. You can do it from your phone, no login:`,
    url,
  ].join(" ");
}

/**
 * An sms: link that prefills the body.
 *
 * iOS and Android historically disagreed on the separator before `body`.
 * `?&body=` is the form that works on both, which is why it looks odd.
 */
export function smsHref(phone: string | null, body: string): string {
  const number = (phone ?? "").replace(/[^\d+]/g, "");
  return `sms:${number}?&body=${encodeURIComponent(body)}`;
}
