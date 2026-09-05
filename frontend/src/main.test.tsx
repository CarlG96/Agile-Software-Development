import { afterEach, describe, expect, it, vi } from "vitest";

const render = vi.hoisted(() => vi.fn());
const createRoot = vi.hoisted(() => vi.fn(() => ({ render })));

vi.mock("react-dom/client", () => ({
  default: { createRoot },
  createRoot,
}));

vi.mock("./App", () => ({
  App: () => <div>App mounted</div>,
}));

describe("main", () => {
  afterEach(() => {
    vi.resetModules();
    createRoot.mockClear();
    render.mockClear();
    document.body.innerHTML = "";
  });

  it("mounts the app into the root element", async () => {
    const root = document.createElement("div");
    root.id = "root";
    document.body.append(root);

    await import("./main");

    expect(createRoot).toHaveBeenCalledWith(root);
    expect(render).toHaveBeenCalledOnce();
  });
});