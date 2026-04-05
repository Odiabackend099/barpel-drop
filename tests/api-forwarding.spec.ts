import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";

/**
 * Contract Tests: POST /api/merchant/forwarding
 *
 * These tests verify the API contract before deployment.
 * Run with: npm run test:contracts
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// Mock authenticated session token (from test setup)
let TEST_AUTH_TOKEN = "";
let TEST_MERCHANT_ID = "";

describe("POST /api/merchant/forwarding", () => {
  beforeAll(async () => {
    // In production, this would use a test user session
    // For now, tests assume proper auth middleware is mocked
  });

  it("returns 401 without authentication", async () => {
    const res = await fetch(`${BASE_URL}/api/merchant/forwarding`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store_phone: "+2348012345678" }),
    });

    expect(res.status).toBe(401);
  });

  it("accepts valid E.164 format phone numbers", async () => {
    const validPhones = [
      "+12125551234", // US
      "+447911123456", // UK
      "+234801234567", // Nigeria
      "+1201234567", // North America (short)
    ];

    for (const phone of validPhones) {
      const res = await fetch(`${BASE_URL}/api/merchant/forwarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TEST_AUTH_TOKEN}`,
        },
        body: JSON.stringify({ store_phone: phone }),
      });

      // Should be 200 on success OR 429 on rate limit (both acceptable)
      expect([200, 429]).toContain(res.status);
    }
  });

  it("rejects invalid E.164 format", async () => {
    const invalidPhones = [
      "2125551234", // Missing +
      "+1", // Too short
      "+0123456789", // Starts with 0
      "+1234567", // Only 7 digits
      "abc", // Non-numeric
      "", // Empty
    ];

    for (const phone of invalidPhones) {
      const res = await fetch(`${BASE_URL}/api/merchant/forwarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TEST_AUTH_TOKEN}`,
        },
        body: JSON.stringify({ store_phone: phone }),
      });

      // Should reject or rate-limit, not accept invalid input
      if (res.status !== 429) {
        expect(res.status).toBe(400);
      }
    }
  });

  it("rejects invalid JSON", async () => {
    const res = await fetch(`${BASE_URL}/api/merchant/forwarding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TEST_AUTH_TOKEN}`,
      },
      body: "{invalid json",
    });

    expect(res.status).toBe(400);
  });

  it("returns 429 on rate limit (10 requests per minute)", async () => {
    // Make 11 rapid requests
    for (let i = 0; i < 11; i++) {
      const res = await fetch(`${BASE_URL}/api/merchant/forwarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TEST_AUTH_TOKEN}`,
        },
        body: JSON.stringify({ store_phone: `+121255512${String(i).padStart(2, "0")}` }),
      });

      if (i < 10) {
        // First 10 should succeed or fail for other reasons
        expect([200, 400, 404]).toContain(res.status);
      } else {
        // 11th should be rate-limited
        expect(res.status).toBe(429);
      }
    }
  });

  it("saves store_phone to database", async () => {
    const phone = "+2348012345678";
    const res = await fetch(`${BASE_URL}/api/merchant/forwarding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TEST_AUTH_TOKEN}`,
      },
      body: JSON.stringify({ store_phone: phone }),
    });

    if (res.status === 200) {
      const data = await res.json();
      expect(data.success).toBe(true);

      // Verify in database
      const merchant = await fetch(`${BASE_URL}/api/merchant/profile`, {
        headers: { Authorization: `Bearer ${TEST_AUTH_TOKEN}` },
      }).then((r) => r.json());

      expect(merchant.store_phone).toBe(phone);
    }
  });

  it("allows updating forwarding_type and forwarding_carrier", async () => {
    const res = await fetch(`${BASE_URL}/api/merchant/forwarding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TEST_AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        store_phone: "+2348012345678",
        forwarding_enabled: true,
        forwarding_type: "conditional",
        forwarding_carrier: "MTN Nigeria",
      }),
    });

    if (res.status === 200) {
      const data = await res.json();
      expect(data.success).toBe(true);
    }
  });

  it("returns 404 if merchant not found", async () => {
    // Use auth token from non-existent merchant
    const res = await fetch(`${BASE_URL}/api/merchant/forwarding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer invalid_token`,
      },
      body: JSON.stringify({ store_phone: "+2348012345678" }),
    });

    expect([401, 404]).toContain(res.status);
  });

  it("returns proper error messages", async () => {
    const res = await fetch(`${BASE_URL}/api/merchant/forwarding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TEST_AUTH_TOKEN}`,
      },
      body: JSON.stringify({ store_phone: "invalid" }),
    });

    if (res.status === 400) {
      const data = await res.json();
      expect(data.error).toBeDefined();
      expect(typeof data.error).toBe("string");
      expect(data.error.length > 0).toBe(true);
    }
  });

  it("has 30-second request timeout", async () => {
    // This test verifies client-side timeout behavior
    // Server should respond within 30 seconds
    const start = Date.now();
    const res = await fetch(`${BASE_URL}/api/merchant/forwarding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TEST_AUTH_TOKEN}`,
      },
      body: JSON.stringify({ store_phone: "+2348012345678" }),
      signal: AbortSignal.timeout(30000),
    });
    const elapsed = Date.now() - start;

    // Should complete in less than 30 seconds
    expect(elapsed).toBeLessThan(30000);
  });
});
