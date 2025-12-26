import { GoogleGenAI, Type } from "@google/genai";
import { AppSettings, Transaction, Account, TransactionType } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

// System instructions based on Persona
const getSystemInstruction = (settings: AppSettings, totalIncome: number, totalSpent: number, accounts: Account[]) => {
  let tone = "";
  switch (settings.persona) {
    case 'friendly': tone = "Bạn là một người bạn thân thiện, luôn động viên. Dùng emoji."; break;
    case 'strict': tone = "Bạn là một kế toán nghiêm khắc. Cảnh báo gay gắt nếu tiêu hoang."; break;
    case 'sarcastic': tone = "Bạn là một trợ lý hay châm biếm hài hước về thói quen chi tiêu."; break;
    case 'professional': default: tone = "Bạn là chuyên gia tài chính chuyên nghiệp, ngắn gọn, súc tích."; break;
  }

  const accountList = accounts.map(a => `- ${a.name} (ID: ${a.id})`).join('\n');

  return `
    ${tone}
    Bạn là MoneyMate AI, trợ lý tài chính cá nhân.
    
    Dữ liệu hiện tại:
    - Tổng thu nhập tháng: ${totalIncome} ${settings.currency}
    - Tổng chi tiêu tháng: ${totalSpent} ${settings.currency}
    - Hạn mức chi tiêu: ${settings.monthlyLimit} ${settings.currency}
    - Các tài khoản khả dụng:
    ${accountList}
    
    Quy tắc quan trọng:
    1. Trả lời ngắn gọn, phù hợp giao diện mobile.
    2. Nếu người dùng nhập thông tin giao dịch, hãy trích xuất dữ liệu JSON.
    3. Phân biệt rõ "Thu nhập" (Lương, thưởng, được tặng) và "Chi tiêu" (Mua sắm, ăn uống).
    4. Cố gắng đoán tài khoản nguồn (accountId) dựa trên ngữ cảnh (ví dụ: "quẹt thẻ" -> Credit, "tiền mặt" -> Cash). Nếu không rõ, mặc định chọn tài khoản đầu tiên hoặc phù hợp nhất.
    
    Định dạng JSON Output (đặt ở cuối câu trả lời):
    \`\`\`json
    {
      "action": "add_transaction",
      "amount": number,
      "category": string,
      "note": string,
      "date": "YYYY-MM-DD",
      "type": "INCOME" | "EXPENSE",
      "accountId": string
    }
    \`\`\`
  `;
};

export const sendMessageToGemini = async (
  message: string, 
  history: { role: 'user' | 'model'; text: string }[],
  settings: AppSettings,
  transactions: Transaction[],
  accounts: Account[]
) => {
  const totalSpent = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
  const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
  
  try {
    const model = 'gemini-3-flash-preview'; 
    const instruction = getSystemInstruction(settings, totalIncome, totalSpent, accounts);

    const chatHistory = history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));

    const chat = genAI.chats.create({
      model: model,
      config: {
        systemInstruction: instruction,
      },
      history: chatHistory
    });

    const result = await chat.sendMessage({
      message: message
    });

    return result.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.";
  }
};

export const analyzeReceiptImage = async (base64Image: string) => {
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Hãy trích xuất tổng số tiền và hạng mục chính từ hoá đơn này. Trả về JSON: { amount: number, category: string, date: string (YYYY-MM-DD), note: string }" }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING },
            date: { type: Type.STRING },
            note: { type: Type.STRING }
          }
        }
      }
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Receipt Analysis Error:", error);
    return null;
  }
};

export const getSpendingInsights = async (transactions: Transaction[], settings: AppSettings) => {
  const summary = transactions.map(t => 
    `${t.date}: ${t.type === 'INCOME' ? '+' : '-'}${t.amount} (${t.category})`
  ).join('\n');

  const prompt = `
    Dựa trên lịch sử giao dịch sau, hãy đưa ra một nhận xét ngắn gọn (tối đa 2 câu) về tình hình tài chính.
    Cân đối giữa thu và chi.
    Persona: ${settings.persona}.
    Data:
    ${summary}
  `;

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (e) {
    return "Chưa đủ dữ liệu để phân tích.";
  }
};