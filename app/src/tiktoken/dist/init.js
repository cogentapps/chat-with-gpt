import * as imports from "./tiktoken_bg.js";

export async function init(cb) {
  const res = await cb({
    "./tiktoken_bg.js": imports,
  });

  const instance =
    "instance" in res && res.instance instanceof WebAssembly.Instance
      ? res.instance
      : res instanceof WebAssembly.Instance
      ? res
      : null;

  if (instance == null) throw new Error("Missing instance");
  imports.__wbg_set_wasm(instance.exports);
  return imports;
}

export * from "./tiktoken_bg.js";