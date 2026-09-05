import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export const server = setupServer(
	http.post("/api/auth/refresh", () => HttpResponse.text("Missing refresh token", { status: 401 })),
	http.post("/api/auth/logout", () => new HttpResponse(null, { status: 204 })),
	http.get("/api/staff/me/leave-balance", () => HttpResponse.json([])),
	http.get("/api/staff/me/leave-requests", () => HttpResponse.json([])),
	http.get("/api/manager/leave-requests/outstanding", () => HttpResponse.json([])),
	http.get("/api/manager/staff/:staffId/leave-balance", () => HttpResponse.json([])),
	http.get("/api/admin/analytics/leave-usage", () => HttpResponse.json({
		totalEmployees: 0,
		requestsByStatus: [],
		daysByTypeAndStatus: [],
		avgRemainingByType: [],
	})),
	http.get("/api/admin/leave-requests/outstanding", () => HttpResponse.json([])),
	http.get("/api/admin/staff", () => HttpResponse.json([])),
);
