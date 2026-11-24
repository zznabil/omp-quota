import { describe, expect, test } from "bun:test";
import { classifyUsage, parseQuota } from "./openai-quota";

const usage = {
	reports: [
		{
			limits: [
				{ scope: { windowId: "7d" }, amount: { remaining: 70 }, window: { resetsAt: 7000 } },
				{ scope: { windowId: "7d", tier: "other" }, amount: { remaining: 1 }, window: { resetsAt: 8000 } },
			],
			resetCredits: {
				availableCount: 2,
				credits: [
					{ status: "available", expiresAt: "2026-09-21T00:00:00Z" },
					{ status: "available", expiresAt: "2026-09-20T00:00:00Z" },
					{ status: "available", expiresAt: "invalid" },
					{ status: "used", expiresAt: "2026-09-01T00:00:00Z" },
				],
			},
		},
	],
};

describe("parseQuota", () => {
	test("reads the untiered Codex weekly window and banked resets", () => {
		expect(parseQuota(usage)).toEqual({
			codexWeekly: { remaining: 70, resetsAt: 7000 },
			bankedResets: { availableCount: 2, expiresAt: Date.parse("2026-09-20T00:00:00Z") },
		});
	});

	test("auto-detects the untiered 5h window on plans below Pro and ignores tiered 5h limits", () => {
		const lowerPlan = {
			reports: [
				{
					limits: [
						{ scope: { windowId: "5h" }, amount: { remaining: 91.4 }, window: { resetsAt: 5000 } },
						{ scope: { windowId: "5h", tier: "other" }, amount: { remaining: 3 }, window: { resetsAt: 6000 } },
						{ scope: { windowId: "7d" }, amount: { remaining: 70 }, window: { resetsAt: 7000 } },
					],
				},
			],
		};
		expect(parseQuota(lowerPlan)).toEqual({
			codexFiveHour: { remaining: 91, resetsAt: 5000 },
			codexWeekly: { remaining: 70, resetsAt: 7000 },
			bankedResets: undefined,
		});
		expect(parseQuota(usage)?.codexFiveHour).toBeUndefined();
	});

	test("keeps zero banked resets available to render", () => {
		expect(parseQuota({ reports: [{ resetCredits: { availableCount: 0, credits: [] } }] })).toEqual({
			bankedResets: { availableCount: 0, expiresAt: undefined },
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
		expect(classifyUsage({ reports: [], accountsWithoutUsage: [{ provider: "openai-codex" }] })).toEqual({
			kind: "nodata",
		});
		expect(classifyUsage({ reports: [{ limits: [] }] })).toEqual({ kind: "nodata" });
	});

	test("returns the quota when limits exist", () => {
		expect(classifyUsage(usage).kind).toBe("ok");
	});
});
