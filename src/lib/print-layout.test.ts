import { describe, expect, it, vi } from "vitest";
import { printWhenReady, waitForPrintImages } from "./print-layout";

describe("waitForPrintImages", () => {
  it("waits for incomplete print images before resolving", async () => {
    const root = document.createElement("div");
    const image = document.createElement("img");
    Object.defineProperty(image, "complete", { configurable: true, value: false });
    root.append(image);

    let resolved = false;
    const pending = waitForPrintImages(root).then(() => { resolved = true; });
    await Promise.resolve();

    expect(resolved).toBe(false);
    image.dispatchEvent(new Event("load"));
    await pending;
    expect(resolved).toBe(true);
  });

  it("prints only after the selected target is ready", async () => {
    const root = document.createElement("div");
    const target = document.createElement("section");
    const image = document.createElement("img");
    Object.defineProperty(image, "complete", { configurable: true, value: false });
    target.append(image);
    root.append(target);
    const print = vi.fn();

    const pending = printWhenReady(root, "section", print);
    await Promise.resolve();
    expect(print).not.toHaveBeenCalled();
    image.dispatchEvent(new Event("load"));

    await expect(pending).resolves.toBe(true);
    expect(print).toHaveBeenCalledOnce();
  });

  it("does not print when the target is missing or the flow is aborted", async () => {
    const root = document.createElement("div");
    const print = vi.fn();
    expect(await printWhenReady(root, "section", print)).toBe(false);

    const target = document.createElement("section");
    const image = document.createElement("img");
    Object.defineProperty(image, "complete", { configurable: true, value: false });
    target.append(image);
    root.append(target);
    const controller = new AbortController();
    const pending = printWhenReady(root, "section", print, controller.signal);
    controller.abort();

    await expect(pending).resolves.toBe(false);
    expect(print).not.toHaveBeenCalled();
  });
});
