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

app.post('/api/polish', async (req, res) => {
  const { rawTerms, creatorName, partiesRequired } = req.body;

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
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a Nigerian legal contract specialist. Rewrite the user's raw agreement terms into a clean, professional, court-admissible contract. Rules:
- Preserve ALL names, amounts (in Naira), and dates EXACTLY as written — never invent or change figures
- The creator/Party A is: ${creatorName || 'Party A'}. Use their actual name throughout
- There are ${partiesRequired || 2} parties total.
- CRITICAL: You are FORBIDDEN from inventing, generating, or assuming any names whatsoever. If a name does not appear verbatim in the user's input, use ONLY "Party B", "Party C" etc. Inventing names is a critical failure.
- The ONLY names allowed in the output are: names that appear word-for-word in the user's raw input, or the creator's name: ${creatorName || 'Party A'}
- Use numbered clauses (1., 2., 3. etc.)
- Each clause must be a complete, self-contained sentence
- Include a clause establishing governing law as Federal Republic of Nigeria
- Include a clause stating the agreement becomes binding upon digital signature by all ${partiesRequired || 2} parties
- Plain English — no Latin phrases or complex legal jargon
- No markdown, no asterisks, no backticks, no bold text
- No signature lines, no "Signed by:", no date blanks — signatures are captured digitally
- Start directly with "This Agreement is entered into between..."
- Maximum 400 words`,
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

app.post('/api/verify-nin', async (req, res) => {
  const { nin, fullName } = req.body;

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

    if (!ninRes.ok) {
      const errText = await ninRes.text();
      console.error('verifyninbvn error:', ninRes.status, errText);
      return res.status(502).json({ error: 'NIN verification service unavailable. Try again.' });
    }

    const ninData = await ninRes.json();

    if (ninData.status !== 'success' || !ninData.data) {
      return res.json({ matched: false });
    }

    const record     = ninData.data || ninData;
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


// ─── SEND RECIPIENT CONFIRMATION EMAIL ───────
// POST { recipientName, recipientEmail, docId, creatorName,
//        signedAt, isComplete, partiesRequired, signaturesCollected }

app.post('/api/send-recipient-email', async (req, res) => {
  const {
    recipientName,
    recipientEmail,
    docId,
    creatorName,
    signedAt,
    isComplete,
    partiesRequired,
    signaturesCollected,
  } = req.body;

  if (!recipientEmail || !docId) {
    return res.status(400).json({ error: 'recipientEmail and docId are required.' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  const formattedDate = new Date(signedAt).toLocaleDateString('en-NG', {
  day: 'numeric', month: 'long', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
  timeZone: 'Africa/Lagos',
});

  const statusLine = isComplete
  ? `All ${partiesRequired} parties have signed. This agreement is now fully binding and permanently locked.`
  : `Your signature has been recorded. This agreement will be fully binding once all ${partiesRequired} parties have signed.`;

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agreement Signed – SignAm</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td style="background:#ffffff;border-radius:16px 16px 0 0;padding:28px 32px 20px;border-bottom:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">
                Sign<span style="color:#059669;">Am</span>
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;font-weight:500;letter-spacing:0.5px;text-transform:uppercase;">
                Digital Contract Platform
              </p>
            </td>
          </tr>

          <!-- Green status bar -->
          <tr>
            <td style="background:${isComplete ? '#059669' : '#d97706'};padding:12px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;font-weight:700;color:#ffffff;letter-spacing:0.3px;">
                ${isComplete ? '✓ Agreement Fully Sealed' : '✍️ Signature Recorded'}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:28px 32px;">

              <p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.6;">
                Hi <strong>${recipientName || 'there'}</strong>,
              </p>

              <p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.6;">
                Your signature on the agreement created by <strong>${creatorName}</strong> has been successfully recorded on SignAm.
              </p>

              <!-- Doc ID box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                <tr>
                  <td style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Document ID</p>
                    <p style="margin:0;font-size:16px;font-weight:800;color:#0f172a;font-family:'Courier New',monospace;">${docId}</p>
                  </td>
                </tr>
              </table>

              <!-- Status box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                <tr>
                  <td style="background:${isComplete ? '#ecfdf5' : '#fffbeb'};border:1px solid ${isComplete ? '#a7f3d0' : '#fde68a'};border-radius:10px;padding:14px 18px;">
                    <p style="margin:0;font-size:12px;font-weight:600;color:${isComplete ? '#065f46' : '#92400e'};line-height:1.5;">
                      ${statusLine}
                    </p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background:#f8fafc;border-radius:8px;padding:12px 16px;">
                    <p style="margin:0;font-size:11px;color:#64748b;line-height:1.6;">
                      <strong>Signed at:</strong> ${formattedDate}<br>
                      <strong>Platform:</strong> SignAm (signamnow.com)<br>
                      <strong>Legal basis:</strong> Nigerian Evidence Act 2011
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                Keep your Document ID safe — you may need it for reference if any questions arise about this agreement. 
                ${isComplete ? 'A PDF copy has been made available to the agreement creator.' : ''}
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f1f5f9;border-radius:0 0 16px 16px;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:10px;color:#94a3b8;line-height:1.6;">
                This email was sent because you signed an agreement on SignAm.<br>
                <a href="https://signamnow.com" style="color:#059669;text-decoration:none;font-weight:600;">signamnow.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: recipientEmail,
        subject: `You signed an agreement – ${docId} | SignAm`,
        html: htmlBody,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error('Resend error:', resendRes.status, errText);
      return res.status(502).json({ error: 'Email service error.' });
    }

    const resendData = await resendRes.json();
    return res.json({ sent: true, id: resendData.id });

  } catch (err) {
    console.error('Email send error:', err);
    return res.status(500).json({ error: 'Internal error sending email.' });
  }
});

// ─── SEND CREATOR NOTIFICATION EMAIL ─────────
// POST { creatorName, creatorEmail, docId, signerName,
//        signedAt, isComplete, partiesRequired, signaturesCollected }
 
app.post('/api/send-creator-email', async (req, res) => {
  const {
    creatorName,
    creatorEmail,
    docId,
    signerName,
    signedAt,
    isComplete,
    partiesRequired,
    signaturesCollected,
  } = req.body;
 
  if (!creatorEmail || !docId) {
    return res.status(400).json({ error: 'creatorEmail and docId are required.' });
  }
 
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }
 
  const formattedDate = new Date(signedAt).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Africa/Lagos',
  });
 
  const remaining = (partiesRequired - 1) - signaturesCollected;
 
  const statusLine = isComplete
    ? `All ${partiesRequired} parties have now signed. Your agreement is fully binding and permanently locked.`
    : `${remaining} more signature${remaining === 1 ? '' : 's'} still needed before the agreement is fully binding.`;
 
  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isComplete ? 'Agreement Sealed' : 'New Signature'} – SignAm</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
 
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
 
          <!-- Header -->
          <tr>
            <td style="background:#ffffff;border-radius:16px 16px 0 0;padding:28px 32px 20px;border-bottom:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">
                Sign<span style="color:#059669;">Am</span>
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;font-weight:500;letter-spacing:0.5px;text-transform:uppercase;">
                Digital Contract Platform
              </p>
            </td>
          </tr>
 
          <!-- Status bar -->
          <tr>
            <td style="background:${isComplete ? '#059669' : '#1e40af'};padding:12px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;font-weight:700;color:#ffffff;letter-spacing:0.3px;">
                ${isComplete ? '✓ Agreement Fully Sealed' : '✍️ New Signature on Your Agreement'}
              </p>
            </td>
          </tr>
 
          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:28px 32px;">
 
              <p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.6;">
                Hi <strong>${creatorName || 'there'}</strong>,
              </p>
 
              <p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.6;">
                <strong>${signerName}</strong> has signed your agreement on SignAm.
              </p>
 
              <!-- Doc ID box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                <tr>
                  <td style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Document ID</p>
                    <p style="margin:0;font-size:16px;font-weight:800;color:#0f172a;font-family:'Courier New',monospace;">${docId}</p>
                  </td>
                </tr>
              </table>
 
              <!-- Signature progress -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                <tr>
                  <td style="background:${isComplete ? '#ecfdf5' : '#eff6ff'};border:1px solid ${isComplete ? '#a7f3d0' : '#bfdbfe'};border-radius:10px;padding:14px 18px;">
                    <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:${isComplete ? '#065f46' : '#1e40af'};">
                      ${signaturesCollected} of ${partiesRequired - 1} recipient signature${partiesRequired - 1 === 1 ? '' : 's'} collected
                    </p>
                    <p style="margin:0;font-size:12px;font-weight:500;color:${isComplete ? '#065f46' : '#1e3a8a'};line-height:1.5;">
                      ${statusLine}
                    </p>
                  </td>
                </tr>
              </table>
 
              <!-- Signed at -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                <tr>
                  <td style="background:#f8fafc;border-radius:8px;padding:12px 16px;">
                    <p style="margin:0;font-size:11px;color:#64748b;line-height:1.6;">
                      <strong>Signed at:</strong> ${formattedDate}<br>
                      <strong>Signer:</strong> ${signerName}<br>
                      <strong>Platform:</strong> SignAm (signamnow.com)
                    </p>
                  </td>
                </tr>
              </table>
 
              ${isComplete ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
                <tr>
                  <td style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:14px 18px;text-align:center;">
                    <p style="margin:0;font-size:12px;font-weight:700;color:#065f46;">
                      🔒 Log in to your SignAm dashboard to download the completed PDF.
                    </p>
                  </td>
                </tr>
              </table>
              ` : `
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                Share the signing link with the remaining parties to complete the agreement.
              </p>
              `}
 
            </td>
          </tr>
 
          <!-- Footer -->
          <tr>
            <td style="background:#f1f5f9;border-radius:0 0 16px 16px;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:10px;color:#94a3b8;line-height:1.6;">
                This notification was sent because you created an agreement on SignAm.<br>
                <a href="https://signamnow.com" style="color:#059669;text-decoration:none;font-weight:600;">signamnow.com</a>
              </p>
            </td>
          </tr>
 
        </table>
      </td>
    </tr>
  </table>
 
</body>
</html>
  `.trim();
 
  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: creatorEmail,
        subject: isComplete
          ? `✓ Agreement sealed – ${docId} | SignAm`
          : `${signerName} signed your agreement – ${docId} | SignAm`,
        html: htmlBody,
      }),
    });
 
    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error('Resend creator email error:', resendRes.status, errText);
      return res.status(502).json({ error: 'Email service error.' });
    }
 
    const resendData = await resendRes.json();
    return res.json({ sent: true, id: resendData.id });
 
  } catch (err) {
    console.error('Creator email send error:', err);
    return res.status(500).json({ error: 'Internal error sending email.' });
  }
});


// ─── EXPORT ──────────────────────────────────

export const polishTerms = onRequest(
  { cors: false, secrets: ['GROQ_API_KEY', 'VERIFYNINBVN_API_KEY', 'RESEND_API_KEY'] },
  app
);