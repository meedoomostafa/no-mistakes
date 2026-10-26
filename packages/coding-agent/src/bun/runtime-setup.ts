import { bedrockProviderModule } from "@no-mistakes/ai/bedrock-provider";
import { registerBunOAuthFlows } from "@no-mistakes/ai/bun-oauth";
import { setBedrockProviderModule } from "@no-mistakes/ai/compat";
// Bun loads .wasm imports as files: embedded in compiled executables, evaluating to a readable path.
import quickjsWasmPath from "quickjs-wasi/quickjs.wasm";
import { APP_NAME, setEmbeddedQuickJSWasmPath } from "../config.ts";

process.title = APP_NAME;
process.emitWarning = (() => {}) as typeof process.emitWarning;
registerBunOAuthFlows();
setBedrockProviderModule(bedrockProviderModule);
setEmbeddedQuickJSWasmPath(quickjsWasmPath);
