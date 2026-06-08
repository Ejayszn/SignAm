// ─────────────────────────────────────────────
//  SignAm — sign.js
//  Recipient signing page: load contract → verify → sign → submit
// ─────────────────────────────────────────────

// ─── MOCK DATA ───────────────────────────────
// In production this is fetched server-side by document ID.
// The phone numbers must NEVER live in client-side JS in production —
// the match check must happen on your backend API.

const mockDatabase = {
  "SIG-8392A83F": {
    creatorName: "Emmanuel Oguibe",
    terms: "I am giving Musa ₦150,000 today to buy market supply. He promises to pay me back completely on or before July 15th, 2026. If he doesn't pay, I will collect his remaining shop goods.",
    parties: [
      { name: "Emmanuel Oguibe",  phone: "08012345678", isCreator: true  },
      { name: "Alhaji Musa Bello", phone: "09087654321", isCreator: false },
    ],
  },
};


// ─── URL PARAM ───────────────────────────────

const urlParams   = new URLSearchParams(window.location.search);
const activeDocId = (urlParams.get('id') || 'SIG-8392A83F').toUpperCase();


// ─── DOM REFS ────────────────────────────────

const inviterName    = document.getElementById('inviterName');
const docIdDisplay   = document.getElementById('docIdDisplay');
const displayTerms   = document.getElementById('displayTerms');
const partiesList    = document.getElementById('partiesList');
const signaturesGrid = document.getElementById('signaturesGrid');

const verificationPhase = document.getElementById('verificationPhase');
const signingPhase      = document.getElementById('signingPhase');
const successScreen     = document.getElementById('successScreen');
const finalDocId        = document.getElementById('finalDocId');

const verifyPhoneInput = document.getElementById('verifyPhone');
const verifyPhoneBtn   = document.getElementById('verifyPhoneBtn');
const verifyError      = document.getElementById('verifyError');

const canvas    = document.getElementById('receiverCanvas');
const ctx       = canvas.getContext('2d');
const canvasHint = document.getElementById('canvasHint');
const signError = document.getElementById('signError');

const clearBtn  = document.getElementById('clearReceiverCanvasBtn');
const submitBtn = document.getElementById('submitSignatureBtn');


// ─── STATE ───────────────────────────────────

let currentAgreement  = null;
let verifiedParty     = null;
let isDrawing         = false;
let hasDrawn          = false;
let canvasEventsLive  = false; // Canvas events attached ONLY after verification


// ─── LOAD CONTRACT ───────────────────────────

function loadAgreement() {
  const agreement = mockDatabase[activeDocId];

  if (!agreement) {
    showFatalError(`Agreement "${activeDocId}" was not found or has expired.`);
    return;
  }

  currentAgreement = agreement;

  docIdDisplay.textContent = activeDocId;
  inviterName.textContent  = agreement.creatorName;
  displayTerms.textContent = agreement.terms;

  // Parties list
  partiesList.innerHTML = agreement.parties
    .map((p, i) => `
      <p class="text-xs text-slate-700">
        <strong>Party ${String.fromCharCode(65 + i)}${p.isCreator ? ' (Creator)' : ''}:</strong> ${p.name}
      </p>
    `)
    .join('');

  // Signatures grid
  signaturesGrid.innerHTML = agreement.parties
    .map((p, i) => {
      const isSigned   = p.isCreator; // Creator is already signed
      const labelClass = isSigned ? 'text-emerald-700 font-bold' : 'text-amber-700 font-semibold';
      const boxClass   = isSigned
        ? 'border border-slate-200 bg-emerald-50/30 rounded-xl flex items-center justify-center p-1'
        : 'border border-dashed border-amber-300 bg-amber-50/30 rounded-xl flex items-center justify-center text-center';
      const inner = isSigned
        ? `<span class="text-[10px] font-bold text-emerald-700 px-2 py-0.5 bg-emerald-100/50 rounded border border-emerald-200">✍️ SIGNED</span>`
        : `<span class="text-[9px] text-amber-700 font-semibold tracking-tight" id="receiverSigPlaceholder">Awaiting Your Action</span>`;

      return `
        <div class="space-y-1">
          <p class="text-[9px] text-slate-500 uppercase font-bold tracking-wider">${p.name}</p>
          <div class="h-14 w-full ${boxClass}">${inner}</div>
        </div>
      `;
    })
    .join('');
}

function showFatalError(msg) {
  document.querySelector('main').innerHTML = `
    <div class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-2">
      <p class="text-sm font-bold text-red-800">Document Not Found</p>
      <p class="text-xs text-red-600">${msg}</p>
    </div>
  `;
}


// ─── PHONE VERIFICATION ──────────────────────
// ⚠️  PRODUCTION NOTE: move the phone match to your server.
//     The API call should be: POST /api/verify { docId, phone }
//     and return { matched: true/false, partyName: string }
//     so phone numbers never touch the client bundle.

verifyPhoneBtn.addEventListener('click', handleVerification);
verifyPhoneInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleVerification();
});

function handleVerification() {
  const entered = verifyPhoneInput.value.trim();
  clearError(verifyError, verifyPhoneInput);

  if (!entered) {
    showError(verifyError, verifyPhoneInput, 'Please enter your WhatsApp number.');
    return;
  }

  if (!currentAgreement) return;

  const match = currentAgreement.parties.find(
    p => p.phone === entered && !p.isCreator
  );

  if (!match) {
    showError(
      verifyError,
      verifyPhoneInput,
      'That number is not listed as a recipient for this agreement. Please check and try again.'
    );
    return;
  }

  verifiedParty = match;

  // Transition to signing phase
  verificationPhase.classList.add('hidden');
  signingPhase.classList.remove('hidden');

  // Update the receiver's signature placeholder to show active state
  const placeholder = document.getElementById('receiverSigPlaceholder');
  if (placeholder) {
    placeholder.innerHTML = `<span class="text-[9px] text-emerald-600 font-bold animate-pulse">✍️ Signing Active...</span>`;
  }

  initCanvas();
  attachCanvasEvents(); // FIX: events attached ONLY after identity verified
}


// ─── CANVAS ──────────────────────────────────

function initCanvas() {
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  ctx.lineWidth   = 2.5;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.strokeStyle = '#047857';
}

function getXY(e) {
  const rect = canvas.getBoundingClientRect();
  if (e.touches?.length) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
    };
  }
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function onDrawStart(e) {
  isDrawing = true;
  const { x, y } = getXY(e);
  ctx.beginPath();
  ctx.moveTo(x, y);
  if (e.cancelable) e.preventDefault();
}

function onDraw(e) {
  if (!isDrawing) return;
  const { x, y } = getXY(e);
  ctx.lineTo(x, y);
  ctx.stroke();
  if (e.cancelable) e.preventDefault();

  if (!hasDrawn) {
    hasDrawn = true;
    canvasHint.style.display = 'none';
  }
}

function onDrawEnd() {
  isDrawing = false;
}

// FIX: canvas events are only registered after verification succeeds
function attachCanvasEvents() {
  if (canvasEventsLive) return;
  canvasEventsLive = true;

  canvas.addEventListener('mousedown',  onDrawStart);
  canvas.addEventListener('mousemove',  onDraw);
  window.addEventListener('mouseup',    onDrawEnd);
  canvas.addEventListener('touchstart', onDrawStart, { passive: false });
  canvas.addEventListener('touchmove',  onDraw,      { passive: false });
  canvas.addEventListener('touchend',   onDrawEnd);
}

clearBtn.addEventListener('click', () => {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  hasDrawn = false;
  canvasHint.style.display = '';
  clearError(signError);
});


// ─── SUBMISSION ──────────────────────────────

function isCanvasBlank() {
  const blank = document.createElement('canvas');
  blank.width  = canvas.width;
  blank.height = canvas.height;
  return canvas.toDataURL() === blank.toDataURL();
}

submitBtn.addEventListener('click', handleSubmit);

async function handleSubmit() {
  clearError(signError);

  if (isCanvasBlank()) {
    showError(signError, null, 'Please sign inside the box before confirming.');
    return;
  }

  submitBtn.disabled   = true;
  submitBtn.textContent = 'Sealing agreement...';

  const payload = {
    docId:         activeDocId,
    signerName:    verifiedParty.name,
    signerPhone:   verifiedParty.phone,
    signatureData: canvas.toDataURL(),
    signedAt:      new Date().toISOString(),
  };

  // TODO: POST payload to your backend / Firestore
  // await fetch('/api/sign', { method: 'POST', body: JSON.stringify(payload) });
  console.log('Signature payload ready:', { ...payload, signatureData: '[base64 omitted]' });

  // Simulate async save (replace with real await above)
  await new Promise(r => setTimeout(r, 800));

  // Show success screen
  document.getElementById('actionZone').classList.add('hidden');
  finalDocId.textContent = activeDocId;
  successScreen.classList.remove('hidden');
}


// ─── ERROR HELPERS ───────────────────────────

function showError(errorEl, inputEl, msg) {
  errorEl.textContent = msg;
  errorEl.classList.add('visible');
  if (inputEl) inputEl.classList.add('error');
}

function clearError(errorEl, inputEl) {
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
  }
  if (inputEl) inputEl.classList.remove('error');
}

// Clear verify error on input
verifyPhoneInput.addEventListener('input', () => clearError(verifyError, verifyPhoneInput));


// ─── INIT ────────────────────────────────────

loadAgreement();