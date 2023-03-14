import { Message } from "./types";

export interface Node extends Message {
    parent: Node | null;
    children: Set<Node>;
}

export function createNode(message: Message): Node {
    return {
        ...message,
        parent: null,
        children: new Set(),
    };
}

export class MessageTree {
    public nodes: Map<string, Node> = new Map();

    constructor(messages: (Message | Node)[] = []) {
        this.addMessages(messages);
    }

    public get roots(): Node[] {
        return Array.from(this.nodes.values())
            .filter((node) => node.parent === null);
    }

    public get leafs(): Node[] {
        return Array.from(this.nodes.values())
            .filter((node) => node.children.size === 0);
    }

    public get first(): Node | null {
        const leaf = this.mostRecentLeaf();
        let first: Node | null = leaf;
        while (first?.parent) {
            first = first.parent;
        }
        return first;
    }

    public get(id: string) {
        return this.nodes.get(id);
    }

    public addMessage(message: Message) {
        if (this.nodes.get(message.id)?.content) {
            return;
        }

        const node = createNode(message);

        this.nodes.set(node.id, node);

        if (node.parentID) {
            let parent = this.nodes.get(node.parentID);

            if (!parent) {
                parent = createNode({
                    id: node.parentID,
                } as Message);

                this.nodes.set(parent.id, parent);
            }

            parent.children.add(node);
            node.parent = parent;
        }

        for (const other of Array.from(this.nodes.values())) {
            if (other.parentID === node.id) {
                node.children.add(other);
                other.parent = node;
            }
        }
    }

    public addMessages(messages: Message[]) {
        for (const message of messages) {
            try {
                this.addMessage(message);
            } catch (e) {
                console.error(e);
            }
        }
    }

    public updateMessage(message: Message) {
        const node = this.nodes.get(message.id);

        if (!node) {
            return;
        }

        node.content = message.content;
        node.timestamp = message.timestamp;
        node.done = message.done;
    }

    public getMessageChainTo(messageID: string) {
        const message = this.nodes.get(messageID);

        if (!message) {
            return [];
        }

        const chain = [message];

        let current = message;

        while (current.parent) {
            chain.unshift(current.parent);
            current = current.parent;
        }

        return chain;
    }

    public serialize() {
        return Array.from(this.nodes.values())
            .map((node) => {
                const n: any = { ...node };
                delete n.parent;
                delete n.children;
                return n;
            });
    }

    public mostRecentLeaf() {
        return this.leafs.sort((a, b) => b.timestamp - a.timestamp)[0];
    }
}