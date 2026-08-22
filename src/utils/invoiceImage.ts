import html2canvas from 'html2canvas';
import { apiFetch } from '../api/client';

/**
 * Fetches the invoice HTML, renders it off-screen, and downloads it as a
 * PNG image file. WhatsApp's free click-to-chat links (wa.me) can only
 * pre-fill text — they can't attach a file automatically — so this gets
 * the invoice image into the person's Downloads folder, ready for them to
 * drag/attach into the WhatsApp chat that opens alongside it. A fully
 * automatic send (zero manual steps) requires the WhatsApp Business API,
 * which needs a verified Meta Business account first.
 */
export async function downloadInvoiceImage(saleId: string, filename: string): Promise<void> {
  const html = await apiFetch<string>(`/sales/${saleId}/invoice`);

  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const styleContent = parsed.querySelector('style')?.textContent ?? '';

  const container = document.createElement('div');
  container.setAttribute('dir', 'rtl');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-9999px';
  container.style.width = '800px';
  container.style.background = '#ffffff';
  container.innerHTML = `<style>${styleContent}</style>${parsed.body.innerHTML}`;
  document.body.appendChild(container);

  try {
    // Give the browser a tick to lay out content and decode the QR code data-URL image.
    await new Promise((resolve) => setTimeout(resolve, 200));

    const canvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    });

    await new Promise<void>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${filename}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
        resolve();
      }, 'image/png');
    });
  } finally {
    document.body.removeChild(container);
  }
}
