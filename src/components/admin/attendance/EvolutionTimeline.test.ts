import { describe, expect, it } from "vitest";
import { filterHistoricalAppointments } from "./EvolutionTimeline";

describe("filterHistoricalAppointments", () => {
    it("removes the current consultation and keeps history in descending date order", () => {
        const appointments = [
            { id: 1, date: "2026-07-10T10:00:00.000Z" },
            { id: 2, date: "2026-07-15T10:00:00.000Z" },
            { id: 3, date: "2026-07-12T10:00:00.000Z" },
        ];

        expect(filterHistoricalAppointments(appointments, 2).map((item) => item.id)).toEqual([3, 1]);
    });
});
