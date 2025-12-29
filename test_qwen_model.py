#!/usr/bin/env python3
"""
Using llama-cpp-python (v0.2.90+)
"""

try:
    from llama_cpp import Llama
except ImportError:
    print("❌ llama-cpp-python not installed correctly!")
    exit(1)

import json
import sys

# Model path
MODEL_PATH = r"C:\Users\MSI\Desktop\AILLM\capacitor-llama\android\src\main\assets\models\qwen2.5-0.5b-instruct-q4_k_m.gguf"

# Categories - English
EXPENSE_CATEGORIES = [
    # Food & Drink
    "Breakfast", "Lunch", "Dinner", "Coffee", "Snacks", "Drinks/Party", 
    # Transport
    "Fuel", "Parking", "Taxi", "Maintenance", "Tickets", 
    # Housing
    "Rent", "Electricity", "Water", "Internet", "Gas", "Cleaning", "Repairs", 
    # Shopping
    "Clothing", "Shoes", "Cosmetics", "Accessories", "Household", "Electronics", 
    # Personal/Health
    "Haircut", "Gym", "Medicine", "Doctor", 
    # Entertainment/Family/Other
    "Movies", "Travel", "Books", "Tuition", "Baby Supplies", 
    "Weddings", "Gifts", "Charity", "Other"
]

INCOME_CATEGORIES = [
    "Salary", "Bonus", "Interest", "Selling", "Gift", "Refund", "Other"
]

def build_prompt(message: str) -> str:
    """Build English prompt"""
    expense_list = ", ".join(EXPENSE_CATEGORIES)
    income_list = ", ".join(INCOME_CATEGORIES)
    
    system_prompt = f"""You are a smart financial AI assistant.

EXPENSE CATEGORIES: [{expense_list}]
INCOME CATEGORIES: [{income_list}]

TASK: Analyze the user input and return a JSON action. Select the most appropriate category from the lists above.

ACTIONS AND FORMAT:
1. Add Expense:
{{"action":"add_expense","params":{{"amount":number,"category":"Category Name","note":"detailed note"}}}}

2. Add Income:
{{"action":"add_income","params":{{"amount":number,"category":"Category Name","note":"detailed note"}}}}

3. Get Total Expense:
{{"action":"get_total_expense","params":{{"period":"this_month"}}}}
(period: this_month, last_month, this_year)

4. Get Balance:
{{"action":"get_balance","params":{{}}}}

5. Casual Chat:
{{"action":"chat","params":{{"message":"concise response"}}}}

RULES:
- Handle amounts in different formats (e.g., "40k" -> 40000, "$5" -> 5).
- If no exact category match, choose the closest one or "Other".
- ALWAYS return valid JSON. No markdown formatting.
"""

    prompt = f"<|im_start|>system\n{system_prompt}<|im_end|>\n<|im_start|>user\n{message}<|im_end|>\n<|im_start|>assistant\n"
    return prompt


def parse_response(response: str) -> dict | None:
    """Parse JSON from response"""
    try:
        # Clean response
        response = response.replace("<|im_end|>", "").replace("<|im_start|>", "").strip()
        
        # Find JSON
        json_start = response.find("{")
        json_end = response.rfind("}") + 1
        if json_start >= 0 and json_end > json_start:
            json_str = response[json_start:json_end]
            return json.loads(json_str)
    except:
        pass
    return None


def main():
    print("=" * 60)
    print("🚀 Loading Qwen 2.5-3B model via llama-cpp-python...")
    print(f"   Path: {MODEL_PATH}")
    print("   This may take a minute...")
    print("=" * 60)
    
    try:
        # Load model with llama-cpp-python
        llm = Llama(
            model_path=MODEL_PATH,
            n_ctx=2048,        # Context size
            n_threads=4,       # Number of threads
            n_batch=512,       # Batch size
            verbose=False      # Suppress verbose output
        )
        
        print("\n✅ Model loaded successfully!")
        print("=" * 60)
        print("💬 MoneyMate AI Chat")
        print("   Type your message to chat (or 'quit' to exit)")
        print("=" * 60)
        
        while True:
            try:
                # Get user input
                user_input = input("\n👤 You: ").strip()
                
                if not user_input:
                    continue
                
                if user_input.lower() in ['quit', 'exit', 'q']:
                    print("👋 Tạm biệt!")
                    break
                
                # Build prompt
                prompt = build_prompt(user_input)
                
                # Generate response
                print("🤖 AI: ", end="", flush=True)
                
                output = llm(
                    prompt,
                    max_tokens=200,        # Max tokens to generate
                    temperature=0.3,       # Lower for deterministic
                    top_k=20,
                    top_p=0.85,
                    repeat_penalty=1.1,
                    stop=["<|im_end|>", "<|im_start|>", "\n\n"]
                )
                
                response = output["choices"][0]["text"].strip()
                
                # Parse and display
                parsed = parse_response(response)
                
                if parsed:
                    action = parsed.get("action", "unknown")
                    params = parsed.get("params", {})
                    
                    if action == "add_expense":
                        try:
                            amount = int(params.get("amount", 0))
                        except:
                            amount = 0
                        category = params.get("category", "Khác")
                        print(f"Đã ghi chi {amount:,}đ vào {category} 💸")
                        
                    elif action == "add_income":
                        try:
                            amount = int(params.get("amount", 0))
                        except:
                            amount = 0
                        print(f"Đã ghi thu {amount:,}đ 💰")
                        
                    elif action == "get_total_expense":
                        print("Tổng chi tiêu tháng này: xxx đ 📊")
                        
                    elif action == "get_balance":
                        print("Số dư hiện tại: xxx đ 💳")
                        
                    elif action == "chat":
                        msg = params.get("message", "...")
                        print(msg)
                        
                    else:
                        print(f"Action: {action}")
                        
                    print(f"   [JSON: {json.dumps(parsed, ensure_ascii=False)}]")
                else:
                    # No valid JSON, show raw response
                    clean = response.replace("<|im_end|>", "").strip()
                    print(clean if clean else "Tôi chưa hiểu...")
                    if clean:
                         print(f"   (Raw: {clean})")

            except KeyboardInterrupt:
                print("\n👋 Tạm biệt!")
                break
            except Exception as e:
                print(f"❌ Error generating: {e}")

    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        print("   Make sure the path is correct and file is a valid GGUF.")

if __name__ == "__main__":
    main()
