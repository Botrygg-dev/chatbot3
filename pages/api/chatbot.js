import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "Missing or invalid messages array." });
    }

    const chat = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messages,
    });

    const reply = chat.choices[0].message.content;
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("OpenAI API error:", error.message);
    return res.status(500).json({ reply: "Fel vid kontakt med GPT." });
  }
}