import { useCallback, useEffect, useRef, useState } from "react";

export type ClinicalAutosaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

interface UseClinicalAutosaveOptions<T> {
    enabled: boolean;
    snapshot: T;
    save: (snapshot: T) => Promise<void>;
    delayMs?: number;
}

interface ClinicalAutosaveResult<T> {
    status: ClinicalAutosaveStatus;
    pending: boolean;
    flush: () => Promise<boolean>;
    confirm: (snapshot: T) => void;
}

export function useClinicalAutosave<T>({
    enabled,
    snapshot,
    save,
    delayMs = 1000,
}: UseClinicalAutosaveOptions<T>): ClinicalAutosaveResult<T> {
    const snapshotKey = JSON.stringify(snapshot);
    const [status, setStatus] = useState<ClinicalAutosaveStatus>("idle");
    const [pending, setPending] = useState(false);
    const mountedRef = useRef(true);
    const enabledRef = useRef(enabled);
    const wasEnabledRef = useRef(false);
    const saveRef = useRef(save);
    const latestSnapshotRef = useRef(snapshot);
    const latestKeyRef = useRef(snapshotKey);
    const confirmedKeyRef = useRef(snapshotKey);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const activeSaveRef = useRef<{ key: string; promise: Promise<boolean> } | null>(null);

    saveRef.current = save;
    enabledRef.current = enabled;

    const clearTimer = useCallback(() => {
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const drainLatest = useCallback(async (): Promise<boolean> => {
        clearTimer();
        if (!enabledRef.current) return true;

        while (latestKeyRef.current !== confirmedKeyRef.current) {
            if (activeSaveRef.current) {
                const activeSave = activeSaveRef.current;
                const activeSucceeded = await activeSave.promise;
                if (!activeSucceeded) {
                    if (latestKeyRef.current !== activeSave.key) continue;
                    return false;
                }
                continue;
            }

            const submittedSnapshot = latestSnapshotRef.current;
            const submittedKey = latestKeyRef.current;
            if (mountedRef.current) setStatus("saving");

            const request = saveRef.current(submittedSnapshot)
                .then(() => {
                    confirmedKeyRef.current = submittedKey;
                    if (mountedRef.current) {
                        const hasNewerVersion = latestKeyRef.current !== submittedKey;
                        setPending(hasNewerVersion);
                        setStatus(hasNewerVersion ? "pending" : "saved");
                    }
                    return true;
                })
                .catch(() => {
                    if (mountedRef.current) {
                        setPending(true);
                        setStatus("error");
                    }
                    return false;
                })
                .finally(() => {
                    if (activeSaveRef.current?.promise === request) activeSaveRef.current = null;
                });

            activeSaveRef.current = { key: submittedKey, promise: request };
            const succeeded = await request;
            if (!succeeded) {
                if (latestKeyRef.current !== submittedKey) continue;
                return false;
            }
        }

        if (mountedRef.current) setPending(false);
        return true;
    }, [clearTimer]);

    useEffect(() => {
        if (!enabled) {
            clearTimer();
            wasEnabledRef.current = false;
            latestSnapshotRef.current = snapshot;
            latestKeyRef.current = snapshotKey;
            confirmedKeyRef.current = snapshotKey;
            setPending(false);
            setStatus("idle");
            return;
        }

        if (!wasEnabledRef.current) {
            wasEnabledRef.current = true;
            latestSnapshotRef.current = snapshot;
            latestKeyRef.current = snapshotKey;
            confirmedKeyRef.current = snapshotKey;
            setPending(false);
            setStatus("idle");
            return;
        }

        if (snapshotKey === latestKeyRef.current) return;
        latestSnapshotRef.current = snapshot;
        latestKeyRef.current = snapshotKey;
        setPending(true);
        setStatus("pending");
        clearTimer();
        timerRef.current = setTimeout(() => {
            timerRef.current = null;
            void drainLatest();
        }, delayMs);
    }, [clearTimer, delayMs, drainLatest, enabled, snapshot, snapshotKey]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            clearTimer();
        };
    }, [clearTimer]);

    const confirm = useCallback((confirmedSnapshot: T) => {
        clearTimer();
        const confirmedKey = JSON.stringify(confirmedSnapshot);
        latestSnapshotRef.current = confirmedSnapshot;
        latestKeyRef.current = confirmedKey;
        confirmedKeyRef.current = confirmedKey;
        setPending(false);
        setStatus("saved");
    }, [clearTimer]);

    return { status, pending, flush: drainLatest, confirm };
}
