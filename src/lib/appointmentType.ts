export type AppointmentType = "odontologia" | "harmonizacao" | "ambos";

const appointmentTypes = new Set<AppointmentType>(["odontologia", "harmonizacao", "ambos"]);

export const normalizeAppointmentType = (value: unknown): AppointmentType =>
    typeof value === "string" && appointmentTypes.has(value as AppointmentType)
        ? value as AppointmentType
        : "odontologia";
