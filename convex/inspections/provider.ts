import OpenAI from "openai";
import { env } from "../_generated/server";
import { zodTextFormat } from "openai/helpers/zod";
import { Extraction, EXTRACTION_PROMPT, validateExtraction } from "./contract";

// One server-side model configuration point. Never imported by the browser.
export function extractionModel() {
  return env.OPENAI_EXTRACTION_MODEL?.trim() || "gpt-4.1-mini";
}
export class ExtractionFailure extends Error {
  constructor(
    public readonly reason:
      "KEY" | "FILE" | "REFUSAL" | "OUTPUT" | "PROVIDER" | "QUOTA" | "RATE",
  ) {
    super(reason);
  }
}
export async function extractPdf(
  pdfBase64: string,
  model: string,
  client?: OpenAI,
) {
  if (!client && !env.OPENAI_API_KEY) throw new ExtractionFailure("KEY");
  const provider =
    client ??
    new OpenAI({ apiKey: env.OPENAI_API_KEY, timeout: 120_000, maxRetries: 0 });
  // Use the SDK's actual Responses types and strict JSON schema helper.
  const response = await provider.responses
    .create({
      model,
      store: false,
      max_output_tokens: 14000,
      instructions: EXTRACTION_PROMPT,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_file",
              filename: "inspection.pdf",
              file_data: `data:application/pdf;base64,${pdfBase64}`,
            },
            {
              type: "input_text",
              text: "Extract the report's explicit deficiencies with concise supporting source evidence.",
            },
          ],
        },
      ],
      text: { format: zodTextFormat(Extraction, "inspection_extraction") },
    })
    .catch((error: unknown) => {
      if (error instanceof OpenAI.APIError && error.status === 429) {
        throw new ExtractionFailure(
          /quota|billing|balance|credits/i.test(error.message)
            ? "QUOTA"
            : "RATE",
        );
      }
      throw error;
    });
  if (
    response.output.some(
      (item) =>
        item.type === "message" &&
        item.content.some((content) => content.type === "refusal"),
    )
  )
    throw new ExtractionFailure("REFUSAL");
  if (response.status !== "completed" || !response.output_text)
    throw new ExtractionFailure("OUTPUT");
  try {
    return {
      result: validateExtraction(JSON.parse(response.output_text)),
      usage: response.usage
        ? {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
          }
        : undefined,
    };
  } catch {
    throw new ExtractionFailure("OUTPUT");
  }
}
