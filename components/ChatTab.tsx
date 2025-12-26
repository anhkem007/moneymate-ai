import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Camera, Loader2, Bot } from 'lucide-react';
import { ChatMessage, AppSettings, Transaction, Account, TransactionType, Category } from '../types';
import { sendMessageToLlama, parseTransactionFromMessage } from '../services/llamaService';

interface ChatTabProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  settings: AppSettings;
  transactions: Transaction[];
  accounts: Account[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onAddMessage?: (role: 'user' | 'model', content: string) => Promise<void>;
  categories: Category[];
}

const ChatTab: React.FC<ChatTabProps> = ({ messages, setMessages, settings, transactions, accounts, categories, onAddTransaction, onAddMessage }) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const text = inputText;
    const tempUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
    };

    // 1. Clear input and show loading
    setInputText('');
    setIsLoading(true);

    // 2. Persist user message
    if (onAddMessage) {
      await onAddMessage('user', text);
    }

    // 3. Helper vars
    let transactionAdded = false;
    let cleanText = '';

    // 4. Try to parse transaction directly from user message
    const parsedTransaction = parseTransactionFromMessage(text);

    if (parsedTransaction) {
      const targetAccount = accounts[0];
      onAddTransaction({
        amount: parsedTransaction.amount,
        category: parsedTransaction.category,
        categoryId: parsedTransaction.category.toLowerCase().replace(/\s/g, '_'),
        date: new Date().toISOString(),
        note: parsedTransaction.note,
        type: parsedTransaction.type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE,
        accountId: targetAccount.id
      });
      transactionAdded = true;
    }

    // 5. Call Local LlamaAI
    try {
      const responseText = await sendMessageToLlama(
        text,
        messages.map(m => ({ role: m.role, text: m.text })),
        settings,
        transactions,
        accounts,
        categories
      );

      console.log('[Llama] Raw Response:', responseText);

      // Clean up response
      cleanText = responseText;
      cleanText = cleanText.replace(/<\|im_end\|>/g, '')
        .replace(/<\|im_start\|>/g, '')
        .replace(/```json[\s\S]*?```/g, '')
        .replace(/\|\|\|\s*\{[^{}]*\}\s*\|\|\|/g, '');

      cleanText = cleanText.replace(/\{[^{}]*"action"\s*:\s*"[^"]*"[^{}]*\}/g, '');
      cleanText = cleanText.trim();

      // Check for hidden JSON response
      const jsonMatch = responseText.match(/\|\|\|\s*(\{[^{}]*"action"\s*:\s*"add"[^{}]*\})\s*\|\|\|/) ||
        responseText.match(/(\{[^{}]*"action"\s*:\s*"add"[^{}]*\})/);

      // Fallback if text is empty
      if (!cleanText && !transactionAdded) {
        if (jsonMatch) {
          cleanText = "Đã xử lý yêu cầu.";
        } else {
          cleanText = "Tôi chưa hiểu ý bạn hoặc có lỗi xảy ra.";
        }
      }

      // Handle JSON action if found and not parsed locally
      if (jsonMatch && !transactionAdded) {
        try {
          const data = JSON.parse(jsonMatch[0]);
          if (data.action === 'add') {
            const targetAccount = accounts.find(a => a.id === data.accountId) || accounts[0];
            onAddTransaction({
              amount: data.amount,
              category: data.category || 'Khác',
              date: data.date || new Date().toISOString(),
              note: data.note || 'Qua chat AI',
              type: data.type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE,
              accountId: targetAccount.id
            });
            transactionAdded = true;
          }
        } catch (e) {
          console.error("Failed to parse AI auto-add", e);
        }
      }

      // Add confirmation text
      if (transactionAdded) {
        const amt = parsedTransaction?.amount || 0;
        const cat = parsedTransaction?.category || 'Giao dịch';
        const typ = parsedTransaction?.type || 'EXPENSE';
        // If parsed locally
        if (parsedTransaction) {
          cleanText = (cleanText || 'Đã ghi nhận!') + `\n\n✅ Đã ghi nhận: ${typ === 'INCOME' ? '+' : '-'}${amt.toLocaleString()} VNĐ (${cat})`;
        } else {
          // If parsed from JSON
          cleanText = (cleanText || 'Đã ghi nhận!') + `\n\n✅ Đã ghi nhận giao dịch mới.`;
        }
      }

      // 6. Persist AI message
      if (onAddMessage) {
        await onAddMessage('model', cleanText);
      }

    } catch (error) {
      console.error("Llama Error", error);
      if (onAddMessage) {
        await onAddMessage('model', "Xin lỗi, đã có lỗi xảy ra khi xử lý.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    setInputText(q);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header - fixed at top */}
      <div className="bg-white p-4 shadow-sm flex items-center space-x-3 shrink-0">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
          <Bot className="text-emerald-600" size={24} />
        </div>
        <div>
          <h1 className="font-bold text-slate-800">MoneyMate AI</h1>
          <p className="text-xs text-slate-500">
            {settings.persona === 'strict' ? 'Kế toán trưởng' : settings.persona === 'friendly' ? 'Bạn đồng hành' : 'Trợ lý tài chính'}
          </p>
        </div>
      </div>

      {/* Messages - scrollable middle */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm whitespace-pre-wrap ${msg.role === 'user'
                ? 'bg-emerald-600 text-white rounded-br-none'
                : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-slate-100 shadow-sm flex items-center space-x-2">
              <Loader2 className="animate-spin text-emerald-600" size={16} />
              <span className="text-xs text-slate-500">Đang suy nghĩ...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length < 3 && (
        <div className="px-4 pb-2 shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {["Tháng này tôi tiêu bao nhiêu?", "Tổng tài sản còn bao nhiêu?"].map((q, i) => (
              <button
                key={i}
                onClick={() => handleQuickQuestion(q)}
                className="whitespace-nowrap bg-white border border-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs shadow-sm hover:bg-emerald-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area - fixed at bottom */}
      <div className="bg-white p-3 border-t border-slate-200 shrink-0">
        <div className="flex items-center space-x-2 bg-slate-100 rounded-full px-4 py-2">
          <button className="text-slate-400 hover:text-emerald-600">
            <Camera size={20} />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Nhập chi tiêu hoặc hỏi..."
            className="flex-1 bg-transparent outline-none text-slate-700 placeholder-slate-400 text-sm"
          />
          <button className="text-slate-400 hover:text-emerald-600">
            <Mic size={20} />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className={`p-2 rounded-full transition-colors ${inputText.trim() ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
              }`}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatTab;