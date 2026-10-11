import OpenAI from "openai";
import { afterEach, expect, test, vi } from "vitest";
import { extractPdf } from "./provider";

const valid = {
  document: {
    inspectionType: null,
    siteName: null,
    inspectionDate: null,
    summary: null,
  },
  findings: [],
};
function provider(overrides: Record<string, unknown> = {}, status = 200) {
  const fetch = vi.fn<typeof globalThis.fetch>(
    async () =>
      new Response(
        JSON.stringify({
          id: "test-response",
          object: "response",
          status: "completed",
          output: [
            {
              type: "message",
              role: "assistant",
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify(valid),
                  annotations: [],
                },
              ],
            },
          ],
          usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
          ...overrides,
        }),
        { status, headers: { "Content-Type": "application/json" } },
      ),
  );
  return {
    client: new OpenAI({
      apiKey: "unit-test-placeholder",
      fetch,
      maxRetries: 0,
    }),
    fetch,
  };
}
afterEach(() => vi.unstubAllEnvs());
test("real SDK boundary builds Responses PDF input and strict structured schema", async () => {
  const { client, fetch } = provider();
  expect(await extractPdf("cGRm", "test-model", client)).toEqual({
    result: valid,
    usage: { inputTokens: 10, outputTokens: 5 },
  });
  const request = JSON.parse(String(fetch.mock.calls[0]?.[1]?.body));
  expect(request).toMatchObject({
    model: "test-model",
    store: false,
    text: {
      format: {
        type: "json_schema",
        strict: true,
        schema: { additionalProperties: false },
      },
    },
  });
  expect(request.input[0].content[0]).toMatchObject({
    type: "input_file",
    filename: "inspection.pdf",
    file_data: "data:application/pdf;base64,cGRm",
  });
  expect(request.tools).toBeUndefined();
});
test("refusal does not yield findings", async () => {
  const { client } = provider({
    output: [
      {
        type: "message",
        content: [{ type: "refusal", refusal: "test refusal" }],
      },
    ],
  });
  await expect(extractPdf("pdf", "test", client)).rejects.toMatchObject({
    reason: "REFUSAL",
  });
});
test.each([
  "not JSON",
  JSON.stringify({ ...valid, untrustedWorkflow: "RESOLVED" }),
  JSON.stringify({ ...valid, findings: [{ title: "invented" }] }),
])("malformed or unexpected model content rejected", async (text) => {
  const { client } = provider({
    output: [{ type: "message", content: [{ type: "output_text", text }] }],
  });
  await expect(extractPdf("pdf", "test", client)).rejects.toMatchObject({
    reason: "OUTPUT",
  });
});
test("incomplete output rejected even with parseable JSON", async () => {
  const { client } = provider({ status: "incomplete" });
  await expect(extractPdf("pdf", "test", client)).rejects.toMatchObject({
    reason: "OUTPUT",
  });
});
test("provider network failure does not produce a result", async () => {
  const { client } = provider(
    { error: { message: "provider unavailable" } },
    503,
  );
  await expect(extractPdf("pdf", "test", client)).rejects.toThrow();
});
test("missing key fails before network", async () => {
  vi.stubEnv("OPENAI_API_KEY", "");
  await expect(extractPdf("pdf", "test")).rejects.toMatchObject({
    reason: "KEY",
  });
});

test.each([
  ["credit_balance_exhausted", "Credit balance exhausted", "QUOTA"],
  ["rate_limit_exceeded", "Rate limit reached", "RATE"],
])("429 %s maps to an actionable safe error", async (code, message, reason) => {
  const { client } = provider({ error: { code, message } }, 429);
  await expect(extractPdf("pdf", "test", client)).rejects.toMatchObject({
    reason,
  });
});
