import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'https://signamnow.com',
  'https://www.signamnow.com',
  'https://ejayszn.github.io'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS policy'));
  }
}));
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
            content: `You are a Nigerian legal contract specialist. Rewrite the user's raw agreement terms into a clean, professional, court-admissible contract. Rules:
- Preserve ALL names, amounts (₦/Naira), and dates EXACTLY as written — never invent or change figures
- Use numbered clauses (1., 2., 3. etc.)
- Each clause must be a complete, self-contained sentence
- Include a clause establishing governing law as Federal Republic of Nigeria
- Include a clause stating the agreement is binding from the date of both parties' digital signatures
- Plain English — no Latin phrases or complex legal jargon
- No markdown, no asterisks, no backticks, no headers, no bold text
- Do not address the parties as "Party A" or "Party B" — use their actual names as written
- Start directly with "This Agreement is entered into between..." 
- Maximum 350 words`,
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


// ─── NIN VERIFICATION ────────────────────────
// POST { nin: string, fullName: string } → { matched: boolean, error?: string }
//
// Calls verifyninbvn.com.ng (₦150/call).
// Compares returned firstname+surname against the submitted fullName
// using a case-insensitive token match — handles "Emmanuel O. Ejay" vs "EMMANUEL EJAY" etc.

app.post('/api/verify-nin', async (req, res) => {
  const { nin, fullName } = req.body;

  // Basic input validation
  if (!nin || !/^\d{11}$/.test(nin.trim())) {
    return res.status(400).json({ error: 'A valid 11-digit NIN is required.' });
  }

  const ninApiKey = process.env.VERIFYNINBVN_API_KEY;
  if (!ninApiKey) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const ninRes = await fetch('http://verifyninbvn.com.ng/api/nin-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ninApiKey,
      },
      body: JSON.stringify({
      nin: nin.trim(),
      consent: true,
    }),
  });

    // Surface provider errors clearly
    if (!ninRes.ok) {
      const errText = await ninRes.text();
      console.error('verifyninbvn error:', ninRes.status, errText);
      return res.status(502).json({ error: 'NIN verification service unavailable. Try again.' });
    }

    const ninData = await ninRes.json();

    // Provider returns status: 'success' on a valid NIN
    if (ninData.status !== 'success' || !ninData.data) {
      // NIN not found in database
      return res.json({ matched: false });
    }

    const record = ninData.data || ninData;
const firstname  = (record.firstname  || '').trim();
const middlename = (record.middlename || '').trim();
const surname    = (record.surname    || '').trim();

const fullNameFromNIN = [firstname, middlename, surname]
  .filter(Boolean)
  .join(' ');

return res.json({ matched: true, fullName: fullNameFromNIN });

  } catch (err) {
    console.error('NIN verification error:', err);
    return res.status(500).json({ error: 'Internal error during NIN verification.' });
  }
});


// ─── EXPORT ──────────────────────────────────

export const polishTerms = onRequest(
  { cors: false, secrets: ['GROQ_API_KEY', 'VERIFYNINBVN_API_KEY'] },
  app
);