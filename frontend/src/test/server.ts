import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export const server = setupServer(
	http.get("/api/staff/me/leave-balance", () => HttpResponse.json([])),
	http.get("/api/staff/me/leave-requests", () => HttpResponse.json([])),
);
