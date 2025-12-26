import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { nanoid } from 'nanoid';
import { ChatMessage, CreateChatMessageDTO } from '../../types';
import { IChatMessageRepository } from '../../interfaces';

const now = () => new Date().toISOString();

/**
 * SQLite Chat Message Repository
 */
export class SQLiteChatMessageRepository implements IChatMessageRepository {
    constructor(private db: SQLiteDBConnection) { }

    async findAll(limit?: number): Promise<ChatMessage[]> {
        let sql = 'SELECT * FROM chat_messages ORDER BY created_at';
        if (limit) sql += ` LIMIT ${limit}`;
        const result = await this.db.query(sql);
        return (result.values || []).map(this.mapRow);
    }

    async findRecent(limit: number): Promise<ChatMessage[]> {
        const result = await this.db.query(
            'SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT ?',
            [limit]
        );
        return (result.values || []).map(this.mapRow).reverse();
    }

    async create(data: CreateChatMessageDTO): Promise<ChatMessage> {
        const message: ChatMessage = {
            id: nanoid(),
            role: data.role,
            content: data.content,
            metadata: data.metadata,
            createdAt: now()
        };

        await this.db.run(
            'INSERT INTO chat_messages (id, role, content, metadata, created_at) VALUES (?, ?, ?, ?, ?)',
            [message.id, message.role, message.content, message.metadata, message.createdAt]
        );

        return message;
    }

    async deleteAll(): Promise<void> {
        await this.db.run('DELETE FROM chat_messages');
    }

    async deleteOlderThan(date: string): Promise<void> {
        await this.db.run('DELETE FROM chat_messages WHERE created_at < ?', [date]);
    }

    private mapRow(row: any): ChatMessage {
        return {
            id: row.id,
            role: row.role,
            content: row.content,
            metadata: row.metadata,
            createdAt: row.created_at
        };
    }
}
