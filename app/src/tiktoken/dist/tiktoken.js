import * as wasm from "./tiktoken_bg.wasm";
import { __wbg_set_wasm } from "./tiktoken_bg.js";
__wbg_set_wasm(wasm);
export * from "./tiktoken_bg.js";
