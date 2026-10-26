import { type ClientIdentity, NO_MISTAKES_ATTRIBUTION } from "@no-mistakes/ai";
import { VERSION } from "../config.ts";

/** Identify no-mistakes to providers and retain provider attribution on every request. */
export function getClientIdentity(): ClientIdentity {
	return {
		userAgent: "detailed",
		version: VERSION,
		attribution: NO_MISTAKES_ATTRIBUTION,
	};
}
