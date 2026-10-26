import * as bundledNoMistakesAgentCore from "@no-mistakes/agent-core";
import * as bundledNoMistakesAiCompat from "@no-mistakes/ai/compat";
import * as bundledNoMistakesAiModels from "@no-mistakes/ai/models";
import * as bundledNoMistakesAiOauth from "@no-mistakes/ai/oauth";
import * as bundledNoMistakesAiProviders from "@no-mistakes/ai/providers/all";
import * as bundledNoMistakesTui from "@no-mistakes/tui";
import * as bundledTypebox from "typebox";
import * as bundledTypeboxCompile from "typebox/compile";
import * as bundledTypeboxValue from "typebox/value";
// This import is safe because loader.ts exports are not re-exported from index.ts.
// Extensions can therefore import from @no-mistakes/coding-agent.
import * as bundledNoMistakesCodingAgent from "../../index.ts";

/** Modules available to extensions in source and compiled binary runtimes. */
export const VIRTUAL_MODULES: Record<string, unknown> = {
	typebox: bundledTypebox,
	"typebox/compile": bundledTypeboxCompile,
	"typebox/value": bundledTypeboxValue,
	"@sinclair/typebox": bundledTypebox,
	"@sinclair/typebox/compile": bundledTypeboxCompile,
	"@sinclair/typebox/value": bundledTypeboxValue,
	"@no-mistakes/agent-core": bundledNoMistakesAgentCore,
	"@no-mistakes/tui": bundledNoMistakesTui,
	// The AI package root resolves to the compat entrypoint, a strict superset
	// of the core entrypoint.
	"@no-mistakes/ai": bundledNoMistakesAiCompat,
	"@no-mistakes/ai/compat": bundledNoMistakesAiCompat,
	"@no-mistakes/ai/models": bundledNoMistakesAiModels,
	"@no-mistakes/ai/oauth": bundledNoMistakesAiOauth,
	"@no-mistakes/ai/providers/all": bundledNoMistakesAiProviders,
	"@no-mistakes/coding-agent": bundledNoMistakesCodingAgent,
};
