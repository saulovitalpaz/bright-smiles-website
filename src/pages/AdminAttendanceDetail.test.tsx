import { describe, expect, it } from "vitest";
import { normalizeAppointmentResponse } from "./AdminAttendanceDetail";

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
                            targets: [{ kind: "surface", face: "top", region: "entire" }],
                        }),
                    ]),
                },
            },
        });
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
});
