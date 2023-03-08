/* tslint:disable */
/* eslint-disable */
export * from "./tiktoken";
export function init(
  callback: (
    imports: WebAssembly.Imports
  ) => Promise<WebAssembly.WebAssemblyInstantiatedSource | WebAssembly.Instance>
): Promise<void>;