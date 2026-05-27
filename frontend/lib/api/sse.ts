// lib/api/sse.ts
// SSE streaming over POST — EventSource only supports GET, so we use fetch + ReadableStream
import { getBaseUrl } from "@/lib/api/axios";
import { refreshAccessToken, forceLogout } from "@/lib/api/auth-refresh";
import { DEFAULT_MODEL } from "@/config/constants";
import type { SendMessageRequest, SseEvent } from "@/types/conversation";

export interface SseCallbacks {
  onChunk: (content: string) => void;
  onMetadata: (log: SseEvent & { type: "metadata" }) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

/**
 * Stream an LLM response from POST /api/v1/conversations/:id/message
 * Returns an abort function to cancel the stream mid-flight.
 */
export function streamMessage(
  conversationId: string,
  body: SendMessageRequest,
  callbacks: SseCallbacks
): () => void {
  let controller = new AbortController();

  const isGeminiQuotaErrorMessage = (message: string): boolean => {
    const msg = message.toLowerCase();
    return (
      msg.includes("resource_exhausted") ||
      msg.includes("quota exceeded") ||
      msg.includes("generativelanguage.googleapis.com") ||
      msg.includes("gemini-")
    );
  };

  const runStream = async (
    authRetried: boolean,
    groqRetried: boolean,
    bodyToSend: SendMessageRequest,
  ): Promise<void> => {
    let gotDone = false;
    let gotTerminalError = false;

    const url = `${getBaseUrl()}/api/v1/conversations/${conversationId}/message`;

    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyToSend),
    });

    if (response.status === 401 && !authRetried) {
      try {
        await refreshAccessToken();
        return runStream(true, groqRetried, bodyToSend);
      } catch {
        await forceLogout();
        callbacks.onError("Session expired. Please sign in again.");
        return;
      }
    }

    if (!response.ok) {
      const text = await response.text();
      let msg = `HTTP ${response.status}`;
      try {
        const parsed = JSON.parse(text);
        msg = parsed?.message ?? msg;
      } catch {
        if (text) msg = text;
      }
      callbacks.onError(msg);
      return;
    }

    if (!response.body) {
      callbacks.onError("No response body received");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (let line of lines) {
        line = line.trim();
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6);
        let event: SseEvent;
        try {
          event = JSON.parse(jsonStr);
        } catch {
          continue;
        }

        switch (event.type) {
          case "chunk":
            callbacks.onChunk(event.content);
            break;
          case "metadata":
            callbacks.onMetadata(event as SseEvent & { type: "metadata" });
            break;
          case "done":
            gotDone = true;
            callbacks.onDone();
            break;
          case "error":
            // If Gemini quota is exceeded, retry once with Groq.
            if (!groqRetried && isGeminiQuotaErrorMessage(event.message)) {
              controller.abort();
              controller = new AbortController();

              const groqBody: SendMessageRequest = {
                ...bodyToSend,
                provider: "GROQ",
                model: DEFAULT_MODEL,
              };

              return runStream(authRetried, true, groqBody);
            }

            gotTerminalError = true;
            callbacks.onError(event.message);
            break;
        }
      }
    }

    // If the server ended without sending `done` or `error`, treat it as a transport issue.
    if (!gotDone && !gotTerminalError) {
      callbacks.onError("Stream ended unexpectedly");
    }
  };

  (async () => {
    try {
      await runStream(false, false, body);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const message =
        err instanceof Error ? err.message : "Stream connection failed";
      callbacks.onError(message);
    }
  })();

  return () => controller.abort();
}
