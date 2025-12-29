import { LlamaAI } from 'capacitor-llama';
import { AppSettings, Transaction, Account, TransactionType, Category } from '../types';
import { ALLOWED_ACTIONS } from './aiActions';

// Build action-based prompt for AI - SIMPLIFIED for speed
const buildActionPrompt = (
    message: string,
    categories: string[]
): string => {
    // Limit categories to 5 for shorter prompt
    const categoryList = categories.slice(0, 5).join(', ');

    // MINIMAL system prompt
    const sys = `Bạn là AI quản lý chi tiêu. Danh mục: ${categoryList}.

Luôn trả JSON:
{"action":"...", "params":{...}}

Actions:
- add_expense: {"action":"add_expense","params":{"amount":số,"category":"...","note":"..."}}
- add_income: {"action":"add_income","params":{"amount":số,"category":"...","note":"..."}}
- get_total_expense: {"action":"get_total_expense","params":{"period":"this_month"}}
- get_balance: {"action":"get_balance","params":{}}
- chat: {"action":"chat","params":{"message":"..."}}

amount: 40k=40000, 1tr=1000000
CHỈ TRẢ JSON.`;

    // No history for faster response
    const prompt = `<|im_start|>system\n${sys}<|im_end|>\n<|im_start|>user\n${message}<|im_end|>\n<|im_start|>assistant\n`;

    console.log('[Prompt] Length:', prompt.length, 'chars');
    return prompt;
};

export const sendMessageToLlama = async (
    message: string,
    history: { role: 'user' | 'model'; text: string }[],
    settings: AppSettings,
    transactions: Transaction[],
    accounts: Account[],
    categories: Category[]
): Promise<string> => {
    const categoryNames = Array.from(new Set(categories.map(c => c.name)));

    try {
        const prompt = buildActionPrompt(message, categoryNames);

        const result = await LlamaAI.chat({
            prompt,
            n_predict: 80, // Need more tokens for JSON
            temperature: 0.3,
            top_k: 30,
            top_p: 0.9,
            min_p: 0.05,
            repeat_penalty: 1.2,
            stop: ['<|im_end|>', '<|im_start|>', '\n\n']
        } as any);

        let response = result.response || '{"action":"chat","params":{"message":"Xin lỗi, tôi chưa hiểu."}}';

        // Clean up
        response = response
            .replace(/<\|im_end\|>/g, '')
            .replace(/<\|im_start\|>/g, '')
            .trim();

        return response;
    } catch (error: any) {
        console.error("LlamaAI Error:", error);
        return `{"action":"chat","params":{"message":"Lỗi: ${error.message || 'Unknown'}"}}`;
    }
};
