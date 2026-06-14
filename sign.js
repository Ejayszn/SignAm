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
  showFatalError('This agreement has already been fully signed by all parties and is now locked.');
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

  const partiesRequired = agreementData.partiesRequired || 2;
const signatures      = agreementData.signatures || [];
const signedCount     = signatures.length;

// Parties list
let partiesHTML = `
  <p class="text-xs text-slate-700">
    <strong>Party A (Creator):</strong> ${creator.name}
    ${creator.ninVerified
      ? '<span class="ml-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">NIN Verified</span>'
      : ''}
  </p>
  ${agreement.type ? `<p class="text-[10px] text-slate-400 mt-0.5 pl-1">Agreement Type: <span class="font-semibold text-slate-600">${typeLabels[agreement.type] || agreement.type}</span></p>` : ''}
`;

const partyLetters = ['B','C','D','E'];
for (let i = 1; i < partiesRequired; i++) {
  const sig = signatures[i - 1];
  partiesHTML += `
    <p class="text-xs text-slate-700 mt-1">
      <strong>Party ${partyLetters[i-1]}:</strong>
      ${sig
        ? `<span class="text-emerald-700 font-semibold">${sig.name}</span> <span class="text-[10px] text-emerald-600 font-bold">✓ Signed</span>`
        : '<span class="text-slate-400 italic">Awaiting signature</span>'
      }
    </p>
  `;
}
partiesList.innerHTML = partiesHTML;

// Signing progress banner
const progressBanner = document.createElement('div');
progressBanner.className = 'bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between';
progressBanner.innerHTML = `
  <span class="text-xs font-semibold text-amber-800">${signedCount + 1} of ${partiesRequired} signatures collected</span>
  <span class="text-[10px] font-bold text-amber-600">${partiesRequired - signedCount - 1} more needed after you</span>
`;
if (partiesRequired > 2) {
  partiesList.appendChild(progressBanner);
}

// Signatures grid — creator + all collected signatures + pending slots
let sigGridHTML = `
  <div class="space-y-1">
    <p class="text-[9px] text-slate-500 uppercase font-bold tracking-wider">${creator.name} (Creator)</p>
    <div class="h-14 w-full border border-slate-200 bg-emerald-50/30 rounded-xl flex items-center justify-center p-1">
      <span class="text-[10px] font-bold text-emerald-700 px-2 py-0.5 bg-emerald-100/50 rounded border border-emerald-200">✍️ SIGNED</span>
    </div>
  </div>
`;

for (let i = 0; i < partiesRequired - 1; i++) {
  const sig = signatures[i];
  const label = `Party ${partyLetters[i]}`;
  if (sig) {
    sigGridHTML += `
      <div class="space-y-1">
        <p class="text-[9px] text-slate-500 uppercase font-bold tracking-wider">${sig.name} (${label})</p>
        <div class="h-14 w-full border border-slate-200 bg-emerald-50/30 rounded-xl flex items-center justify-center p-1">
          <span class="text-[10px] font-bold text-emerald-700 px-2 py-0.5 bg-emerald-100/50 rounded border border-emerald-200">✍️ SIGNED</span>
        </div>
      </div>
    `;
  } else if (i === signedCount) {
    // This is the slot for the current signer
    sigGridHTML += `
      <div class="space-y-1">
        <p class="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Your Signature (${label})</p>
        <div id="receiverSigPlaceholder" class="h-14 w-full border border-dashed border-amber-300 bg-amber-50/30 rounded-xl flex items-center justify-center text-center">
          <span class="text-[9px] text-amber-700 font-semibold">Your Turn to Sign</span>
        </div>
      </div>
    `;
  } else {
    sigGridHTML += `
      <div class="space-y-1">
        <p class="text-[9px] text-slate-500 uppercase font-bold tracking-wider">${label}</p>
        <div class="h-14 w-full border border-dashed border-slate-200 bg-slate-50/30 rounded-xl flex items-center justify-center">
          <span class="text-[9px] text-slate-400 font-semibold">Pending</span>
        </div>
      </div>
    `;
  }
}

signaturesGrid.className = `grid gap-4 pt-1`;
signaturesGrid.style.gridTemplateColumns = `repeat(${Math.min(partiesRequired, 3)}, 1fr)`;
signaturesGrid.innerHTML = sigGridHTML;
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

    const partiesRequired = agreementData.partiesRequired || 2;
const existingSignatures = agreementData.signatures || [];

const newSignature = {
  name:          recipientName,
  phone:         recipientPhone,
  signatureData: canvas.toDataURL(),
  signedAt:      new Date().toISOString(),
  ipAddress,
  userAgent:     navigator.userAgent,
  partyIndex:    existingSignatures.length + 1, // Party B=1, C=2 etc
};

const updatedSignatures = [...existingSignatures, newSignature];
const isComplete = updatedSignatures.length >= (partiesRequired - 1); // -1 because creator already signed

const updatePayload = {
  signatures: updatedSignatures,
  [`auditTrail.party${existingSignatures.length + 2}IP`]: ipAddress,
  [`auditTrail.party${existingSignatures.length + 2}Device`]: navigator.userAgent,
};

if (isComplete) {
  updatePayload.status = 'completed';
  updatePayload['auditTrail.completedAt'] = serverTimestamp();
} else {
  updatePayload.status = 'pending_signatures';
}

await updateDoc(doc(db, 'agreements', activeDocId), updatePayload);

// After main document update
const creatorUid = agreementData.creator?.uid;
if (creatorUid) {
  try {
    const userAgreementRef = doc(db, 'users', creatorUid, 'agreements', activeDocId);
    await updateDoc(userAgreementRef, {
      status:         isComplete ? 'completed' : 'pending_signatures',
      signatureCount: updatedSignatures.length,
    });
    console.log('Subcollection updated successfully');
  } catch (subErr) {
    console.warn('Subcollection update failed (rules or permission):', subErr.message);
    // Don't fail the whole signing process
  }
}

    // Show success screen
document.getElementById('actionZone').classList.add('hidden');
finalDocId.textContent = activeDocId;
successScreen.classList.remove('hidden');

// Update success message based on whether all parties have signed
const successMsg = document.querySelector('#successScreen p.text-xs');
if (successMsg) {
  successMsg.textContent = isComplete
    ? 'All parties have signed. This contract is now fully binding and permanently locked.'
    : `Your signature has been recorded. ${(partiesRequired - 1) - updatedSignatures.length} more signature(s) still needed — share the link with the next party.`;
}

// Only show PDF download button if this was the final signature
if (isComplete) {
  const pdfBtn = document.createElement('button');
  pdfBtn.className = 'w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2';
  pdfBtn.innerHTML = '⬇ Download Agreement PDF';
  pdfBtn.addEventListener('click', async () => {
    pdfBtn.textContent = 'Generating PDF...';
    pdfBtn.disabled = true;
    try {
      // Use updated data with all signatures included
      const updatedData = { ...agreementData, signatures: updatedSignatures };
      await generatePDFFromData(activeDocId, updatedData);
    } catch (err) {
      console.error('PDF error:', err);
      pdfBtn.textContent = 'Failed. Try again.';
    } finally {
      pdfBtn.innerHTML = '⬇ Download Agreement PDF';
      pdfBtn.disabled = false;
    }
  });

  const lastP = successScreen.querySelector('p:last-child');
  if (lastP && lastP.parentNode) {
    lastP.parentNode.insertBefore(pdfBtn, lastP);
  } else {
    successScreen.appendChild(pdfBtn);
  }
}

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

// ─── PDF GENERATION (recipient side) ─────────

async function generatePDFFromData(docId, data) {
  const { creator, recipient, agreement, enterprise, plan, auditTrail } = data;
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = 210, pageH = 297, margin = 18;
  const contentW = pageW - margin * 2;
  let y = margin;

  const themes = {
    classic: { headerBg: [255,255,255], headerText: [15,23,42], accent: [21,128,61] },
    dark:    { headerBg: [15,23,42],    headerText: [255,255,255], accent: [16,185,129] },
    gold:    { headerBg: [255,251,235], headerText: [120,53,15],   accent: [180,130,20] },
    green:   { headerBg: [236,253,245], headerText: [6,78,59],     accent: [21,128,61] },
  };

  const theme = (plan === 'enterprise' && enterprise?.theme)
    ? (themes[enterprise.theme] || themes.classic)
    : themes.classic;

  const [aR, aG, aB] = theme.accent;

  function setFont(size, style = 'normal', color = [15,23,42]) {
    pdf.setFontSize(size); pdf.setFont('helvetica', style); pdf.setTextColor(...color);
  }
  function drawLine(yPos) {
    pdf.setDrawColor(226,232,240); pdf.setLineWidth(0.3);
    pdf.line(margin, yPos, pageW - margin, yPos);
  }
  function checkPage(needed = 20) {
    if (y + needed > pageH - margin) { pdf.addPage(); y = margin + 10; }
  }
  function wrapText(text, x, yPos, maxW, lh = 4.5) {
    pdf.splitTextToSize(text, maxW).forEach(line => {
      if (yPos > pageH - margin - 10) { pdf.addPage(); yPos = margin + 10; }
      pdf.text(line, x, yPos); yPos += lh;
    });
    return yPos;
  }

  // Header
  pdf.setFillColor(...theme.headerBg);
  pdf.rect(0, 0, pageW, 38, 'F');

  if (plan === 'enterprise' && enterprise?.logoUrl) {
    try {
      const img = await loadImageAsBase64Sign(enterprise.logoUrl);
      pdf.addImage(img, 'PNG', margin, 8, 22, 22);
    } catch (_) {}
  }

  const hx = (plan === 'enterprise' && enterprise?.logoUrl) ? margin + 26 : margin;
  setFont(14, 'bold', theme.headerText);
  pdf.text((plan === 'enterprise' && enterprise?.documentTitle) ? enterprise.documentTitle.toUpperCase() : 'MEMORANDUM OF UNDERSTANDING', hx, 18);

  if (plan === 'enterprise' && enterprise?.businessName) {
    setFont(8, 'normal', theme.headerText);
    pdf.text(enterprise.businessName, hx, 25);
  }

  setFont(7, 'normal', [100,116,139]);
  pdf.text('SignAm · Legally Binding Digital Contract', pageW - margin, 18, { align: 'right' });
  pdf.text(`Document ID: ${docId}`, pageW - margin, 24, { align: 'right' });
  pdf.text(`Generated: ${new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageW - margin, 29, { align: 'right' });

  pdf.setDrawColor(aR, aG, aB); pdf.setLineWidth(0.8);
  pdf.line(0, 38, pageW, 38);
  y = 48;

  // Parties
  setFont(7, 'bold', [aR, aG, aB]); pdf.text('1. PARTIES INVOLVED', margin, y);
  y += 2; drawLine(y); y += 5;

  const sigBoxW = contentW / 2 - 4;
  pdf.setFillColor(248,250,252); pdf.setDrawColor(226,232,240); pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, y, sigBoxW, 28, 2, 2, 'FD');
  setFont(7, 'bold', [aR,aG,aB]); pdf.text('PARTY A — CREATOR', margin+4, y+6);
  setFont(8, 'bold', [15,23,42]); pdf.text(creator.name||'—', margin+4, y+13);
  setFont(7, 'normal', [100,116,139]);
  pdf.text(creator.phone||'—', margin+4, y+19);
  pdf.text(creator.email||'—', margin+4, y+24);

  const bx = margin + sigBoxW + 8;
  pdf.setFillColor(248,250,252); pdf.roundedRect(bx, y, sigBoxW, 28, 2, 2, 'FD');
  setFont(7, 'bold', [aR,aG,aB]); pdf.text('PARTY B — RECIPIENT', bx+4, y+6);
  setFont(8, 'bold', [15,23,42]); pdf.text(recipient?.name||'—', bx+4, y+13);
  setFont(7, 'normal', [100,116,139]);
  pdf.text(recipient?.phone||'—', bx+4, y+19);
  pdf.text(`Signed: ${recipient?.signedAt ? new Date(recipient.signedAt).toLocaleDateString('en-NG') : '—'}`, bx+4, y+24);
  y += 36;

  // Terms
  checkPage(30);
  setFont(7, 'bold', [aR,aG,aB]); pdf.text('2. AGREED TERMS & COVENANTS', margin, y);
  y += 2; drawLine(y); y += 6;

  function cleanText(text) {
  return (text || '')
    .replace(/₦/g, 'NGN ')
    .replace(/[^\x00-\x7F]/g, '');
}

const termsText = cleanText(agreement?.polishedTerms || agreement?.rawTerms || '—');
  const termsLines = pdf.splitTextToSize(termsText, contentW - 8);
  const termsBoxH = termsLines.length * 4.5 + 8;
  pdf.setFillColor(248,250,252); pdf.setDrawColor(226,232,240);
  pdf.roundedRect(margin, y, contentW, termsBoxH, 2, 2, 'FD');
  y += 5; setFont(8, 'italic', [51,65,85]);
  termsLines.forEach(line => {
    if (y > pageH - margin - 10) { pdf.addPage(); y = margin + 10; }
    pdf.text(line, margin+4, y); y += 4.5;
  });
  y += 6;

  // Clauses
  if (plan === 'enterprise' && agreement?.clauses?.length) {
    checkPage(20);
    setFont(7, 'bold', [aR,aG,aB]); pdf.text('3. STANDARD LEGAL CLAUSES', margin, y);
    y += 2; drawLine(y); y += 6;
    const clauseLabels = {
      penalty:         { title: 'Penalty Adjustment Clause', text: 'Any default or late payment shall attract a legal liability standard late fee as enforceable under Nigerian law.' },
      confidentiality: { title: 'Mutual Confidentiality Framework', text: 'All parties are bound to non-disclosure of any proprietary or sensitive information shared in connection with this agreement.' },
      dispute:         { title: 'Dispute Resolution Protocol', text: 'Any disputes arising from this agreement shall first be submitted to mandatory arbitration before any litigation steps are taken.' },
      governing_law:   { title: 'Governing Law Declaration', text: 'This agreement is governed by and construed in accordance with the laws of the Federal Republic of Nigeria.' },
    };
    agreement.clauses.forEach((key, i) => {
      const clause = clauseLabels[key]; if (!clause) return;
      checkPage(16);
      setFont(7, 'bold', [15,23,42]); pdf.text(`${i+1}. ${clause.title}`, margin, y); y += 4;
      setFont(7, 'normal', [71,85,105]); y = wrapText(clause.text, margin+3, y, contentW-3); y += 4;
    });
  }

  // Signatures
  const sNum = (plan === 'enterprise' && agreement?.clauses?.length) ? '4.' : '3.';
  checkPage(60);
  setFont(7, 'bold', [aR,aG,aB]); pdf.text(`${sNum} SIGNATURES`, margin, y);
  y += 2; drawLine(y); y += 6;

  const sbH = 40;
const sigPartyLetters = ['A', 'B', 'C', 'D', 'E'];
const allParties = [
  {
    label: 'PARTY A — CREATOR',
    name: creator.name,
    signatureData: creator.signatureData,
    signedAt: creator.signedAt,
  },
  ...(data.signatures || []).map((sig, i) => ({
    label: `PARTY ${sigPartyLetters[i + 1]} — RECIPIENT`,
    name: sig.name,
    signatureData: sig.signatureData,
    signedAt: sig.signedAt,
  })),
];

const sigBoxWDynamic = allParties.length === 1 ? contentW : contentW / 2 - 4;

for (let i = 0; i < allParties.length; i++) {
  const party = allParties[i];
  const col = i % 2;

  if (col === 0 && i !== 0) {
    y += sbH + 6;
    checkPage(sbH + 10);
  }

  const xPos = col === 0 ? margin : margin + sigBoxWDynamic + 8;

  pdf.setFillColor(248, 252, 248);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(xPos, y, sigBoxWDynamic, sbH, 2, 2, 'FD');

  setFont(6, 'bold', [100, 116, 139]);
  pdf.text(party.label, xPos + 3, y + 5);

  setFont(6, 'normal', [100, 116, 139]);
  pdf.text(party.name || '—', xPos + 3, y + 10);

  if (party.signatureData) {
    try {
      pdf.addImage(party.signatureData, 'PNG', xPos + 3, y + 12, sigBoxWDynamic - 6, 20);
    } catch (_) {}
  }

  pdf.text(
    `Signed: ${party.signedAt ? new Date(party.signedAt).toLocaleDateString('en-NG') : '—'}`,
    xPos + 3,
    y + 36
  );
}

y += sbH + 10;

  // Audit trail
  checkPage(35);
  setFont(7, 'bold', [aR,aG,aB]); pdf.text('AUDIT TRAIL', margin, y);
  y += 2; drawLine(y); y += 5;
  const partyIpLines = (data.signatures || []).map((sig, i) => {
  const label = ['B','C','D','E'][i];
  return `Party ${label} IP: ${sig.ipAddress || '—'}`;
});

const auditLines = [
  `Creator IP: ${auditTrail?.creatorIP || '—'}`,
  ...partyIpLines,
  `Completed: ${auditTrail?.completedAt?.toDate ? auditTrail.completedAt.toDate().toLocaleString('en-NG') : '—'}`,
  `Creator Device: ${(auditTrail?.creatorDevice || '—').substring(0, 80)}`,
  ...(data.signatures || []).map((sig, i) =>
    `Party ${['B','C','D','E'][i]} Device: ${(sig.userAgent || '—').substring(0, 80)}`
  ),
];

pdf.setFillColor(241, 245, 249);
const auditBoxH = Math.max(28, auditLines.length * 4.5 + 6);
pdf.roundedRect(margin, y, contentW, auditBoxH, 2, 2, 'F');
setFont(6, 'normal', [71, 85, 105]);
auditLines.forEach((line, i) => pdf.text(line, margin + 4, y + 5 + i * 4.5));
y += auditBoxH + 7;

  // Footer on all pages
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(226,232,240); pdf.setLineWidth(0.3);
    pdf.line(margin, pageH-12, pageW-margin, pageH-12);
    setFont(6, 'normal', [148,163,184]);
    pdf.text('This document was generated by SignAm (signamnow.com) and is legally binding under the Nigerian Evidence Act 2011.', margin, pageH-8);
    pdf.text(`Page ${i} of ${totalPages}`, pageW-margin, pageH-8, { align: 'right' });
  }

  pdf.save(`SignAm-${docId}.pdf`);
}

function loadImageAsBase64Sign(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      c.getContext('2d').drawImage(img, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ─── INIT ────────────────────────────────────

loadAgreement();