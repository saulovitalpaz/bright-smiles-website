import type { ClinicalCategory, ClinicalConditionType } from "@/components/admin/attendance/odontogram/odontogramModel";

export interface ClinicalConditionDefinition {
  key: ClinicalConditionType;
  name: string;
  groupKey: ClinicalCategory;
  active: boolean;
}
export interface ClinicalConditionGroup {
  key: ClinicalCategory;
  name: string;
  active: boolean;
  conditions: ClinicalConditionDefinition[];
}
