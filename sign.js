// ─────────────────────────────────────────────
//  SignAm — sign.js
//  Recipient signing page: load from Firestore → verify → sign → save
// ─────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC4yCNmFHAkFoO7nYfdS2XcgIHsZn_0_ys",
  authDomain: "signamnow.firebaseapp.com",
  projectId: "signamnow",
  storageBucket: "signamnow.firebasestorage.app",
  messagingSenderId: "267871547400",
  appId: "1:267871547400:web:b70ac6c08fa0cfdd1561bd",
  measurementId: "G-4C1B313HBZ"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);


// ─── URL PARAM ───────────────────────────────

const urlParams   = new URLSearchParams(window.location.search);
const activeDocId = urlParams.get('id')?.toUpperCase();


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

// Recipient self-declaration fields (added in sign.html)
const recipientNameInput  = document.getElementById('recipientName');
const recipientPhoneInput = document.getElementById('recipientPhone');

const canvas     = document.getElementById('receiverCanvas');
const ctx        = canvas.getContext('2d');
const canvasHint = document.getElementById('canvasHint');
const signError  = document.getElementById('signError');

const clearBtn  = document.getElementById('clearReceiverCanvasBtn');
const submitBtn = document.getElementById('submitSignatureBtn');


// ─── STATE ───────────────────────────────────

let agreementData    = null;
let isDrawing        = false;
let hasDrawn         = false;
let canvasEventsLive = false;


// ─── LOAD AGREEMENT FROM FIRESTORE ───────────

async function loadAgreement() {
  if (!activeDocId) {
    showFatalError('No document ID found in this link. Please check the URL and try again.');
    return;
  }

  try {
    const docRef  = doc(db, 'agreements', activeDocId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      showFatalError(`Agreement "${activeDocId}" was not found or has expired.`);
      return;
    }

    agreementData = docSnap.data();

    // Block if already completed
    if (agreementData.status === 'completed') {
      showFatalError('This agreement has already been signed by both parties and is now locked.');
      return;
    }

    renderAgreement();

  } catch (err) {
    console.error('Firestore read error:', err);
    showFatalError('Could not load agreement. Please check your connection and try again.');
  }
}

function renderAgreement() {
  const { creator, agreement } = agreementData;

  docIdDisplay.textContent = activeDocId;
  inviterName.textContent  = creator.name;
  displayTerms.textContent = agreement.polishedTerms || agreement.rawTerms;

  // Parties list — creator shown, recipient slot shown as pending
  partiesList.innerHTML = `
    <p class="text-xs text-slate-700">
      <strong>Party A (Creator):</strong> ${creator.name}
      ${creator.ninVerified
        ? '<span class="ml-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">🪪 NIN Verified</span>'
        : ''}
    </p>
    <p class="text-xs text-slate-700">
      <strong>Party B (Recipient):</strong>
      <span class="text-slate-400 italic">Awaiting your details</span>
    </p>
  `;

  // Signatures grid
  signaturesGrid.innerHTML = `
    <div class="space-y-1">
      <p class="text-[9px] text-slate-500 uppercase font-bold tracking-wider">${creator.name}</p>
      <div class="h-14 w-full border border-slate-200 bg-emerald-50/30 rounded-xl flex items-center justify-center p-1">
        <span class="text-[10px] font-bold text-emerald-700 px-2 py-0.5 bg-emerald-100/50 rounded border border-emerald-200">✍️ SIGNED</span>
      </div>
    </div>
    <div class="space-y-1">
      <p class="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Your Signature</p>
      <div id="receiverSigPlaceholder" class="h-14 w-full border border-dashed border-amber-300 bg-amber-50/30 rounded-xl flex items-center justify-center text-center">
        <span class="text-[9px] text-amber-700 font-semibold">Awaiting Your Action</span>
      </div>
    </div>
  `;
}

function showFatalError(msg) {
  document.querySelector('main').innerHTML = `
    <div class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-2 max-w-xl mx-auto">
      <p class="text-sm font-bold text-red-800">Unable to Load Agreement</p>
      <p class="text-xs text-red-600 leading-relaxed">${msg}</p>
    </div>
  `;
}


// ─── RECIPIENT SELF-DECLARATION + VERIFY ─────
// Recipient enters their own name + phone.
// Phone is matched server-side in production.
// For now: any non-empty phone proceeds (identity is captured in Firestore).

verifyPhoneBtn.addEventListener('click', handleVerification);
verifyPhoneInput?.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleVerification();
});

function handleVerification() {
  const name  = recipientNameInput?.value.trim();
  const phone = verifyPhoneInput.value.trim();

  clearError(verifyError, verifyPhoneInput);

  if (!name) {
    showError(verifyError, recipientNameInput, 'Please enter your full name.');
    return;
  }
  if (!phone) {
    showError(verifyError, verifyPhoneInput, 'Please enter your WhatsApp number.');
    return;
  }

  // Transition to signing
  verificationPhase.classList.add('hidden');
  signingPhase.classList.remove('hidden');

  const placeholder = document.getElementById('receiverSigPlaceholder');
  if (placeholder) {
    placeholder.innerHTML = `<span class="text-[9px] text-emerald-600 font-bold animate-pulse">✍️ Signing Active...</span>`;
  }

  initCanvas();
  attachCanvasEvents();
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

function onDrawEnd() { isDrawing = false; }

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

  submitBtn.disabled    = true;
  submitBtn.textContent = 'Sealing agreement...';

  // Collect recipient IP (best-effort)
  let ipAddress = 'unknown';
  try {
    const ipRes  = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipRes.json();
    ipAddress = ipData.ip;
  } catch (_) {}

  const recipientName  = recipientNameInput?.value.trim() || 'Unknown';
  const recipientPhone = verifyPhoneInput.value.trim();

  try {
    const docRef = doc(db, 'agreements', activeDocId);

    await updateDoc(docRef, {
      status: 'completed',
      recipient: {
        name:          recipientName,
        phone:         recipientPhone,
        signatureData: canvas.toDataURL(),
        signedAt:      new Date().toISOString(),
        ipAddress,
        userAgent:     navigator.userAgent,
      },
      'auditTrail.recipientIP':     ipAddress,
      'auditTrail.recipientDevice': navigator.userAgent,
      'auditTrail.completedAt':     serverTimestamp(),
    });

    // Show success screen
    document.getElementById('actionZone').classList.add('hidden');
    finalDocId.textContent = activeDocId;
    successScreen.classList.remove('hidden');

  } catch (err) {
    console.error('Firestore update error:', err);
    showError(signError, null, 'Error saving your signature. Please check your connection and try again.');
    submitBtn.disabled    = false;
    submitBtn.textContent = 'Confirm & Seal Agreement 🟢';
  }
}


// ─── ERROR HELPERS ───────────────────────────

function showError(errorEl, inputEl, msg) {
  if (errorEl) {
    errorEl.textContent = msg;
    errorEl.classList.add('visible');
  }
  if (inputEl) inputEl.classList.add('error');
}

function clearError(errorEl, inputEl) {
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
  }
  if (inputEl) inputEl.classList.remove('error');
}

verifyPhoneInput?.addEventListener('input', () => clearError(verifyError, verifyPhoneInput));


// ─── INIT ────────────────────────────────────

loadAgreement();