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
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

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
const auth = getAuth(app);


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

const verifyPhoneInput   = document.getElementById('verifyPhone');
const verifyPhoneBtn     = document.getElementById('verifyPhoneBtn');
const verifyError        = document.getElementById('verifyError');
const recipientNameInput = document.getElementById('recipientName');

// OTP phase
const otpPhase     = document.getElementById('otpPhase');
const otpInput     = document.getElementById('otpInput');
const otpError     = document.getElementById('otpError');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const resendOtpBtn = document.getElementById('resendOtpBtn');
const otpSentTo    = document.getElementById('otpSentTo');

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
let canvasEventsLive    = false;
let confirmationResult  = null;
let recaptchaVerifier   = null;


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
  const { creator, agreement, enterprise, plan } = agreementData;

  // Basic fields
  docIdDisplay.textContent = activeDocId;
  inviterName.textContent  = creator.name;
  displayTerms.textContent = agreement.polishedTerms || agreement.rawTerms;

  // ── Enterprise rendering ──
  if (plan === 'enterprise' && enterprise) {

    // Apply theme to document paper
    const paper = document.getElementById('documentPaper');
    const themes = {
      dark:  'bg-slate-900 text-white border-slate-700',
      gold:  'bg-amber-50 border-amber-200',
      green: 'bg-emerald-50 border-emerald-200',
    };
    if (themes[enterprise.theme]) {
      paper.className = paper.className.replace('bg-white', '');
      paper.classList.add(...themes[enterprise.theme].split(' '));
    }

    // Show enterprise header
    const enterpriseHeader = document.getElementById('enterpriseHeader');
    enterpriseHeader.classList.remove('hidden');

    // Logo
    if (enterprise.logoUrl) {
      const logoEl = document.getElementById('enterpriseLogo');
      logoEl.src = enterprise.logoUrl;
      logoEl.classList.remove('hidden');
    }

    // Business name
    if (enterprise.businessName) {
      document.getElementById('enterpriseBusinessName').textContent = enterprise.businessName;
    }

    // Custom document title
    if (enterprise.documentTitle) {
      document.getElementById('documentTitle').textContent = enterprise.documentTitle;
    }

    // Clauses
    if (agreement.clauses?.length) {
      const clauseLabels = {
        penalty:        { title: 'Penalty Adjustment Clause', text: 'Any default or late payment shall attract a legal liability standard late fee as enforceable under Nigerian law.' },
        confidentiality: { title: 'Mutual Confidentiality Framework', text: 'All parties are bound to non-disclosure of any proprietary or sensitive information shared in connection with this agreement.' },
        dispute:        { title: 'Dispute Resolution Protocol', text: 'Any disputes arising from this agreement shall first be submitted to mandatory arbitration before any litigation steps are taken.' },
        governing_law:  { title: 'Governing Law Declaration', text: 'This agreement is governed by and construed in accordance with the laws of the Federal Republic of Nigeria.' },
      };

      const clausesContainer = document.getElementById('clausesList');
      agreement.clauses.forEach((key, i) => {
        const clause = clauseLabels[key];
        if (!clause) return;
        clausesContainer.innerHTML += `
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-0.5">
            <p class="text-[10px] font-bold text-slate-700 uppercase tracking-wide">${i + 1}. ${clause.title}</p>
            <p class="text-[11px] text-slate-600 leading-relaxed">${clause.text}</p>
          </div>
        `;
      });

      document.getElementById('enterpriseClauses').classList.remove('hidden');
      // Update signature section label number
      document.getElementById('sigStatusLabel').textContent = '5. Signature Status';
    }
  }

  // Expiry date
  if (agreement.expiresAt) {
    const expiry = new Date(agreement.expiresAt);
    const now = new Date();
    if (expiry < now) {
      showFatalError('This agreement has expired and can no longer be signed.');
      return;
    }
    document.getElementById('expiryDateText').textContent = expiry.toLocaleDateString('en-NG', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    document.getElementById('expiryDisplay').classList.remove('hidden');
  }

  // Agreement type label
  const typeLabels = {
    peer_loan:       'Money Loan / Borrowing',
    freelance:       'Freelance / Service Delivery',
    item_rental:     'Item Rental / Asset Hire',
    business_supply: 'Business Supply / Trade',
    nda:             'Non-Disclosure Agreement',
    custom:          'Custom Legal Contract',
  };

  // Parties list
  partiesList.innerHTML = `
    <p class="text-xs text-slate-700">
      <strong>Party A (Creator):</strong> ${creator.name}
      ${creator.ninVerified
        ? '<span class="ml-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">🪪 NIN Verified</span>'
        : ''}
    </p>
    ${agreement.type ? `<p class="text-[10px] text-slate-400 mt-0.5 pl-1">Agreement Type: <span class="font-semibold text-slate-600">${typeLabels[agreement.type] || agreement.type}</span></p>` : ''}
    <p class="text-xs text-slate-700 mt-1">
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


// ─── OTP VERIFICATION ────────────────────────

function formatPhoneNumber(phone) {
  // Convert Nigerian numbers to E.164 format (+234)
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    return '+234' + digits.substring(1);
  }
  if (digits.startsWith('234') && digits.length === 13) {
    return '+' + digits;
  }
  if (digits.startsWith('+234')) {
    return digits;
  }
  return '+234' + digits;
}

function setupRecaptcha() {
  if (recaptchaVerifier) return;
  recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
  size: 'normal',
  callback: () => {
    // reCAPTCHA solved — user can now send OTP
  },
  'expired-callback': () => {
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }
  }
});
recaptchaVerifier.render();
}

async function sendOTP() {
  const name  = recipientNameInput?.value.trim();
  const phone = verifyPhoneInput.value.trim();

  clearError(verifyError, verifyPhoneInput);

  if (!name) {
    showError(verifyError, recipientNameInput, 'Please enter your full name.');
    return;
  }
  if (!phone) {
    showError(verifyError, verifyPhoneInput, 'Please enter your phone number.');
    return;
  }

  const formatted = formatPhoneNumber(phone);
  if (formatted.length < 13) {
    showError(verifyError, verifyPhoneInput, 'Please enter a valid Nigerian phone number.');
    return;
  }

  verifyPhoneBtn.disabled    = true;
  verifyPhoneBtn.textContent = 'Sending...';

  try {
    setupRecaptcha();
    confirmationResult = await signInWithPhoneNumber(auth, formatted, recaptchaVerifier);

    // Show OTP phase
    verificationPhase.classList.add('hidden');
    otpPhase.classList.remove('hidden');
    otpSentTo.textContent = `A 6-digit code was sent to ${formatted}`;
    otpInput.focus();

  } catch (err) {
    console.error('OTP send error:', err);

    // Reset recaptcha on error so it can be retried
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }

    const msg = err.code === 'auth/invalid-phone-number'
      ? 'Invalid phone number. Use format: 08012345678'
      : err.code === 'auth/too-many-requests'
      ? 'Too many attempts. Please wait a few minutes and try again.'
      : 'Failed to send OTP. Please try again.';

    showError(verifyError, verifyPhoneInput, msg);
    verifyPhoneBtn.disabled    = false;
    verifyPhoneBtn.textContent = 'Send OTP';
  }
}

async function verifyOTP() {
  const code = otpInput.value.trim();
  clearError(otpError, otpInput);

  if (code.length !== 6) {
    showError(otpError, otpInput, 'Please enter the 6-digit OTP.');
    return;
  }

  verifyOtpBtn.disabled    = true;
  verifyOtpBtn.textContent = 'Verifying...';

  try {
    await confirmationResult.confirm(code);

    // OTP verified — proceed to signing
    otpPhase.classList.add('hidden');
    signingPhase.classList.remove('hidden');

    const placeholder = document.getElementById('receiverSigPlaceholder');
    if (placeholder) {
      placeholder.innerHTML = `<span class="text-[9px] text-emerald-600 font-bold animate-pulse">✍️ Signing Active...</span>`;
    }

    initCanvas();
    attachCanvasEvents();

  } catch (err) {
    console.error('OTP verify error:', err);

    const msg = err.code === 'auth/invalid-verification-code'
      ? 'Incorrect OTP. Please check and try again.'
      : err.code === 'auth/code-expired'
      ? 'OTP has expired. Please request a new one.'
      : 'Verification failed. Please try again.';

    showError(otpError, otpInput, msg);
    verifyOtpBtn.disabled    = false;
    verifyOtpBtn.textContent = 'Verify & Proceed to Sign →';
  }
}

verifyPhoneBtn.addEventListener('click', sendOTP);
verifyPhoneInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') sendOTP();
});

verifyOtpBtn.addEventListener('click', verifyOTP);
otpInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') verifyOTP();
});

// Resend OTP
resendOtpBtn.addEventListener('click', () => {
  otpPhase.classList.add('hidden');
  verificationPhase.classList.remove('hidden');
  verifyPhoneBtn.disabled    = false;
  verifyPhoneBtn.textContent = 'Send OTP';
  otpInput.value = '';
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
});

// OTP input — digits only
otpInput.addEventListener('keydown', (e) => {
  const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
  if (!allowed.includes(e.key) && !/^\d$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
  }
});

otpInput.addEventListener('paste', (e) => {
  e.preventDefault();
  const pasted = (e.clipboardData || window.clipboardData).getData('text');
  const digitsOnly = pasted.replace(/\D/g, '').substring(0, 6);
  otpInput.value = digitsOnly;
});


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
const recipientPhone = formatPhoneNumber(verifyPhoneInput.value.trim());

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

// Also update the creator's subcollection so their dashboard reflects completion
const creatorUid = agreementData.creator?.uid;
if (creatorUid) {
  const userAgreementRef = doc(db, 'users', creatorUid, 'agreements', activeDocId);
  await updateDoc(userAgreementRef, {
    status: 'completed',
  });
}

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