import { foregroundAnsi, rgbColor } from "@no-mistakes/tui";
import { theme } from "../theme/theme.ts";

const CORAL = rgbColor(228, 138, 122);
const YELLOW = rgbColor(234, 182, 93);
const RESET = "\x1b[0m";

/** Text wordmark for no-mistakes, with fixed brand colors across themes. */
export function noMistakesWordmark(): string {
	const mode = theme.getColorMode();
	return `${foregroundAnsi(CORAL, mode)}no-${RESET}${foregroundAnsi(YELLOW, mode)}mistakes${RESET}`;
}
