// Polyfill localStorage before any other code runs
import "@/lib/polyfills/localStorage";

import { registerOTel } from "@vercel/otel";

export function register() {
  registerOTel({ serviceName: "ai-chatbot" });
}
