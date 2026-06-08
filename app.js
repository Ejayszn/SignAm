// ─────────────────────────────────────────────
//  SignAm — Workspace JS
//  Scope: Steps 1–3 + Auth + Live Preview
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


// ─── STATE ───────────────────────────────────

let currentStep = 1;
const TOTAL_STEPS = 3;


// ─── DOM REFS ────────────────────────────────

const steps        = document.querySelectorAll('.form-step');
const nextBtn      = document.getElementById('nextBtn');
const prevBtn      = document.getElementById('prevBtn');
const progressBar  = document.getElementById('progressBar');
const stepLabel    = document.getElementById('stepLabel');

const partiesContainer = document.getElementById('partiesContainer');
const addPartyBtn      = document.getElementById('addPartyBtn');

const rawTermsInput  = document.getElementById('rawTerms');
const previewParties = document.getElementById('previewParties');
const previewTerms   = document.getElementById('previewTerms');
const previewSigImage        = document.getElementById('previewSigImage');
const previewSigPlaceholder  = document.getElementById('previewSigPlaceholder');

const userDisplayBadge = document.getElementById('userDisplayBadge');
const avatarContainer  = document.getElementById('avatarContainer');
const userNameText     = document.getElementById('userNameText');
const authStatusBtn    = document.getElementById('authStatusBtn');

const logoutModal    = document.getElementById('logoutModal');
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

  // Show user badge
  userDisplayBadge.style.display = 'flex';
  userNameText.textContent = user.displayName || 'SignAm User';

  if (user.photoURL) {
    avatarContainer.innerHTML = `<img src="${user.photoURL}" alt="Avatar" class="w-full h-full object-cover">`;
  } else {
    avatarContainer.textContent = getInitials(user.displayName);
  }

  // Pre-fill creator name if the field is still empty
  const creatorNameInput = document.getElementById('creatorName');
  if (creatorNameInput && !creatorNameInput.value && user.displayName) {
    creatorNameInput.value = user.displayName;
    renderPartiesPreview();
  }

  // Pre-fill creator email from auth session
  const creatorEmailInput = document.getElementById('creatorEmail');
  if (creatorEmailInput && !creatorEmailInput.value && user.email) {
    creatorEmailInput.value = user.email;
  }
});


// ─── LOGOUT ──────────────────────────────────

authStatusBtn.addEventListener('click', () => {
  logoutModal.classList.remove('hidden');
  logoutModal.classList.add('flex');
});

cancelLogoutBtn.addEventListener('click', closeLogoutModal);

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
    resetLogoutModal();
  }
});

function closeLogoutModal() {
  logoutModal.classList.add('hidden');
  logoutModal.classList.remove('flex');
  resetLogoutModal();
}

function resetLogoutModal() {
  confirmLogoutBtn.disabled = false;
  confirmLogoutBtn.textContent = 'Sign Me Out';
  cancelLogoutBtn.disabled = false;
}


// ─── MULTI-PARTY MANAGEMENT ──────────────────

function getPartyLabel(index) {
  // 0=A, 1=B, 2=C, ...
  return String.fromCharCode(65 + index);
}

addPartyBtn.addEventListener('click', () => {
  const existingRows = partiesContainer.querySelectorAll('[data-party]');
  const newIndex = existingRows.length; // 0-based; 0=A, 1=B already exist
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

// Attach live preview to the fixed Party A & B fields
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
  previewTerms.classList.toggle('italic', !val);
  previewTerms.classList.toggle('text-slate-500', !val);
  previewTerms.classList.toggle('text-slate-800', !!val);
});


// ─── STEP WIZARD ─────────────────────────────

function updateWizardUI() {
  steps.forEach((step, i) => {
    step.classList.toggle('hidden', i !== currentStep - 1);
  });

  // Progress bar & label
  const pct = (currentStep / TOTAL_STEPS) * 100;
  progressBar.style.width = `${pct}%`;
  stepLabel.textContent = `Step ${currentStep} of ${TOTAL_STEPS}`;

  // Back button
  prevBtn.classList.toggle('invisible', currentStep === 1);

  // Next / Submit button
  if (currentStep === TOTAL_STEPS) {
    nextBtn.textContent = 'Authorize & Submit';
    nextBtn.className = 'px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all';
  } else {
    nextBtn.textContent = 'Continue →';
    nextBtn.className = 'px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all';
  }
}

function validateCurrentStep() {
  const currentStepEl = steps[currentStep - 1];

  // Collect all required fields in the visible step
  // (textarea[required] needs special handling since .value can be empty string)
  const fields = currentStepEl.querySelectorAll('input[required], textarea[required], select[required]');
  let valid = true;

  fields.forEach(field => {
    const empty = !field.value.trim();
    field.classList.toggle('error', empty);
    if (empty) valid = false;
  });

  if (!valid) {
    showToast('Please fill in all required fields before continuing.');
  }

  return valid;
}

nextBtn.addEventListener('click', () => {
  if (!validateCurrentStep()) return;

  if (currentStep < TOTAL_STEPS) {
    currentStep++;
    updateWizardUI();

    if (currentStep === 3) {
      initCanvas();
    }
  } else {
    submitAgreement();
  }
});

prevBtn.addEventListener('click', () => {
  if (currentStep > 1) {
    currentStep--;
    updateWizardUI();
  }
});

// Clear error state on input
document.addEventListener('input', e => {
  if (e.target.classList.contains('error')) {
    e.target.classList.remove('error');
  }
});


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
  if (currentStep === 3) initCanvas();
});

function getXY(e) {
  const rect = canvas.getBoundingClientRect();
  if (e.touches?.length) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
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

  // Hide the hint text once the user starts drawing
  if (!hasDrawn) {
    hasDrawn = true;
    canvasHint.style.display = 'none';
  }
}

function onDrawEnd() {
  if (!isDrawing) return;
  isDrawing = false;

  // Mirror to document preview
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
      names:  Array.from(partiesContainer.querySelectorAll('.party-name')).map(i => i.value.trim()),
      phones: Array.from(partiesContainer.querySelectorAll('.party-phone')).map(i => i.value.trim()),
      creatorEmail: document.getElementById('creatorEmail').value.trim(),
    },
    type:          document.getElementById('agreementType').value,
    rawTerms:      rawTermsInput.value.trim(),
    signatureData: canvas.toDataURL(),
  };

  console.log('Agreement payload ready:', payload);

  // TODO: wire to Firestore + verification flow (Modal 3 — Crossroads)
  showToast('Agreement captured. Opening verification step...', 4000);
}


// ─── INIT ────────────────────────────────────

updateWizardUI();