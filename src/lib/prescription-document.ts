import {
  getFaceLabels,
  getConditionDisplayName,
  normalizeOdontogram,
  type FaceKey,
  type OdontogramData,
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

export function getPdfOdontogramSummary(data: OdontogramData): string[] {
  const normalized = normalizeOdontogram(data);
  return Object.keys(normalized.teeth)
    .sort((left, right) => Number(left) - Number(right))
    .flatMap((toothKey) => {
      const toothNumber = Number(toothKey);
      const tooth = normalized.teeth[toothKey];
      const labels = getFaceLabels(toothNumber);
      const details: string[] = [];

      tooth.conditions.forEach((condition) => condition.targets.forEach((target) => {
        const targetLabel = target.kind === "tooth" ? "dente inteiro" : `${labels[target.face as FaceKey]} - ${target.region === "incisalOcclusal" ? "oclusal/incisal" : target.region === "middle" ? "média" : target.region === "cervical" ? "cervical" : "face inteira"}`;
        details.push(`${getConditionDisplayName(condition.type)} ${condition.stage} (${targetLabel})`);
      }));
      if (tooth.notes?.trim()) details.push(tooth.notes.trim());

      return details.length ? [`${toothKey}: ${details.join("; ")}`] : [];
    });
}
