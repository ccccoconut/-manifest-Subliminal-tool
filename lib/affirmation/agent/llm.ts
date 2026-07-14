type ChatMessage = { role: "system" | "user"; content: string };

const TIMEOUT_MS = 22_000;

/** 调用 DeepSeek（OpenAI 兼容），强制 JSON 输出并解析。 */
export async function callLLMJson<T>(
  messages: ChatMessage[],
  maxTokens = 900
): Promise<T | null> {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) return null;

  const base = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(
    /\/$/,
    ""
  );
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: "json_object" },
        temperature: 0.85,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error("[agent/llm] DeepSeek error", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    try {
      return JSON.parse(content) as T;
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (!m) return null;
      return JSON.parse(m[0]) as T;
    }
  } catch (err) {
    console.error("[agent/llm] request failed", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
