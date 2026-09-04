import { requireAdmin } from "@/lib/api/guards";
import { fail } from "@/lib/api/respond";
import { csvFilename } from "@/lib/csv";
import { validationFailed } from "@/lib/errors";
import { EXPORT_FORMATS, buildExport, isExportFormat } from "@/lib/services/export-service";

/** Returns a CSV attachment rather than the usual JSON envelope. */
export async function GET(request: Request) {
  try {
    await requireAdmin();

    const requested = new URL(request.url).searchParams.get("format") ?? "students";
    if (!isExportFormat(requested)) {
      throw validationFailed(`format must be one of: ${EXPORT_FORMATS.join(", ")}`);
    }

    const csv = await buildExport(requested);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${csvFilename(`section-${requested}`)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return fail(error);
  }
}
