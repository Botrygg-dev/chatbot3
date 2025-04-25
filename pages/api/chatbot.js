import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔍 Simulerad dokument-sökning baserat på nyckelord
function getDocumentContext(userQuestion) {
  const docs = {
    andrahandsuthyrning: [
      "Andrahandsuthyrning kräver godkänt från Botrygg och får beviljas max 1 år åt gången.",
      "Du måste ha beaktansvärda skäl, t.ex. studier eller arbete på annan ort.",
      "Totalt får du hyra ut i andra hand max 3 år.",
    ],
    uppsägning: [
      "Uppsägningstiden är alltid 3 månader från när uppsägningen inkommer.",
      "Uppsägningen bör ske via Mina sidor, men går också via e-post eller post.",
    ],
    parkering: [
      "Parkeringstillstånd krävs på vissa anläggningar och ska vara synligt i bilen.",
      "Vid utflyttning ska P-tillstånd lämnas tillbaka senast kl 12.00.",
    ],
    inflyttning: [
      "Två personer från Botrygg ska närvara vid tillträde.",
      "Nycklar kvitteras ut och inflyttningsprotokoll ska fyllas i.",
    ],
  };

  const lowerQ = userQuestion.toLowerCase();
  let context = [];

  for (const [topic, facts] of Object.entries(docs)) {
    if (lowerQ.includes(topic)) {
      context = context.concat(facts);
    }
  }

  return context;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "Missing or invalid messages array." });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const extraContext = getDocumentContext(lastUserMessage);

    const systemPrompt = {
      role: "system",
      content:
        "Du är en trevlig, hjälpsam och professionell kundtjänstmedarbetare på Botrygg. Svara tydligt, korrekt och gärna med en personlig ton. Om du inte vet svaret på en fråga, säg att du inte är säker istället för att gissa. Här är dokumentinformation som du kan använda:\n\n" +
        extraContext.join("\n"),
    };

    const chat = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [systemPrompt, ...messages],
    });

    const reply = chat.choices[0].message.content;
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("OpenAI API error:", error.message);
    return res.status(500).json({ reply: "Fel vid kontakt med GPT." });
  }
}
