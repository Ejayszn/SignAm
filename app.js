// ─────────────────────────────────────────────
//  SignAm — app.js
//  Scope: 4-step wizard + verification crossroads + NIN flow + signature
// ─────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC4yCNmFHAkFoO7nYfdS2XcgIHsZn_0_ys",
  authDomain: "signamnow.firebaseapp.com",
  projectId: "signamnow",
  storageBucket: "signamnow.firebasestorage.app",
  messagingSenderId: "267871547400",
  appId: "1:267871547400:web:b70ac6c08fa0cfdd1561bd",
  measurementId: "G-4C1B313HBZ"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);


// ─── STATE ───────────────────────────────────

let currentStep = 1;
const TOTAL_STEPS = 4;

// Verification state — persists across the modal flow
const verificationState = {
  chosen: null,       // 'verified' | 'skipped' | null
  ninValue: null,     // the raw NIN string after confirmed match
  ninMatched: false,  // true only after API returns name_match: true
  paymentDone: false, // true after Paystack payment succeeds
};


// ─── DOM REFS ────────────────────────────────

const steps       = document.querySelectorAll('.form-step');
const nextBtn     = document.getElementById('nextBtn');
const prevBtn     = document.getElementById('prevBtn');
const progressBar = document.getElementById('progressBar');
const stepLabel   = document.getElementById('stepLabel');

const partiesContainer = document.getElementById('partiesContainer');
const addPartyBtn      = document.getElementById('addPartyBtn');

const rawTermsInput  = document.getElementById('rawTerms');
const aiPolishBtn    = document.getElementById('aiPolishBtn');
const previewParties = document.getElementById('previewParties');
const previewTerms   = document.getElementById('previewTerms');
const previewSigImage       = document.getElementById('previewSigImage');
const previewSigPlaceholder = document.getElementById('previewSigPlaceholder');
const previewVerifiedTag    = document.getElementById('previewVerifiedTag');
const previewVerificationSection = document.getElementById('previewVerificationSection');

const verifiedBadge = document.getElementById('verifiedBadge');

const userDisplayBadge = document.getElementById('userDisplayBadge');
const avatarContainer  = document.getElementById('avatarContainer');
const userNameText     = document.getElementById('userNameText');
const authStatusBtn    = document.getElementById('authStatusBtn');

// Modals
const skipWarningModal      = document.getElementById('skipWarningModal');
const skipWarningBackBtn    = document.getElementById('skipWarningBackBtn');
const skipWarningConfirmBtn = document.getElementById('skipWarningConfirmBtn');

const ninModal          = document.getElementById('ninModal');
const ninInput          = document.getElementById('ninInput');
const ninInputError     = document.getElementById('ninInputError');
const ninVerifyBtn      = document.getElementById('ninVerifyBtn');
const ninModalCloseBtn  = document.getElementById('ninModalCloseBtn');
const ninMismatchRetryBtn = document.getElementById('ninMismatchRetryBtn');
const paystackPayBtn    = document.getElementById('paystackPayBtn');

// NIN modal inner states
const ninInputState    = document.getElementById('ninInputState');
const ninLoadingState  = document.getElementById('ninLoadingState');
const ninMismatchState = document.getElementById('ninMismatchState');
const ninMatchState    = document.getElementById('ninMatchState');

const logoutModal     = document.getElementById('logoutModal');
const cancelLogoutBtn  = document.getElementById('cancelLogoutBtn');
const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

const canvas     = document.getElementById('signatureCanvas');
const ctx        = canvas ? canvas.getContext('2d') : null;
const canvasHint = document.getElementById('canvasHint');


// ─── TOAST ───────────────────────────────────

let toastTimer = null;

function showToast(message, durationMs = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), durationMs);
}


// ─── MODAL HELPERS ───────────────────────────

function openModal(modalEl) {
  modalEl.classList.add('open');
}

function closeModal(modalEl) {
  modalEl.classList.remove('open');
}


// ─── AUTH ────────────────────────────────────

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  return parts.length === 1
    ? parts[0].substring(0, 2).toUpperCase()
    : (parts[0][0] + parts[1][0]).toUpperCase();
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  userDisplayBadge.style.display = 'flex';
  userNameText.textContent = user.displayName || 'SignAm User';

  if (user.photoURL) {
    avatarContainer.innerHTML = `<img src="${user.photoURL}" alt="Avatar" class="w-full h-full object-cover">`;
  } else {
    avatarContainer.textContent = getInitials(user.displayName);
  }

  const creatorNameInput  = document.getElementById('creatorName');
  const creatorEmailInput = document.getElementById('creatorEmail');

  if (creatorNameInput && !creatorNameInput.value && user.displayName) {
    creatorNameInput.value = user.displayName;
    renderPartiesPreview();
  }
  if (creatorEmailInput && !creatorEmailInput.value && user.email) {
    creatorEmailInput.value = user.email;
  }
});


// ─── LOGOUT ──────────────────────────────────

authStatusBtn.addEventListener('click', () => openModal(logoutModal));
cancelLogoutBtn.addEventListener('click', () => closeModal(logoutModal));

confirmLogoutBtn.addEventListener('click', async () => {
  confirmLogoutBtn.disabled = true;
  confirmLogoutBtn.textContent = 'Leaving...';
  cancelLogoutBtn.disabled = true;
  try {
    await signOut(auth);
    window.location.href = 'login.html';
  } catch (err) {
    console.error('Sign out error:', err);
    showToast('Error logging out. Please try again.');
    confirmLogoutBtn.disabled = false;
    confirmLogoutBtn.textContent = 'Sign Me Out';
    cancelLogoutBtn.disabled = false;
    closeModal(logoutModal);
  }
});


// ─── MULTI-PARTY MANAGEMENT ──────────────────

function getPartyLabel(index) {
  return String.fromCharCode(65 + index);
}

addPartyBtn.addEventListener('click', () => {
  const existingRows = partiesContainer.querySelectorAll('[data-party]');
  const newIndex = existingRows.length;
  const label = getPartyLabel(newIndex);

  const row = document.createElement('div');
  row.className = 'space-y-3 border-l-2 border-slate-300 pl-3 pt-2';
  row.dataset.party = label;
  row.innerHTML = `
    <div class="flex justify-between items-center">
      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Partner Details (Party ${label})</h3>
      <button type="button" class="remove-party-btn text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-lg transition-colors">✕ Remove</button>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <input type="text" placeholder="Their Full Name / Company Name" class="field party-name" required>
      <input type="tel"  placeholder="Their WhatsApp Number"          class="field party-phone" required>
    </div>
  `;

  row.querySelector('.remove-party-btn').addEventListener('click', () => {
    row.remove();
    renderPartiesPreview();
  });

  row.querySelectorAll('input').forEach(i => i.addEventListener('input', renderPartiesPreview));
  partiesContainer.appendChild(row);
  renderPartiesPreview();
});

partiesContainer.querySelectorAll('.party-name').forEach(input =>
  input.addEventListener('input', renderPartiesPreview)
);


// ─── LIVE PREVIEW ────────────────────────────

function renderPartiesPreview() {
  const nameInputs = partiesContainer.querySelectorAll('.party-name');
  const names = Array.from(nameInputs).map((el, i) =>
    el.value.trim() || `[Party ${getPartyLabel(i)} Name]`
  );

  if (names.length === 0) return;

  let html = 'This agreement is entered into between ';
  names.forEach((name, i) => {
    const tag = `<span class="font-semibold underline text-slate-900 bg-slate-50 px-1 rounded">${name}</span>`;
    if (i === 0) {
      html += `the First Party: ${tag}`;
    } else if (i === names.length - 1) {
      html += ` and the ${names.length > 2 ? 'final ' : ''}Party: ${tag}.`;
    } else {
      html += `, Party ${getPartyLabel(i)}: ${tag}`;
    }
  });

  previewParties.innerHTML = html;
}

rawTermsInput.addEventListener('input', () => {
  const val = rawTermsInput.value.trim();
  previewTerms.textContent = val || 'Start typing what you both agreed on — watch it update here in real time...';
  previewTerms.classList.toggle('italic',       !val);
  previewTerms.classList.toggle('text-slate-500', !val);
  previewTerms.classList.toggle('text-slate-800', !!val);
});

// AI Polish — stub, wired to Groq later
aiPolishBtn.addEventListener('click', () => {
  const raw = rawTermsInput.value.trim();
  if (!raw) {
    showToast('Write your terms first, then polish them.');
    return;
  }
  // TODO: POST to Groq endpoint, replace rawTermsInput.value with response
  showToast('AI polish coming soon — Groq integration next.', 3000);
});


// ─── STEP WIZARD ─────────────────────────────

function updateWizardUI() {
  steps.forEach((step, i) => {
    step.classList.toggle('hidden', i !== currentStep - 1);
  });

  const pct = (currentStep / TOTAL_STEPS) * 100;
  progressBar.style.width = `${pct}%`;
  stepLabel.textContent = `Step ${currentStep} of ${TOTAL_STEPS}`;

  prevBtn.classList.toggle('invisible', currentStep === 1);

  // Step 3 is the crossroads — hide the Continue button, it's handled by the two choice buttons
  if (currentStep === 3) {
    nextBtn.classList.add('invisible');
  } else if (currentStep === TOTAL_STEPS) {
    nextBtn.classList.remove('invisible');
    nextBtn.textContent = 'Authorize & Submit';
    nextBtn.className = 'px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all';
  } else {
    nextBtn.classList.remove('invisible');
    nextBtn.textContent = 'Continue →';
    nextBtn.className = 'px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all';
  }
}

function validateCurrentStep() {
  // Step 3 (crossroads) has no fields — choices are handled by buttons
  if (currentStep === 3) return true;

  const currentStepEl = steps[currentStep - 1];
  const fields = currentStepEl.querySelectorAll('input[required], textarea[required], select[required]');
  let valid = true;

  fields.forEach(field => {
    const empty = !field.value.trim();
    field.classList.toggle('error', empty);
    if (empty) valid = false;
  });

  if (!valid) showToast('Please fill in all required fields before continuing.');
  return valid;
}

nextBtn.addEventListener('click', () => {
  if (!validateCurrentStep()) return;

  if (currentStep < TOTAL_STEPS) {
    currentStep++;
    updateWizardUI();
    if (currentStep === TOTAL_STEPS) initCanvas();
  } else {
    submitAgreement();
  }
});

prevBtn.addEventListener('click', () => {
  if (currentStep > 1) {
    // If stepping back from signature to crossroads, reset verification state
    if (currentStep === TOTAL_STEPS) {
      resetVerificationState();
    }
    currentStep--;
    updateWizardUI();
  }
});

document.addEventListener('input', e => {
  if (e.target.classList.contains('error')) {
    e.target.classList.remove('error');
  }
});


// ─── VERIFICATION CROSSROADS ─────────────────

// "Verify My Identity" chosen
chooseVerifyBtn.addEventListener('click', () => {
  showNinModal();
});

// "Skip Verification" chosen
chooseSkipBtn.addEventListener('click', () => {
  openModal(skipWarningModal);
});

// Skip warning — go back
skipWarningBackBtn.addEventListener('click', () => {
  closeModal(skipWarningModal);
});

// Skip warning — confirm skip
skipWarningConfirmBtn.addEventListener('click', () => {
  closeModal(skipWarningModal);
  verificationState.chosen = 'skipped';
  proceedToSignature();
});


// ─── NIN MODAL ───────────────────────────────

function showNinModal() {
  setNinModalState('input');
  ninInput.value = '';
  ninInputError.classList.add('hidden');
  ninVerifyBtn.textContent = 'Continue';
  ninVerifyBtn.disabled = false;
  openModal(ninModal);
}

function setNinModalState(state) {
  // state: 'input' | 'loading' | 'mismatch' | 'match'
  ninInputState.classList.toggle('hidden',    state !== 'input');
  ninLoadingState.classList.toggle('hidden',  state !== 'loading');
  ninMismatchState.classList.toggle('hidden', state !== 'mismatch');
  ninMatchState.classList.toggle('hidden',    state !== 'match');
}

// Close NIN modal (cancel)
ninModalCloseBtn.addEventListener('click', () => {
  closeModal(ninModal);
});

// Dynamically update the button label based on NIN length
ninInput.addEventListener('input', () => {
  ninInputError.classList.add('hidden');
  ninInput.classList.remove('error');
  const len = ninInput.value.replace(/\D/g, '').length;
  ninVerifyBtn.textContent = len === 11 ? 'Verify & Pay ₦700' : 'Continue';
});

// Verify button click
ninVerifyBtn.addEventListener('click', async () => {
  const nin = ninInput.value.replace(/\D/g, '');

  if (nin.length !== 11) {
    ninInput.classList.add('error');
    ninInputError.textContent = 'Please enter a valid 11-digit NIN.';
    ninInputError.classList.remove('hidden');
    return;
  }

  const creatorName = document.getElementById('creatorName').value.trim();

  setNinModalState('loading');

  try {
    const matched = await verifyNIN(nin, creatorName);

    if (matched) {
      verificationState.ninValue   = nin;
      verificationState.ninMatched = true;
      setNinModalState('match');
    } else {
      setNinModalState('mismatch');
    }
  } catch (err) {
    console.error('NIN verification error:', err);
    setNinModalState('input');
    ninInputError.textContent = 'Verification service unavailable. Please try again.';
    ninInputError.classList.remove('hidden');
  }
});

// Mismatch — retry
ninMismatchRetryBtn.addEventListener('click', () => {
  ninInput.value = '';
  ninVerifyBtn.textContent = 'Continue';
  setNinModalState('input');
});

// Paystack pay button
paystackPayBtn.addEventListener('click', () => {
  initiatePaystackPayment();
});


// ─── NIN VERIFICATION API ────────────────────
// Option C flow: verify NIN FIRST (free call), THEN open Paystack only on match.
// Replace the stub below with your real Didit / Monnify / NIBSS call.

async function verifyNIN(nin, fullName) {
  // TODO: POST to your backend — NEVER call a NIN API directly from the browser
  // (API keys must stay server-side).
  //
  // Expected call:
  //   POST /api/verify-nin
  //   Body: { nin, fullName }
  //   Response: { matched: boolean }
  //
  // Stub: simulates a 1.5s API call
  await new Promise(r => setTimeout(r, 1500));

  // For development testing:
  // Return true if NIN is all same digit (e.g. 11111111111) to simulate a match
  // Return false for anything else to simulate a mismatch
  const isTestMatch = /^(\d)\1{10}$/.test(nin);
  return isTestMatch;
}


// ─── PAYSTACK INTEGRATION ────────────────────
// Stub ready for your Paystack public key + metadata.
// When payment succeeds, call onPaymentSuccess().

function initiatePaystackPayment() {
  // TODO: load Paystack inline JS and call PaystackPop.setup({...}).openIframe()
  //
  // Example when you're ready:
  //
  // const handler = PaystackPop.setup({
  //   key: 'pk_live_YOUR_PUBLIC_KEY',
  //   email: document.getElementById('creatorEmail').value,
  //   amount: 70000, // in kobo (₦700 = 70000 kobo)
  //   currency: 'NGN',
  //   ref: `SIGNAM-${Date.now()}`,
  //   metadata: {
  //     nin: verificationState.ninValue,
  //     creatorName: document.getElementById('creatorName').value,
  //   },
  //   callback: (response) => onPaymentSuccess(response.reference),
  //   onClose: () => showToast('Payment cancelled.'),
  // });
  // handler.openIframe();
  //
  // For now, simulate a successful payment after 1s:
  paystackPayBtn.disabled = true;
  paystackPayBtn.textContent = 'Processing...';

  setTimeout(() => {
    onPaymentSuccess('MOCK_REF_' + Date.now());
  }, 1000);
}

function onPaymentSuccess(reference) {
  verificationState.paymentDone = true;
  verificationState.chosen = 'verified';

  console.log('Payment verified. Reference:', reference);

  closeModal(ninModal);
  proceedToSignature(true);
}


// ─── PROCEED TO SIGNATURE ────────────────────

function proceedToSignature(isVerified = false) {
  if (isVerified) {
    // Show NIN verified badge on step 4
    verifiedBadge.classList.remove('hidden');
    verifiedBadge.style.display = 'flex';

    // Update live preview
    previewVerifiedTag.classList.remove('hidden');
    previewVerificationSection.classList.remove('hidden');
  }

  currentStep = TOTAL_STEPS;
  updateWizardUI();
  initCanvas();
}

function resetVerificationState() {
  verificationState.chosen      = null;
  verificationState.ninValue    = null;
  verificationState.ninMatched  = false;
  verificationState.paymentDone = false;

  verifiedBadge.classList.add('hidden');
  previewVerifiedTag.classList.add('hidden');
  previewVerificationSection.classList.add('hidden');
}


// ─── SIGNATURE CANVAS ────────────────────────

let isDrawing = false;
let hasDrawn  = false;

function initCanvas() {
  if (!canvas) return;
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  ctx.lineWidth   = 2.5;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.strokeStyle = '#1e3a8a';
}

window.addEventListener('resize', () => {
  if (currentStep === TOTAL_STEPS) initCanvas();
});

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
  if (!isDrawing) return;
  isDrawing = false;

  const dataURL = canvas.toDataURL();
  previewSigImage.src = dataURL;
  previewSigImage.classList.remove('hidden');
  previewSigPlaceholder.classList.add('hidden');
}

if (canvas) {
  canvas.addEventListener('mousedown',  onDrawStart);
  canvas.addEventListener('mousemove',  onDraw);
  window.addEventListener('mouseup',    onDrawEnd);
  canvas.addEventListener('touchstart', onDrawStart, { passive: false });
  canvas.addEventListener('touchmove',  onDraw,      { passive: false });
  canvas.addEventListener('touchend',   onDrawEnd);
}

document.getElementById('clearCanvasBtn').addEventListener('click', () => {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  hasDrawn = false;
  canvasHint.style.display = '';
  previewSigImage.src = '';
  previewSigImage.classList.add('hidden');
  previewSigPlaceholder.classList.remove('hidden');
});


// ─── SUBMISSION ──────────────────────────────

function isCanvasBlank() {
  const blank = document.createElement('canvas');
  blank.width  = canvas.width;
  blank.height = canvas.height;
  return canvas.toDataURL() === blank.toDataURL();
}

function submitAgreement() {
  if (isCanvasBlank()) {
    showToast('Please sign inside the canvas before finalizing.');
    return;
  }

  const payload = {
    parties: {
      names:        Array.from(partiesContainer.querySelectorAll('.party-name')).map(i => i.value.trim()),
      phones:       Array.from(partiesContainer.querySelectorAll('.party-phone')).map(i => i.value.trim()),
      creatorEmail: document.getElementById('creatorEmail').value.trim(),
    },
    type:          document.getElementById('agreementType').value,
    rawTerms:      rawTermsInput.value.trim(),
    verification:  {
      chosen:      verificationState.chosen,
      ninVerified: verificationState.ninMatched,
      paymentDone: verificationState.paymentDone,
    },
    signatureData: canvas.toDataURL(),
    createdAt:     new Date().toISOString(),
  };

  console.log('Agreement payload ready:', {
    ...payload,
    signatureData: '[base64 omitted]',
  });

  // TODO: POST to Firestore / backend API, then redirect to success page
  showToast('Agreement captured. Saving to database...', 4000);
}


// ─── INIT ────────────────────────────────────

updateWizardUI();