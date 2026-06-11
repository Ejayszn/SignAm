import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// ─── POLISH TERMS ────────────────────────────
// POST { rawTerms: string } → { polishedTerms: string }

app.post('/api/polish', async (req, res) => {
  const { rawTerms } = req.body;

  if (!rawTerms?.trim()) {
    return res.status(400).json({ error: 'No terms provided.' });
  }

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are a Nigerian legal contract specialist. Rewrite the user's raw agreement terms into clean, professional, legally structured paragraphs. Rules:
- Preserve ALL names, amounts (₦/Naira), and dates exactly as written
- Use numbered clauses (1., 2., 3. etc.)
- Plain English — no complex legal jargon
- No markdown formatting, no backticks, no headers
- Start directly with the contract text, no preamble
- Maximum 300 words`,
          },
          {
            role: 'user',
            content: rawTerms,
          },
        ],
        temperature: 0.2,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq error:', errText);
      return res.status(502).json({ error: 'AI service unavailable. Try again.' });
    }

    const data = await response.json();
    const polished = data.choices?.[0]?.message?.content?.trim();

    if (!polished) {
      return res.status(502).json({ error: 'Empty response from AI. Try again.' });
    }

    res.json({ polishedTerms: polished });

  } catch (err) {
    console.error('Polish endpoint error:', err);
    res.status(500).json({ error: 'Internal error. Please try again.' });
  }
});

export const polishTerms = onRequest({ cors: false, secrets: ["GROQ_API_KEY"] }, app);