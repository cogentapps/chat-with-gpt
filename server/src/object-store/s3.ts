import { 
    S3,
    PutObjectCommand,
    GetObjectCommand,
} from "@aws-sdk/client-s3";
import type {Readable} from 'stream';
import ObjectStore from "./index";

const bucket = process.env.S3_BUCKET;

const s3 = new S3({
    region: process.env.DEFAULT_S3_REGION,
});

export default class S3ObjectStore extends ObjectStore {
    public async get(key: string) {
        const params = {
            Bucket: bucket,
            Key: key,
        };
        const data = await s3.send(new GetObjectCommand(params));
        return await readStream(data.Body as Readable);
    }

    public async put(key: string, value: string, contentType: string) {
        const params = {
            Bucket: bucket,
            Key: key,
            Body: value,
            ContentType: contentType,
            StorageClass: "INTELLIGENT_TIERING",
        };
        await s3.send(new PutObjectCommand(params));
    }
}

async function readStream(stream: Readable) {
    const chunks: any[] = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
}