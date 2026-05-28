import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an elite college admissions essay evaluator.

You must respond with ONLY this exact JSON structure and nothing else:
{
  "overall": "write your 2-3 sentence summary here",
  "criteria": {
    "writing": { "score": 7, "feedback": "write specific feedback here" },
    "detail": { "score": 7, "feedback": "write specific feedback here" },
    "voice": { "score": 7, "feedback": "write specific feedback here" },
    "character": { "score": 7, "feedback": "write specific feedback here" }
  }
}

Rules:
- Start your response with { and nothing before it
- End your response with } and nothing after it
- No markdown, no backticks, no explanation
- Scores are integers 1 to 10
- Be specific and constructive in feedback`;

function buildFallback(message: string) {
  return NextResponse.json({
    reply: JSON.stringify({
      overall: message,
      criteria: {
        writing: { score: 0, feedback: message },
        detail: { score: 0, feedback: message },
        voice: { score: 0, feedback: message },
        character: { score: 0, feedback: message },
      },
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    const wordCount = message?.trim().split(/\s+/).filter(Boolean).length ?? 0;
    if (wordCount < 50) {
      return buildFallback(
        "Sorry! Can't evaluate essays under 50 words. Please paste a more complete essay."
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return buildFallback(
        "API key not configured. Please check your .env.local file."
      );
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.2,
        max_tokens: 1500,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Evaluate this essay and return ONLY the JSON object:\n\n${message}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Groq HTTP error:", res.status, err);
      return buildFallback(
        `API error ${res.status}. Please check your configuration.`
      );
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "";

    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");

    if (jsonStart === -1 || jsonEnd === -1) {
      return buildFallback(
        "The AI returned an unreadable response. Please try again."
      );
    }

    const cleaned = raw.slice(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(cleaned);

    if (!parsed.overall || !parsed.criteria) {
      return buildFallback("Unexpected response format. Please try again.");
    }

    for (const key of ["writing", "detail", "voice", "character"]) {
      if (parsed.criteria[key]) {
        parsed.criteria[key].score = Math.min(
          10,
          Math.max(1, Number(parsed.criteria[key].score))
        );
      }
    }

    return NextResponse.json({ reply: JSON.stringify(parsed) });
  } catch (error) {
    console.error("Route error:", error);
    return buildFallback("Something went wrong. Please try again.");
  }
}
