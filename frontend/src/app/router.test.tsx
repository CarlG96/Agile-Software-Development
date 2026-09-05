import { describe, expect, it } from "vitest";
import { router } from "./router";

describe("router", () => {
  it("defines public, protected, and fallback routes", () => {
    expect(router.routes.map((route) => route.path)).toEqual([
      "/",
      "/login",
      undefined,
      "*",
    ]);

    expect(
      router.routes[2].children?.flatMap((route) =>
        route.children?.map((childRoute) => childRoute.path) ?? [],
      ),
    ).toEqual(["/staff", "/manager", "/admin"]);
  });
});