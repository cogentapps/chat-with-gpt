const MAX_NUM_THREADS = 128;

type MergeRange = { start: number, end: number };

export class RankMap {
    private values = new Map<string, number>();

    public static from(texts: string[]) {
        const map = new RankMap();
        for (let i = 0; i < texts.length; i++) {
            map.values.set(texts[i], i);
        }
        return map;
    }

    public set(bytes: Uint8Array, rank: number) {
        const key = Buffer.from(bytes).toString();
        this.values.set(key, rank);
    }

    public get(bytes: Uint8Array) {
        const key = Buffer.from(bytes).toString();
        return this.values.get(key);
    }

    public keys() {
        return Array.from(this.values.keys()).map(k => Buffer.from(k));
    }

    public inverted() {
        const inverted = new Map<number, Uint8Array>();
        for (const [key, value] of Array.from(this.values.entries())) {
            inverted.set(value, new Uint8Array(Buffer.from(key)));
        }
        return inverted;
    }
}

function bytePairMerge(piece: Uint8Array, ranks: RankMap): MergeRange[] {
    let parts: MergeRange[] = Array.from({ length: piece.length }, (_, i) => ({ start: i, end: i + 1 }));
    while (true) {
        if (parts.length === 1) {
            break;
        }
        let minRank: [number, number] | null = null;
        for (let i = 0; i < parts.length - 1; i++) {
            const rank = ranks.get(piece.slice(parts[i].start, parts[i + 1].end));
            if (rank === undefined) {
                continue;
            }
            if (minRank === null || rank < minRank[0]) {
                minRank = [rank, i];
            }
        }
        if (minRank !== null) {
            const [_, i] = minRank;
            parts[i] = { start: parts[i].start, end: parts[i + 1].end };
            parts.splice(i + 1, 1);
        } else {
            break;
        }
    }
    return parts;
}

function bytePairEncode(piece: Uint8Array, ranks: RankMap): number[] {
    if (piece.length === 1) {
        return [ranks.get(piece)!];
    }
    return bytePairMerge(piece, ranks).map((p) => ranks.get(piece.slice(p.start, p.end))!);
}

function bytePairSplit(piece: Uint8Array, ranks: RankMap): Uint8Array[] {
    if (piece.length === 1) {
        return [piece];
    }
    return bytePairMerge(piece, ranks).map((p) => piece.slice(p.start, p.end));
}

export class CoreBPE {
    encoder: RankMap;
    specialTokensEncoder: Map<string, number>;
    decoder: Map<number, Uint8Array>;
    specialTokensDecoder: Map<number, Uint8Array>;
    regexTls: RegExp[];
    specialRegexTls: RegExp[];
    sortedTokenBytes: Uint8Array[];

    constructor(
        encoder: RankMap,
        specialTokensEncoder: Map<string, number>,
        regex: RegExp
    ) {
        const specialRegex = new RegExp(
            Array.from(specialTokensEncoder.keys())
                .map((s) => s.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&"))
                .join("|")
        );

        const decoder: Map<number, Uint8Array> = encoder.inverted();

        const specialTokensDecoder: Map<number, Uint8Array> = new Map(
            Array.from(specialTokensEncoder.entries()).map(([k, v]) => [v, new Uint8Array(Buffer.from(k))])
        );
        const sortedTokenBytes: Uint8Array[] = Array.from(encoder.keys());
        sortedTokenBytes.sort((a, b) => Buffer.compare(a, b));

        this.encoder = encoder;
        this.specialTokensEncoder = specialTokensEncoder;
        this.decoder = decoder;
        this.specialTokensDecoder = specialTokensDecoder;
        this.regexTls = Array(MAX_NUM_THREADS).fill(regex);
        this.specialRegexTls = Array(MAX_NUM_THREADS).fill(specialRegex);
        this.sortedTokenBytes = sortedTokenBytes;
    }

    private _getTlRegex(): RegExp {
        return this.regexTls[Math.floor(Math.random() * MAX_NUM_THREADS)];
    }

    private _getTlSpecialRegex(): RegExp {
        return this.specialRegexTls[Math.floor(Math.random() * MAX_NUM_THREADS)];
    }

    private _decodeNative(tokens: number[]): Uint8Array {
        const ret: number[] = [];
        for (const token of tokens) {
            const tokenBytes = this.decoder.get(token) || this.specialTokensDecoder.get(token)!;
            ret.push(...Array.from(tokenBytes));
        }
        return new Uint8Array(ret);
    }

    private _encodeOrdinaryNative(text: string): number[] {
        const regex = this._getTlRegex();
        const ret: number[] = [];
        let match: RegExpExecArray | null;
        while ((match = regex.exec(text)) !== null) {
            const piece = new Uint8Array(Buffer.from(match[0]));
            const token = this.encoder.get(piece);
            if (token !== undefined) {
                ret.push(token);
                continue;
            }
            ret.push(...bytePairEncode(piece, this.encoder));
        }
        return ret;
    }

    private _encodeNative(text: string, allowedSpecial: Set<string>): [number[], number] {
        const specialRegex = this._getTlSpecialRegex();
        const regex = this._getTlRegex();
        const ret: number[] = [];

        let start = 0;
        let lastPieceTokenLen = 0;
        while (true) {
            let nextSpecial: RegExpExecArray | null;
            let startFind = start;
            while (true) {
                nextSpecial = specialRegex.exec(text.slice(startFind));
                if (nextSpecial === null || allowedSpecial.has(nextSpecial[0])) {
                    break;
                }
                startFind = nextSpecial.index + 1;
            }
            const end = nextSpecial === null ? text.length : nextSpecial.index;
            let match: RegExpExecArray | null;
            while ((match = regex.exec(text.slice(start, end))) !== null) {
                const piece = new Uint8Array(Buffer.from(match[0]));
                const token = this.encoder.get(piece);
                if (token !== undefined) {
                    lastPieceTokenLen = 1;
                    ret.push(token);
                    continue;
                }
                const tokens = bytePairEncode(piece, this.encoder);
                lastPieceTokenLen = tokens.length;
                ret.push(...tokens);
            }

            if (nextSpecial === null) {
                break;
            }
            const piece = nextSpecial[0];
            const token = this.specialTokensEncoder.get(piece)!;
            ret.push(token);
            start = nextSpecial.index + piece.length;
            lastPieceTokenLen = 0;
        }
        return [ret, lastPieceTokenLen];
    }

    encodeOrdinary(text: string): number[] {
        return this._encodeOrdinaryNative(text);
    }

    encode(text: string, allowedSpecial: Set<string>): number[] {
        return this._encodeNative(text, allowedSpecial)[0];
    }

    encodeWithUnstable(text: string, allowedSpecial: Set<string>): [number[], Set<number[]>] {
        throw new Error("Not implemented");
    }

    encodeSingleToken(piece: Uint8Array): number {
        const token = this.encoder.get(piece);
        if (token !== undefined) {
            return token;
        }
        const pieceStr = Buffer.from(piece).toString("utf-8");
        if (this.specialTokensEncoder.has(pieceStr)) {
            return this.specialTokensEncoder.get(pieceStr)!;
        }
        throw new Error("Key not found");
    }

    encodeSinglePiece(piece: Uint8Array): number[] {
        const token = this.encoder.get(piece);
        if (token !== undefined) {
            return [token];
        }
        return bytePairEncode(piece, this.encoder);
    }

    decodeBytes(tokens: number[]): Uint8Array {
        return this._decodeNative(tokens);
    }

    decodeSingleTokenBytes(token: number): Uint8Array {
        const bytes = this.decoder.get(token) || this.specialTokensDecoder.get(token);
        if (bytes !== undefined) {
            return bytes;
        }
        throw new Error("Key not found");
    }

    tokenByteValues(): Uint8Array[] {
        return this.sortedTokenBytes;
    }
}