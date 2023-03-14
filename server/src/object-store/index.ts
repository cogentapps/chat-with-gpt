export default abstract class ObjectStore {
    public async initialize() {}
    public abstract get(key: string): Promise<string | null>;
    public abstract put(key: string, value: string, contentType: string): Promise<void>;
}