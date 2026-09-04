import QRCode from "qrcode";

/**
 * Renders a QR code as a data URL, tinted to match the page rather than the
 * default pure black-on-white.
 */
export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 640,
    color: { dark: "#1a1a1aff", light: "#f5f5f5ff" },
  });
}

/** Reconstructs the public origin from proxy headers. */
export function originFromHeaders(headers: Headers): string {
  const host = headers.get("x-forwarded-host") ?? headers.get("host") ?? "localhost:3000";
  const protocol =
    headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  return `${protocol}://${host}`;
}
