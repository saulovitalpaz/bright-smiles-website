import {
  getFaceLabels,
  type FaceKey,
  type ToothData,
} from "@/components/admin/attendance/odontogram/odontogramModel";

export function htmlToPlainText(content: string): string {
  return content
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/(p|div|li|h[1-6]|ul|ol)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export function getPdfOdontogramSummary(
  data: Record<string, ToothData>,
): string[] {
  return Object.keys(data)
    .sort((left, right) => Number(left) - Number(right))
    .flatMap((toothKey) => {
      const toothNumber = Number(toothKey);
      const tooth = data[toothKey];
      const labels = getFaceLabels(toothNumber);
      const details: string[] = [];

      if (tooth.status !== "Saudável") details.push(tooth.status);
      Object.entries(tooth.faces ?? {}).forEach(([face, faceData]) => {
        if (faceData && faceData.status !== "Saudável") {
          details.push(`${labels[face as FaceKey]}: ${faceData.status}`);
        }
      });
      if (tooth.notes?.trim()) details.push(tooth.notes.trim());

      return details.length ? [`${toothKey}: ${details.join("; ")}`] : [];
    });
}
