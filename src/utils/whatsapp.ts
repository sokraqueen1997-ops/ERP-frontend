/**
 * Builds a WhatsApp "click to chat" link (wa.me) with a pre-filled message.
 * Opening it launches WhatsApp (mobile app or web) with the message ready —
 * the user still has to press send themselves, and it's text-only (no PDF
 * attachment). This needs no account, no API key, and no cost, which makes
 * it a solid first version; a real WhatsApp Business API integration (fully
 * automatic sending, file attachments) is a bigger project that requires a
 * verified Meta Business account first.
 */
export function buildWhatsAppLink(phone: string | null | undefined, message: string): string | null {
  if (!phone) return null;

  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  // Normalize Saudi numbers: "05XXXXXXXX" -> "9665XXXXXXXX"
  if (digits.startsWith('0')) {
    digits = '966' + digits.slice(1);
  } else if (digits.length === 9 && digits.startsWith('5')) {
    digits = '966' + digits;
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
