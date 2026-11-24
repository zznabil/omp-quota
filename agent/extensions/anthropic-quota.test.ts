import { describe, expect, test } from "bun:test";
import { classifyUsage, parseQuota } from "./anthropic-quota";

const usage = {
	reports: [
		{
			limits: [
				{ scope: { windowId: "5h" }, amount: { remaining: 96 }, window: { resetsAt: 5000 } },
				{ scope: { windowId: "7d" }, amount: { remaining: 99 }, window: { resetsAt: 7000 } },
				{ scope: { windowId: "7d", tier: "fable" }, amount: { remaining: 1 }, window: { resetsAt: 9000 } },
			],
			resetCredits: {
				availableCount: 1,
				credits: [{ status: "available", expiresAt: "2026-12-10T22:00:00.000Z" }],
			},
		},
	],
};

describe("parseQuota", () => {
	test("reads 5h and 7d windows, ignoring tiered limits, plus banked resets", () => {
		expect(parseQuota(usage)).toEqual({
			fiveHour: { remaining: 96, resetsAt: 5000 },
			weekly: { remaining: 99, resetsAt: 7000 },
			bankedResets: { availableCount: 1, expiresAt: Date.parse("2026-12-10T22:00:00.000Z") },
		});
	});

	test("returns null when no supported values exist", () => {
		expect(parseQuota({ reports: [{ limits: [] }] })).toBeNull();
	});
});

describe("classifyUsage", () => {
	test("hides the entry when the provider has no accounts", () => {
		expect(classifyUsage({ reports: [], accountsWithoutUsage: [] })).toEqual({ kind: "absent" });
		expect(classifyUsage({})).toEqual({ kind: "absent" });
	});

	test("reports no data for a logged-in account without limits", () => {
		expect(classifyUsage({ reports: [], accountsWithoutUsage: [{ provider: "anthropic" }] })).toEqual({
			kind: "nodata",
		});
	});

	test("returns the quota when limits exist", () => {
		expect(classifyUsage(usage).kind).toBe("ok");
	});
});
