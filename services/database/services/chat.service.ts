import { ChatMessage, CreateChatMessageDTO } from '../types';
import { IDatabase, IChatService } from '../interfaces';

/**
 * Chat Service - Quản lý lịch sử chat
 */
export class ChatService implements IChatService {
    constructor(private db: IDatabase) { }

    async getMessages(limit?: number): Promise<ChatMessage[]> {
        return this.db.chatMessages.findAll(limit);
    }

    async addMessage(data: CreateChatMessageDTO): Promise<ChatMessage> {
        return this.db.chatMessages.create(data);
    }

    async clearHistory(): Promise<void> {
        return this.db.chatMessages.deleteAll();
    }
}
