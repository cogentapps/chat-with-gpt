import { Message } from "./types";

/**
 * MessageNode interface that extends the Message type and includes parent and replies properties.
 * This allows creating a tree structure from messages.
 */
export interface MessageNode extends Message {
    parent: MessageNode | null;
    replies: Set<MessageNode>;
}

/**
 * Function to create a new MessageNode from a given message.
 *
 * @param {Message} message - The message to be converted to a MessageNode.
 * @returns {MessageNode} - The newly created MessageNode.
 */
export function createMessageNode(message: Message): MessageNode {
    return {
        ...message,
        parent: null,
        replies: new Set(),
    };
}

/**
 * MessageTree class for representing and managing a tree structure of messages.
 * The tree is made up of MessageNode objects, which extend the `Message` type and can have parent and replies relationships.
 * The purpose of the tree structure is to represent a hierarchy of messages, where one message might have multiple
 * replies, and each reply has a parent message that it is replying to.
 */

export class MessageTree {
    public messageNodes: Map<string, MessageNode> = new Map(); // TODO make private

    constructor(messages: (Message | MessageNode)[] = []) {
        this.addMessages(messages);
    }

    /**
     * Getter method for retrieving root messages (messages without a parent) in the tree.
     * @returns {MessageNode[]} - An array of root messages.
     */
    public get roots(): MessageNode[] {
        return Array.from(this.messageNodes.values())
            .filter((messageNode) => messageNode.parent === null);
    }

    /**
     * Getter method for retrieving leaf messages (messages without any replies) in the tree.
     * @returns {MessageNode[]} - An array of leaf messages.
     */
    public get leafs(): MessageNode[] {
        return Array.from(this.messageNodes.values())
            .filter((messageNode) => messageNode.replies.size === 0);
    }

    /**
     * Getter method for retrieving the first message in the most recent message chain.
     * @returns {MessageNode | null} - The first message in the most recent message chain, or null if the tree is empty.
     */
    public get first(): MessageNode | null {
        const leaf = this.mostRecentLeaf();
        let first: MessageNode | null = leaf;
        while (first?.parent) {
            first = first.parent;
        }
        return first;
    }

    /**
     * Method to get a message node from the tree by its ID.
     * @param {string} id - The ID of the message node to retrieve.
     * @returns {MessageNode | null} - The message node with the given ID, or null if it does not exist in the tree.
     */
    public get(id: string): MessageNode | null {
        return this.messageNodes.get(id) || null;
    }

    /**
     * Method to add a message to the tree. If a message with the same ID already exists in the tree, this method does nothing.
     * @param {Message} message - The message to add to the tree.
     */
    public addMessage(inputMessage: Message, content: string | undefined = '', done: boolean | undefined = false): void {
        const message = {
            ...inputMessage,
            content: content || inputMessage.content || '',
            done: typeof done === 'boolean' ? done : inputMessage.done,
        };

        if (this.messageNodes.get(message.id)?.content) {
            return;
        }

        const messageNode = createMessageNode(message);

        this.messageNodes.set(messageNode.id, messageNode);

        if (messageNode.parentID) {
            let parent = this.messageNodes.get(messageNode.parentID);

            if (!parent) {
                parent = createMessageNode({
                    id: messageNode.parentID,
                } as Message);

                this.messageNodes.set(parent.id, parent);
            }

            parent.replies.add(messageNode);
            messageNode.parent = parent;
        }

        for (const other of Array.from(this.messageNodes.values())) {
            if (other.parentID === messageNode.id) {
                messageNode.replies.add(other);
                other.parent = messageNode;
            }
        }
    }

    /**
     * Method to add multiple messages to the tree.
     * @param {Message[]} messages - An array of messages to add to the tree.
     */
    public addMessages(messages: Message[]): void {
        for (const message of messages) {
            try {
                this.addMessage(message);
            } catch (e) {
                console.error(`Error adding message with id: ${message.id}`, e);
            }
        }
    }

    /**
     * Method to update the content, timestamp, and done status of an existing message in the tree.
     * @param {Message} message - The updated message.
     */
    public updateMessage(message: Message): void {
        const messageNode = this.messageNodes.get(message.id);

        if (!messageNode) {
            return;
        }

        messageNode.content = message.content;
        messageNode.timestamp = message.timestamp;
        messageNode.done = message.done;
    }

    /**
     * Method to get the message chain leading to a specific message by its ID.
     * @param {string} messageID - The ID of the target message.
     * @returns {MessageNode[]} - An array of message nodes in the chain leading to the target message.
     */
    public getMessageChainTo(messageID: string): MessageNode[] {
        const message = this.messageNodes.get(messageID);

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

    /**
     * Method to serialize the message tree into an array of message nodes, excluding parent and replies properties.
     * @returns {Omit<MessageNode, 'parent' | 'replies'>[]} - An array of serialized message nodes.
     */
    public serialize(): Omit<MessageNode, 'parent' | 'replies'>[] {
        return Array.from(this.messageNodes.values())
            .map((messageNode) => {
                const n: any = { ...messageNode };
                delete n.parent;
                delete n.replies;
                return n;
            });
    }

    /**
     * Method to get the most recent leaf message in the message tree.
     * @returns {MessageNode | null} - The most recent leaf message, or null if the tree is empty.
     */
    public mostRecentLeaf(): MessageNode | null {
        return this.leafs.sort((a, b) => b.timestamp - a.timestamp)[0] || null;
    }
}