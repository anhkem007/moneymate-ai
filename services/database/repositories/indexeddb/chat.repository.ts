import { nanoid } from 'nanoid';
import { ChatMessage, CreateChatMessageDTO } from '../../types';
import { IChatMessageRepository } from '../../interfaces';

const now = () => new Date().toISOString();

/**
 * IndexedDB Chat Message Repository
 */
export class IndexedDBChatMessageRepository implements IChatMessageRepository {
    constructor(private db: any) { }

    async findAll(limit?: number): Promise<ChatMessage[]> {
        let query = this.db.chatMessages.orderBy('createdAt');
        if (limit) {
            return query.reverse().limit(limit).toArray().then((arr: ChatMessage[]) => arr.reverse());
        }
        return query.toArray();
    }

    async findRecent(limit: number): Promise<ChatMessage[]> {
        return this.db.chatMessages
            .orderBy('createdAt')
            .reverse()
            .limit(limit)
            .toArray()
            .then((arr: ChatMessage[]) => arr.reverse());
    }

    async create(data: CreateChatMessageDTO): Promise<ChatMessage> {
        const message: ChatMessage = {
            id: nanoid(),
            role: data.role,
            content: data.content,
            metadata: data.metadata,
            createdAt: now()
        };
        await this.db.chatMessages.add(message);
        return message;
    }

    async deleteAll(): Promise<void> {
        await this.db.chatMessages.clear();
    }

    async deleteOlderThan(date: string): Promise<void> {
        await this.db.chatMessages.where('createdAt').below(date).delete();
    }
}
