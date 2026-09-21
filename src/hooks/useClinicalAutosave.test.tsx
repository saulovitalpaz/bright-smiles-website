import { act, renderHook } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useClinicalAutosave } from "./useClinicalAutosave";

interface ClinicalSnapshot {
    dentalNotes: { note: string };
    facialNotes: { note: string };
}

const snapshot = (note: string): ClinicalSnapshot => ({
    dentalNotes: { note },
    facialNotes: { note },
});

afterEach(() => {
    vi.useRealTimers();
});

describe("useClinicalAutosave", () => {
    it("starts from the confirmed baseline and debounces only later changes", async () => {
        vi.useFakeTimers();
        const save = vi.fn().mockResolvedValue(undefined);
        const { result, rerender } = renderHook(
            ({ enabled, value }) => useClinicalAutosave({ enabled, snapshot: value, save, delayMs: 1000 }),
            { initialProps: { enabled: false, value: snapshot("new") } },
        );

        rerender({ enabled: false, value: snapshot("draft") });
        await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
        expect(save).not.toHaveBeenCalled();

        rerender({ enabled: true, value: snapshot("loaded") });
        await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
        expect(save).not.toHaveBeenCalled();

        rerender({ enabled: true, value: snapshot("first edit") });
        rerender({ enabled: true, value: snapshot("latest edit") });
        await act(async () => { await vi.advanceTimersByTimeAsync(999); });
        expect(save).not.toHaveBeenCalled();
        await act(async () => { await vi.advanceTimersByTimeAsync(1); });

        expect(save).toHaveBeenCalledTimes(1);
        expect(save).toHaveBeenCalledWith(snapshot("latest edit"));
        expect(result.current).toMatchObject({ pending: false, status: "saved" });
    });

    it("serializes saves and immediately sends the newest edit after an in-flight request", async () => {
        vi.useFakeTimers();
        let releaseFirst: (() => void) | undefined;
        const save = vi.fn()
            .mockImplementationOnce(() => new Promise<void>((resolve) => { releaseFirst = resolve; }))
            .mockResolvedValueOnce(undefined);
        const { result, rerender } = renderHook(
            ({ value }) => useClinicalAutosave({ enabled: true, snapshot: value, save, delayMs: 1000 }),
            { initialProps: { value: snapshot("loaded") } },
        );

        rerender({ value: snapshot("first edit") });
        await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
        expect(save).toHaveBeenCalledTimes(1);

        rerender({ value: snapshot("edit during save") });
        expect(result.current.pending).toBe(true);
        await act(async () => {
            releaseFirst?.();
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(save).toHaveBeenCalledTimes(2);
        expect(save).toHaveBeenLastCalledWith(snapshot("edit during save"));
        await act(async () => { await Promise.resolve(); await Promise.resolve(); });
        expect(result.current).toMatchObject({ pending: false, status: "saved" });
    });

    it("keeps failed data pending and flushes the latest version on retry", async () => {
        vi.useFakeTimers();
        const save = vi.fn()
            .mockRejectedValueOnce(new Error("offline"))
            .mockResolvedValueOnce(undefined);
        const { result, rerender } = renderHook(
            ({ value }) => useClinicalAutosave({ enabled: true, snapshot: value, save, delayMs: 1000 }),
            { initialProps: { value: snapshot("loaded") } },
        );

        rerender({ value: snapshot("unsaved") });
        await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
        expect(result.current).toMatchObject({ pending: true, status: "error" });

        let flushed = false;
        await act(async () => { flushed = await result.current.flush(); });
        expect(flushed).toBe(true);
        expect(save).toHaveBeenCalledTimes(2);
        expect(result.current).toMatchObject({ pending: false, status: "saved" });
    });

    it("sends a newer queued edit even when the older in-flight save fails", async () => {
        vi.useFakeTimers();
        let rejectFirst: ((error: Error) => void) | undefined;
        const save = vi.fn()
            .mockImplementationOnce(() => new Promise<void>((_resolve, reject) => { rejectFirst = reject; }))
            .mockResolvedValueOnce(undefined);
        const { result, rerender } = renderHook(
            ({ value }) => useClinicalAutosave({ enabled: true, snapshot: value, save, delayMs: 1000 }),
            { initialProps: { value: snapshot("loaded") } },
        );

        rerender({ value: snapshot("first edit") });
        await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
        rerender({ value: snapshot("newer edit") });
        let flushResult = false;
        const concurrentFlush = result.current.flush().then((saved) => { flushResult = saved; });
        await act(async () => {
            rejectFirst?.(new Error("offline"));
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
            await concurrentFlush;
        });

        expect(flushResult).toBe(true);
        expect(save).toHaveBeenCalledTimes(2);
        expect(save).toHaveBeenLastCalledWith(snapshot("newer edit"));
        await act(async () => { await Promise.resolve(); await Promise.resolve(); });
        expect(result.current).toMatchObject({ pending: false, status: "saved" });
    });

    it("continues updating status under React Strict Mode", async () => {
        vi.useFakeTimers();
        const save = vi.fn().mockResolvedValue(undefined);
        const wrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>;
        const { result, rerender } = renderHook(
            ({ value }) => useClinicalAutosave({ enabled: true, snapshot: value, save, delayMs: 1000 }),
            { initialProps: { value: snapshot("loaded") }, wrapper },
        );

        rerender({ value: snapshot("strict edit") });
        await act(async () => { await vi.advanceTimersByTimeAsync(1000); });

        expect(save).toHaveBeenCalledWith(snapshot("strict edit"));
        expect(result.current).toMatchObject({ pending: false, status: "saved" });
    });

    it("accepts a snapshot confirmed by a coordinated manual save", () => {
        vi.useFakeTimers();
        const save = vi.fn().mockResolvedValue(undefined);
        const { result, rerender } = renderHook(
            ({ value }) => useClinicalAutosave({ enabled: true, snapshot: value, save, delayMs: 1000 }),
            { initialProps: { value: snapshot("loaded") } },
        );

        const manuallySaved = snapshot("manual save");
        rerender({ value: manuallySaved });
        expect(result.current.pending).toBe(true);
        act(() => result.current.confirm(manuallySaved));

        expect(result.current).toMatchObject({ pending: false, status: "saved" });
        vi.advanceTimersByTime(1000);
        expect(save).not.toHaveBeenCalled();
    });
});
