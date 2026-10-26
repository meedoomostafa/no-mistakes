import * as durable from "@no-mistakes/durable";
import * as environment from "@no-mistakes/durable/env";
import * as jsonl from "@no-mistakes/durable/storage/jsonl";
import * as sqlite from "@no-mistakes/durable/storage/sqlite";

// Keep runtime-neutral public entry points live so the browser smoke build
// catches accidental imports of Node-only adapters or built-ins.
console.log(Object.keys(durable), Object.keys(environment), Object.keys(jsonl), Object.keys(sqlite));
