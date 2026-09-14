import { describe, expect, it } from "vitest";
import * as printLayout from "./print-layout";

const waitForPrintImages = (printLayout as typeof printLayout & {
  waitForPrintImages?: (root: ParentNode) => Promise<void>;
}).waitForPrintImages;

describe("waitForPrintImages", () => {
  it("waits for incomplete print images before resolving", async () => {
    const root = document.createElement("div");
    const image = document.createElement("img");
    Object.defineProperty(image, "complete", { configurable: true, value: false });
    root.append(image);

    expect(waitForPrintImages).toBeTypeOf("function");
    let resolved = false;
    const pending = waitForPrintImages!(root).then(() => { resolved = true; });
    await Promise.resolve();

    expect(resolved).toBe(false);
    image.dispatchEvent(new Event("load"));
    await pending;
    expect(resolved).toBe(true);
  });
});
