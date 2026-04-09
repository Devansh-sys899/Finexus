/**
 * services/chatService.js
 * ─────────────────────────────────────────────
 * Encapsulated API layer for the chat / webhook
 * endpoint.  Keeps HTTP concerns out of React
 * components and provides a single seam for
 * testing, mocking, and future enhancements
 * (retries, streaming, etc.).
 */

import axios from "../api/axios";

// ── Configuration ──────────────────────────────
const CHAT_ENDPOINT = "/webhook";
const REQUEST_TIMEOUT_MS = 30_000; // 30 s — generous for AI latency

// ── Debug helpers (stripped by tree‑shaking in prod builds) ──
const DEBUG = import.meta.env.DEV;

function logRequest(message) {
  if (DEBUG) console.log("%c[Chat →]", "color:#6366F1;font-weight:bold", message);
}

function logResponse(data) {
  if (DEBUG) console.log("%c[Chat ←]", "color:#10B981;font-weight:bold", data);
}

function logError(err) {
  if (DEBUG) console.error("%c[Chat ✖]", "color:#EF4444;font-weight:bold", err);
}

// ── Public API ─────────────────────────────────

/**
 * Send a user message to the backend chat endpoint.
 *
 * @param {string}           message - Raw user input (should be pre‑trimmed)
 * @param {AbortSignal|null} signal  - Optional AbortController signal for cancellation
 * @returns {Promise<{ text: string, data?: object, agent?: string }>}
 *   Normalised response object for the UI.
 * @throws {{ userMessage: string, status?: number }}
 *   A structured error the caller can display directly.
 */
export async function sendMessage(message, signal = null) {
  logRequest(message);

  try {
    const response = await axios.post(
      CHAT_ENDPOINT,
      { message },
      {
        timeout: REQUEST_TIMEOUT_MS,
        ...(signal ? { signal } : {}),
      }
    );

    const payload = response.data;
    logResponse(payload);

    // Normalise: backend returns { success, message, agent, data }
    return {
      text: payload?.message || payload?.reply || "Done — but I couldn't format a reply.",
      data: payload?.data ?? null,
      agent: payload?.agent ?? "unknown",
    };
  } catch (err) {
    logError(err);

    // ── Request was explicitly cancelled (AbortController) ──
    if (axios.isCancel?.(err) || err.name === "CanceledError" || err.code === "ERR_CANCELED") {
      throw { userMessage: null }; // silent — caller should just clean up
    }

    // ── Network / timeout ──
    if (!err.response) {
      throw {
        userMessage:
          err.code === "ECONNABORTED"
            ? "The request timed out. The AI might be busy — please try again."
            : "Unable to reach the server. Check your connection and try again.",
        status: 0,
      };
    }

    // ── Backend returned a structured error but still has a message ──
    // (e.g. Gemini quota fallback at 400)
    const status = err.response.status;
    const body = err.response.data;

    if (body?.message) {
      // Backend sent a "friendly" AI message even in an error response
      // (parentAgent does this for unknown intents at 400)
      throw {
        userMessage: null, // not an error the user should see as red
        aiReply: body.message,
        status,
      };
    }

    // ── Genuine server error ──
    const serverMsg =
      body?.error?.message || "Something went wrong. Please try again.";

    throw { userMessage: serverMsg, status };
  }
}

/**
 * Create an AbortController scoped to a single chat request.
 * @returns {AbortController}
 */
export function createChatAbortController() {
  return new AbortController();
}
