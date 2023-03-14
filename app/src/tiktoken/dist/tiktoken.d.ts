/* tslint:disable */
/* eslint-disable */

export type TiktokenEncoding = "gpt2" | "r50k_base" | "p50k_base" | "p50k_edit" | "cl100k_base"; 

/**
 * @param {TiktokenEncoding} encoding
 * @param {Record<string, number>} [extend_special_tokens]
 * @returns {Tiktoken}
 */
export function get_encoding(encoding: TiktokenEncoding, extend_special_tokens?: Record<string, number>): Tiktoken;



export type TiktokenModel =
    | "text-davinci-003"
    | "text-davinci-002"
    | "text-davinci-001"
    | "text-curie-001"
    | "text-babbage-001"
    | "text-ada-001"
    | "davinci"
    | "curie"
    | "babbage"
    | "ada"
    | "code-davinci-002"
    | "code-davinci-001"
    | "code-cushman-002"
    | "code-cushman-001"
    | "davinci-codex"
    | "cushman-codex"
    | "text-davinci-edit-001"
    | "code-davinci-edit-001"
    | "text-embedding-ada-002"
    | "text-similarity-davinci-001"
    | "text-similarity-curie-001"
    | "text-similarity-babbage-001"
    | "text-similarity-ada-001"
    | "text-search-davinci-doc-001"
    | "text-search-curie-doc-001"
    | "text-search-babbage-doc-001"
    | "text-search-ada-doc-001"
    | "code-search-babbage-code-001"
    | "code-search-ada-code-001"
    | "gpt2"
    | "gpt-3.5-turbo"
    | "gpt-3.5-turbo-0301";

/**
 * @param {TiktokenModel} encoding
 * @param {Record<string, number>} [extend_special_tokens]
 * @returns {Tiktoken}
 */
export function encoding_for_model(model: TiktokenModel, extend_special_tokens?: Record<string, number>): Tiktoken;


/**
*/
export class Tiktoken {
  free(): void;
/**
* @param {string} tiktoken_bfe
* @param {any} special_tokens
* @param {string} pat_str
*/
  constructor(tiktoken_bfe: string, special_tokens: Record<string, number>, pat_str: string);
/**
* @param {string} text
* @param {any} allowed_special
* @param {any} disallowed_special
* @returns {Uint32Array}
*/
  encode(text: string, allowed_special?: "all" | string[], disallowed_special?: "all" | string[]): Uint32Array;
/**
* @param {string} text
* @returns {Uint32Array}
*/
  encode_ordinary(text: string): Uint32Array;
/**
* @param {string} text
* @param {any} allowed_special
* @param {any} disallowed_special
* @returns {any}
*/
  encode_with_unstable(text: string, allowed_special?: "all" | string[], disallowed_special?: "all" | string[]): any;
/**
* @param {Uint8Array} bytes
* @returns {number}
*/
  encode_single_token(bytes: Uint8Array): number;
/**
* @param {Uint32Array} tokens
* @returns {Uint8Array}
*/
  decode(tokens: Uint32Array): Uint8Array;
/**
* @param {number} token
* @returns {Uint8Array}
*/
  decode_single_token_bytes(token: number): Uint8Array;
/**
* @returns {any}
*/
  token_byte_values(): Array<Array<number>>;
/**
*/
  readonly name: string | undefined;
}
