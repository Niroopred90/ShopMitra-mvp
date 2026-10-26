import type { Instrumentation } from "next";
import { logOperationalEvent } from "@/lib/monitoring";

export const onRequestError: Instrumentation.onRequestError = () => {
  logOperationalEvent("request_failed");
};
