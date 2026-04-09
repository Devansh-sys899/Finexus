const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

/**
 * 🔹 INTENT DETECTION (LLM → JSON)
 */
const getIntent = async (message) => {
  const prompt = `
You are an AI intent classifier for a finance assistant.

Classify the user message into ONE of these intents:
- add_expense
- get_expenses
- update_expense
- delete_expense
- create_invoice
- get_invoices
- send_invoice
- get_analytics
- add_reminder
- get_reminders
- complete_reminder
- unknown

Also extract relevant entities if present.

Return ONLY valid JSON (no explanation, no markdown):

{
  "intent": "string",
  "confidence": number (0 to 1),
  "entities": {
    "amount": number,
    "category": "string",
    "description": "string",
    "date": "string",
    "person": "string"
  }
}

User message:
"${message}"
`;

  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2, // more deterministic
      messages: [{ role: "user", content: prompt }],
    });

    let text = response.choices[0].message.content;

    // 🔥 Clean markdown if LLM returns ```json
    text = text.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(text);

    return parsed;
  } catch (err) {
    console.error("❌ Intent parsing error:", err.message);

    // ✅ Safe fallback (VERY IMPORTANT)
    return {
      intent: "unknown",
      confidence: 0,
      entities: {},
    };
  }
};

/**
 * 🔹 RESPONSE GENERATION (LLM → HUMAN TEXT)
 */
const generateResponse = async ({ userMessage, intent, data, analytics }) => {
  const prompt = `
You are a smart AI financial assistant helping freelancers manage money.

User said:
"${userMessage}"

Intent:
${intent}

Transaction Data:
${JSON.stringify(data)}

Analytics Summary:
${JSON.stringify(analytics)}

Your job:
1. Clearly confirm the action taken
2. Mention amount, category, or relevant details
3. Add 1 useful financial insight from analytics
4. Optionally give a small suggestion (only if meaningful)

Style:
- Friendly but professional
- Concise (2–4 lines max)
- Use ₹ for currency
- Sound natural, not robotic

Example:

Input: Add expense 500 for food  
Output:  
Added ₹500 under food 💸  
Your total spending is ₹2,300, with food being your top category. You might want to balance it a bit.

---

Now generate the response:
`;

  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error("❌ Response generation error:", err.message);

    // ✅ Fallback response (never break UX)
    if (data?.amount && data?.category) {
      return `₹${data.amount} added under ${data.category} 💸`;
    }

    return "Your request has been processed successfully.";
  }
};

module.exports = {
  getIntent,
  generateResponse,
};