import { describe, expect, it } from "vitest";
import { formatDateTimeInput, normalizeAppointmentResponse } from "./AdminAttendanceDetail";

describe("normalizeAppointmentResponse", () => {
    it("normalizes legacy odontogram data when loading an appointment", () => {
        const appointment = normalizeAppointmentResponse({
            dentalNotes: {
                "24": {
                    status: "Saudável",
                    notes: "",
                    faces: { top: { status: "Tratado" } },
                },
            },
        });

        expect(appointment.dentalNotes).toMatchObject({
            version: 2,
            dentition: "permanent",
            teeth: {
                "24": {
                    conditions: expect.arrayContaining([
                        expect.objectContaining({
                            type: "legado_tratado",
                            stage: "concluido",
                            targets: [{ kind: "surface", face: "top", region: "entire" }],
                        }),
                    ]),
                },
            },
        });
    });

    it("preserves an existing V2 odontogram when loading an appointment", () => {
        const dentalNotes = {
            version: 2 as const,
            dentition: "permanent" as const,
            teeth: {
                "24": {
                    notes: "Restauração acompanhada",
                    conditions: [{
                        id: "condition-24",
                        category: "restauracao" as const,
                        type: "resina_composta" as const,
                        targets: [{ kind: "surface" as const, face: "top" as const, region: "entire" as const }],
                        stage: "monitorado" as const,
                        notes: "Sem infiltração",
                    }],
                },
            },
        };

        const appointment = normalizeAppointmentResponse({ dentalNotes });

        expect(appointment.dentalNotes).toEqual(dentalNotes);
        expect(appointment.dentalNotes.teeth["24"].conditions).toEqual(dentalNotes.teeth["24"].conditions);
    });

    it("loads a linked patient when nullable appointment fields are returned", () => {
        const appointment = normalizeAppointmentResponse({
            id: 11,
            patientId: null,
            patientName: "",
            cpf: null,
            phone: null,
            patient: {
                id: 7,
                name: "Paciente Cadastrado",
                cpf: "123.456.789-00",
                phone: "11999999999",
            },
            price: null,
            photos: null,
            externalLinks: null,
            dentalNotes: null,
            facialNotes: null,
        });

        expect(appointment.patientId).toBe(7);
        expect(appointment.patientName).toBe("Paciente Cadastrado");
        expect(appointment.cpf).toBe("123.456.789-00");
        expect(appointment.phone).toBe("11999999999");
        expect(appointment.price).toBe("");
        expect(appointment.photos).toEqual([]);
        expect(appointment.externalLinks).toEqual([]);
    });

    it("preserves return date and linked-return state for the consultation form", () => {
        const returnDate = "2026-08-20T16:00:00.000Z";
        const appointment = normalizeAppointmentResponse({
            returnDate,
            returnAppointment: {
                id: 42,
                scheduledAt: returnDate,
                status: "scheduled",
            },
        });

        expect(appointment.returnDate).toBe(returnDate);
        expect(formatDateTimeInput(appointment.returnDate)).toMatch(/^2026-08-20T\d{2}:00$/);
        expect(appointment.returnAppointment).toMatchObject({
            id: 42,
            scheduledAt: returnDate,
            status: "scheduled",
        });
    });
});
