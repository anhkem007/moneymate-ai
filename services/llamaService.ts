import { LlamaAI } from 'capacitor-llama';
import { AppSettings, Transaction, Account, TransactionType, Category } from '../types';

// SMART PROMPT - prevent rambling, focus on task
const buildSmartPrompt = (
    message: string,
    history: { role: 'user' | 'model'; text: string }[],
    totalSpent: number,
    totalIncome: number,
    balance: number,
    categories: string[] // List of category names
): string => {
    const spentK = (totalSpent / 1000).toFixed(0);
    const incomeK = (totalIncome / 1000).toFixed(0);
    const balanceK = (balance / 1000).toFixed(0);
    const catsList = categories.join(', ');

    // Concise system prompt - force natural language response
    const sys = `Bạn là MoneyMate, trợ lý tài chính thân thiện.
Quy tắc BẮT BUỘC:
1. LUÔN trả lời bằng TIẾNG VIỆT tự nhiên, thân thiện, dễ hiểu
2. Trả lời NGẮN GỌN (1-3 câu)
3. KHÔNG BAO GIỜ trả lời bằng JSON hoặc code
4. Khi user hỏi về số liệu, trả lời bằng câu hoàn chỉnh
5. Luôn dùng emoji 😊

Thông tin tài chính:
- Đã chi tháng này: ${spentK}k VNĐ
- Đã thu tháng này: ${incomeK}k VNĐ  
- Tổng số dư: ${balanceK}k VNĐ

Danh mục khả dụng: [${catsList}]
KHI user muốn ghi tiêu dùng, HÃY CHỌN 1 danh mục phù hợp nhất từ danh sách trên.

Khi user ghi nhận giao dịch mới, THÊM JSON ẨN ở cuối (sau dấu |||):
|||{"action":"add","amount":X,"type":"EXPENSE"/"INCOME","category":"TênDanhMụcChínhXác"}|||`;

    let prompt = `<|im_start|>system\n${sys}<|im_end|>\n`;

    // Add history (last 3 messages to save memory)
    const recentHistory = history.slice(-3);
    for (const msg of recentHistory) {
        const role = msg.role === 'user' ? 'user' : 'assistant';
        // Truncate long history messages
        const text = msg.text.length > 300 ? msg.text.substring(0, 300) + '...' : msg.text;
        prompt += `<|im_start|>${role}\n${text}<|im_end|>\n`;
    }

    prompt += `<|im_start|>user\n${message}<|im_end|>\n<|im_start|>assistant\n`;
    return prompt;
};

// Parse transaction from user message
export const parseTransactionFromMessage = (message: string): { amount: number; category: string; type: 'EXPENSE' | 'INCOME'; note: string } | null => {
    const lowerMsg = message.toLowerCase();

    // Quick amount extraction
    const match = message.match(/(\d+(?:[.,]\d+)?)\s*(k|tr)?/i);
    if (!match) return null;

    let amount = parseFloat(match[1].replace(',', '.'));
    const unit = (match[2] || '').toLowerCase();

    if (unit === 'k') amount *= 1000;
    else if (unit === 'tr') amount *= 1000000;
    else if (amount < 1000) amount *= 1000; // Assume "50" means "50k"

    if (amount <= 0 || amount > 1000000000) return null;

    // Quick type detection
    const isIncome = /nhận|lương|thưởng|được|salary|income/i.test(lowerMsg);

    // Quick category naming (heuristic fallback)
    let category = 'Khác';
    if (/ăn|phở|cơm|trà|café|coffee|food/i.test(lowerMsg)) category = 'Ăn uống';
    else if (/áo|quần|mua|giày|shopping|thịt/i.test(lowerMsg)) category = 'Mua sắm';
    else if (/grab|taxi|xăng|xe/i.test(lowerMsg)) category = 'Di chuyển';

    return { amount, category, type: isIncome ? 'INCOME' : 'EXPENSE', note: message.substring(0, 30) };
};

export const sendMessageToLlama = async (
    message: string,
    history: { role: 'user' | 'model'; text: string }[],
    settings: AppSettings,
    transactions: Transaction[],
    accounts: Account[],
    categories: Category[]
): Promise<string> => {
    const totalSpent = transactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((acc, t) => acc + t.amount, 0);
    const totalIncome = transactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((acc, t) => acc + t.amount, 0);
    const balance = accounts.reduce((sum, a) => sum + a.balance, 0);

    // Get unique category names
    const categoryNames = Array.from(new Set(categories.map(c => c.name)));

    try {
        const prompt = buildSmartPrompt(message, history, totalSpent, totalIncome, balance, categoryNames);
        console.log('Smart prompt chars:', prompt.length);

        const result = await LlamaAI.chat({
            prompt,
            n_predict: 120, // Reduced length
            temperature: 0.5,
            top_k: 40,
            repeat_penalty: 1.2,
            stop: ['<|im_end|>', '<|im_start|>', 'User:']
        } as any);

        let response = result.response || "OK";
        response = response.replace(/<\|im_end\|>/g, '').replace(/<\|im_start\|>/g, '').trim();

        return response;
    } catch (error: any) {
        console.error("LlamaAI Error:", error);
        return `Lỗi: ${error.message || 'Unknown'}`;
    }
};
