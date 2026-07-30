const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

export async function generateChatReply(history) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const response = await fetch(`${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: history.map(({ role, text }) => ({
        role: role === 'assistant' ? 'model' : 'user',
        parts: [{ text }],
      })),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody);
  }

  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.map((part) => part.text).join('') ?? '';
  return reply;
}
