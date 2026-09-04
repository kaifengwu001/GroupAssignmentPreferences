import { Card, CardHeader } from "@/components/ui/card";

/** Scannable entry point to project on screen at the start of section. */
export function QrPanel({ url, dataUrl }: { url: string; dataUrl: string }) {
  return (
    <Card className="flex flex-col">
      <CardHeader index="02" title="Scan to join" />

      {/* eslint-disable-next-line @next/next/no-img-element -- inline data URL, nothing to optimise */}
      <img
        src={dataUrl}
        alt={`QR code linking to ${url}`}
        width={320}
        height={320}
        className="mb-6 w-full max-w-[240px] self-start rounded-2xl"
      />

      <p className="label break-all normal-case tracking-[0.06em] text-ink">{url}</p>
      <p className="label mt-3 normal-case tracking-[0.08em] text-ink-faint">
        Project this or drop it in a slide. Anyone on the roster can scan it.
      </p>
    </Card>
  );
}
