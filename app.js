// ─────────────────────────────────────────────
//  SignAm — app.js
//  Dashboard + full agreement creation wizard
// ─────────────────────────────────────────────

import { initializeApp }         from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut,
  browserLocalPersistence,
  setPersistence
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc,
  collection, getDocs, onSnapshot, orderBy, query, where,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyC4yCNmFHAkFoO7nYfdS2XcgIHsZn_0_ys",
  authDomain: "signamnow.firebaseapp.com",
  projectId: "signamnow",
  storageBucket: "signamnow.firebasestorage.app",
  messagingSenderId: "267871547400",
  appId: "1:267871547400:web:b70ac6c08fa0cfdd1561bd",
  measurementId: "G-4C1B313HBZ",
};

const app     = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const storage = getStorage(app);


// ─── WIZARD STATE ────────────────────────────

const state = {
  plan: null,
  step: 0,
  TOTAL_STEPS: 4,
  ninVerified: false,
  ninJustVerified: false,
  paystackRef: null,
  paymentDone: false,
  selectedTheme: 'classic',
  logoFile: null,
  logoUrl: null,
  selectedClauses: [],
  partiesRequired: 2,
};

let currentUser = null;


// ─── DOM REFS ────────────────────────────────

const userDisplayBadge = document.getElementById('userDisplayBadge');
const avatarContainer  = document.getElementById('avatarContainer');
const userNameText     = document.getElementById('userNameText');
const ninVerifiedPill  = document.getElementById('ninVerifiedPill');
const authStatusBtn    = document.getElementById('authStatusBtn');

const createAgreementBtn = document.getElementById('createAgreementBtn');
const emptyCreateBtn     = document.getElementById('emptyCreateBtn');
const agreementsList     = document.getElementById('agreementsList');
const emptyState         = document.getElementById('emptyState');

const statTotal     = document.getElementById('statTotal');
const statPending   = document.getElementById('statPending');
const statCompleted = document.getElementById('statCompleted');

// Wizard
const wizardModal     = document.getElementById('wizardModal');
const closeWizardBtn  = document.getElementById('closeWizardBtn');
const wizardStepLabel = document.getElementById('wizardStepLabel');
const wizardStepTitle = document.getElementById('wizardStepTitle');
const wizardProgress  = document.getElementById('wizardProgress');
const wizardPrevBtn   = document.getElementById('wizardPrevBtn');
const wizardNextBtn   = document.getElementById('wizardNextBtn');

// Steps
const stepPlan = document.getElementById('stepPlan');
const step1    = document.getElementById('step1');
const step2    = document.getElementById('step2');
const step3    = document.getElementById('step3');
const step4    = document.getElementById('step4');
const allSteps = [stepPlan, step1, step2, step3, step4];

// Step 1
const creatorName  = document.getElementById('creatorName');
const creatorPhone = document.getElementById('creatorPhone');
const creatorEmail = document.getElementById('creatorEmail');
const enterpriseStep1Fields = document.getElementById('enterpriseStep1Fields');
const logoUploadZone  = document.getElementById('logoUploadZone');
const logoUploadIcon  = document.getElementById('logoUploadIcon');
const logoUploadLabel = document.getElementById('logoUploadLabel');
const logoFileInput   = document.getElementById('logoFileInput');
const themeSelector   = document.getElementById('themeSelector');
const documentTitle   = document.getElementById('documentTitle');

// Step 2
const rawTermsInput = document.getElementById('rawTerms');
const aiPolishBtn   = document.getElementById('aiPolishBtn');
const enterpriseStep2Fields = document.getElementById('enterpriseStep2Fields');
const expiryDate    = document.getElementById('expiryDate');

// ─── CUSTOM AGREEMENT TYPE DROPDOWN ──────────

const individualOptions = [
  { value: 'personal_loan',  label: 'Personal Loan / Money Lending' },
  { value: 'item_borrow',    label: 'Rent / Item Borrowing' },
  { value: 'service_job',    label: 'Service / Job Agreement (e.g. tailor, carpenter)' },
  { value: 'roommate',       label: 'Roommate / House Agreement' },
  { value: 'event_vendor',   label: 'Event Vendor Agreement' },
  { value: 'custom',         label: 'Custom Legal Contract' },
];

const businessOptions = [
  { value: 'business_supply', label: 'Business Supply & Trade Contract' },
  { value: 'sla',             label: 'Service Level Agreement (SLA)' },
  { value: 'nda',             label: 'Non-Disclosure Agreement (NDA)' },
  { value: 'partnership',     label: 'Partnership / Equity Agreement' },
  { value: 'retainer',        label: 'Client Retainer Agreement' },
  { value: 'employment',      label: 'Employment / Contractor Agreement' },
  { value: 'mou',             label: 'Memorandum of Understanding (MOU)' },
  { value: 'custom',          label: 'Custom Legal Contract' },
];

function buildAgreementTypeDropdown(options) {
  const container = document.getElementById('agreementTypeOptions');
  const hiddenInput = document.getElementById('agreementType');
  const labelEl = document.getElementById('agreementTypeLabel');
  if (!container) return;

  container.innerHTML = '';

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.value = opt.value;
    btn.textContent = opt.label;
    btn.className = 'w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors';

    // Highlight currently selected
    if (hiddenInput.value === opt.value) {
      btn.classList.add('bg-emerald-50', 'text-emerald-700', 'font-bold');
    }

    btn.addEventListener('click', () => {
      hiddenInput.value = opt.value;
      labelEl.textContent = opt.label;
      closeAgreementTypeDropdown();
      // Update highlight
      container.querySelectorAll('button').forEach(b => {
        b.classList.remove('bg-emerald-50', 'text-emerald-700', 'font-bold');
      });
      btn.classList.add('bg-emerald-50', 'text-emerald-700', 'font-bold');
    });

    container.appendChild(btn);
  });

  // Set label to first option if current value not in new list
  const values = options.map(o => o.value);
  if (!values.includes(hiddenInput.value)) {
    hiddenInput.value = options[0].value;
    labelEl.textContent = options[0].label;
  }
}

function openAgreementTypeDropdown() {
  document.getElementById('agreementTypeList').classList.remove('hidden');
  document.getElementById('agreementTypeChevron').style.transform = 'rotate(180deg)';
}

function closeAgreementTypeDropdown() {
  document.getElementById('agreementTypeList').classList.add('hidden');
  document.getElementById('agreementTypeChevron').style.transform = 'rotate(0deg)';
}

document.getElementById('agreementTypeBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  const list = document.getElementById('agreementTypeList');
  list.classList.contains('hidden') ? openAgreementTypeDropdown() : closeAgreementTypeDropdown();
});

// Close when clicking outside
document.addEventListener('click', (e) => {
  if (!document.getElementById('agreementTypeDropdown')?.contains(e.target)) {
    closeAgreementTypeDropdown();
  }
});

// Init with individual options
buildAgreementTypeDropdown(individualOptions);

// Step 3
const alreadyVerifiedState = document.getElementById('alreadyVerifiedState');
const ninFirstTimeState    = document.getElementById('ninFirstTimeState');
const ninInput       = document.getElementById('ninInput');
const ninInputError  = document.getElementById('ninInputError');
const ninLoadingState  = document.getElementById('ninLoadingState');
const ninMismatchState = document.getElementById('ninMismatchState');
const ninRetryBtn    = document.getElementById('ninRetryBtn');
const paymentSummary = document.getElementById('paymentSummary');
const paystackPayBtn = document.getElementById('paystackPayBtn');
const paystackBtnAmount = document.getElementById('paystackBtnAmount');
const paymentPlanLabel  = document.getElementById('paymentPlanLabel');
const paymentAmount     = document.getElementById('paymentAmount');

// Step 4
const canvas      = document.getElementById('signatureCanvas');
const ctx         = canvas ? canvas.getContext('2d') : null;
const canvasHint  = document.getElementById('canvasHint');
const clearCanvasBtn = document.getElementById('clearCanvasBtn');
const verifiedBadge  = document.getElementById('verifiedBadge');

// Modals
const logoutModal     = document.getElementById('logoutModal');
const cancelLogoutBtn  = document.getElementById('cancelLogoutBtn');
const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

let isDrawing = false;
let hasDrawn  = false;


// ─── TOAST ───────────────────────────────────

let toastTimer = null;
function showToast(msg, ms = 3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), ms);
}


// ─── MODAL HELPERS ───────────────────────────

function openModal(el)  { el.classList.add('open'); }
function closeModal(el) { el.classList.remove('open'); }


// ─── AUTH ────────────────────────────────────

function getInitials(name) {
  if (!name) return '??';
  const p = name.trim().split(' ');
  return p.length === 1 ? p[0].substring(0, 2).toUpperCase() : (p[0][0] + p[1][0]).toUpperCase();
}

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'login.html'; return; }
  currentUser = user;

  userDisplayBadge.style.display = 'flex';
  userNameText.textContent = user.displayName || 'SignAm User';

  if (user.photoURL) {
    avatarContainer.innerHTML = `<img src="${user.photoURL}" class="w-full h-full object-cover">`;
  } else {
    avatarContainer.textContent = getInitials(user.displayName);
  }

  // Pre-fill wizard fields
  if (creatorName && user.displayName) creatorName.value = user.displayName;
  if (creatorEmail && user.email)      creatorEmail.value = user.email;

  // Check NIN verification status
  await checkNinStatus(user.uid);

  // Load dashboard agreements
  loadDashboard(user.uid);
});


// ─── NIN STATUS CHECK ────────────────────────

async function checkNinStatus(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists() && userDoc.data().ninVerified === true) {
      state.ninVerified = true;
      ninVerifiedPill.style.display = 'flex';
    }
  } catch (err) {
    console.error('NIN status check error:', err);
  }
}


// ─── DASHBOARD ───────────────────────────────

function loadDashboard(uid) {
  const q = query(
    collection(db, 'users', uid, 'agreements'),
    orderBy('createdAt', 'desc')
  );

  onSnapshot(q, (snap) => {
  console.log(`Dashboard snapshot: ${snap.size} agreements`);
    // Remove skeleton loaders
    document.querySelectorAll('.skeleton-loader').forEach(el => el.remove());

    // Clear existing cards
    agreementsList.innerHTML = '';
    emptyState.classList.add('hidden');

    if (snap.empty) {
      emptyState.classList.remove('hidden');
      statTotal.textContent     = '0';
      statPending.textContent   = '0';
      statCompleted.textContent = '0';
      return;
    }

    let pending = 0, completed = 0;
    snap.forEach(docSnap => {
  const d = docSnap.data();
  console.log(`Agreement ${d.docId}: status=${d.status}, signatureCount=${d.signatureCount}`);
      if (d.status === 'completed') completed++;
      else pending++;
      agreementsList.appendChild(buildAgreementCard(d));
    });

    statTotal.textContent     = snap.size;
    statPending.textContent   = pending;
    statCompleted.textContent = completed;

  }, (err) => {
  console.error('Dashboard listener error:', err.code, err.message);
});
}

function buildAgreementCard(data) {
  const card = document.createElement('div');
  card.className = 'agreement-card p-5 cursor-pointer';   // ← Updated

  const statusColor = data.status === 'completed'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : data.status === 'disputed'
    ? 'bg-red-50 text-red-700 border-red-200'
    : 'bg-amber-50 text-amber-700 border-amber-200';

  const sigCount = data.signatureCount || 0;
const sigTotal = data.partiesRequired || 2;
const statusLabel = data.status === 'completed'
  ? 'Completed'
  : data.status === 'disputed'
  ? 'Disputed'
  : `${sigCount + 1} of ${sigTotal} signed`;

  const planBadge = data.plan === 'enterprise'
    ? '<span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">Enterprise</span>'
    : '';

  const baseUrl  = window.location.origin;
  const signLink = `${baseUrl}/sign.html?id=${data.docId}`;

  card.innerHTML = `
    <div class="flex items-start justify-between gap-3">
      <div class="space-y-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <p class="font-bold text-slate-900 text-sm font-mono">${data.docId}</p>
          ${planBadge}
        </div>
        <p class="text-xs text-slate-500">
          ${data.creatorName} · ${data.status === 'completed' ? 'All parties signed' : 'Awaiting recipient'}
        </p>
      </div>
      <span class="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColor}">${statusLabel}</span>
    </div>
    ${data.status !== 'completed' ? `
<div class="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
  <input type="text" value="${signLink}" readonly
    class="flex-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 focus:outline-none">
  <button class="copy-link-btn shrink-0 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition"
    data-link="${signLink}">Copy</button>
  <a href="https://wa.me/?text=${encodeURIComponent('Please review and sign this agreement: ' + signLink)}"
    target="_blank"
    class="shrink-0 text-xs font-bold text-white bg-[#25D366] hover:bg-[#1ebe5d] px-3 py-1.5 rounded-lg transition">
    WhatsApp
  </a>
</div>` : `
<div class="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
  <div class="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> All ${data.partiesRequired || 2} parties signed
</div>
  <button class="download-pdf-btn text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
    data-docid="${data.docId}">
    ⬇ Download PDF
  </button>
</div>`}
  `;

  // Copy button functionality
  card.querySelector('.copy-link-btn')?.addEventListener('click', (e) => {
    const link = e.target.dataset.link;
    navigator.clipboard.writeText(link).then(() => {
      e.target.textContent = '✓ Copied';
      setTimeout(() => e.target.textContent = 'Copy', 2000);
    });
  });

  card.querySelector('.download-pdf-btn')?.addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const docId = btn.dataset.docid;
  btn.textContent = 'Generating...';
  btn.disabled = true;
  try {
    await generatePDF(docId);
  } catch (err) {
    console.error('PDF generation error:', err);
    showToast('PDF generation failed. Please try again.');
  } finally {
    btn.innerHTML = '⬇ Download PDF';
    btn.disabled = false;
  }
});

  return card;
}


// ─── WIZARD OPEN / CLOSE ─────────────────────

function openWizard() {
  resetWizard();
  openModal(wizardModal);
}

function resetWizard() {
  state.plan          = null;
  state.step          = 0;
  state.ninJustVerified = false;
  state.paymentDone   = false;
  state.paystackRef   = null;
  state.selectedTheme = 'classic';
  state.logoFile      = null;
  state.logoUrl       = null;
  state.selectedClauses = [];
state.partiesRequired = 2;
// Reset party count UI
document.getElementById('partyCountSelector')?.querySelectorAll('.party-count-btn').forEach((btn, i) => {
  btn.className = i === 0
    ? 'party-count-btn border-2 border-emerald-500 bg-emerald-50 text-emerald-700 font-bold py-2 rounded-xl text-sm transition'
    : 'party-count-btn border-2 border-slate-200 text-slate-600 font-bold py-2 rounded-xl text-sm transition hover:border-slate-300';
});

  isDrawing = false;
  hasDrawn  = false;

  // Reset NIN states
  ninInput.value = '';
  ninInputError.classList.add('hidden');
  ninLoadingState.classList.add('hidden');
  ninMismatchState.classList.add('hidden');
  paymentSummary.classList.add('hidden');
  ninFirstTimeState.classList.remove('hidden');

  // Reset canvas
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvasHint.style.display = '';

  showWizardStep(0);
}

createAgreementBtn.addEventListener('click', openWizard);
emptyCreateBtn.addEventListener('click', openWizard);
closeWizardBtn.addEventListener('click', () => closeModal(wizardModal));


// ─── WIZARD STEP RENDERER ────────────────────

const stepTitles = [
  'Choose your plan',
  'Your details',
  'Agreement terms',
  'Verify & Pay',
  'Sign the agreement',
];

function showWizardStep(stepIndex) {
  allSteps.forEach((el, i) => el.classList.toggle('hidden', i !== stepIndex));

  const isStep0 = stepIndex === 0;
  const pct = isStep0 ? 5 : (stepIndex / state.TOTAL_STEPS) * 100;
  wizardProgress.style.width = `${pct}%`;
  wizardStepLabel.textContent = isStep0 ? 'Getting started' : `Step ${stepIndex} of ${state.TOTAL_STEPS}`;
  wizardStepTitle.textContent = stepTitles[stepIndex];

  wizardPrevBtn.classList.toggle('invisible', stepIndex === 0);

  // Step 3: hide next button — navigation handled by NIN/payment flow
  if (stepIndex === 3) {
  wizardNextBtn.classList.remove('invisible');
  wizardNextBtn.textContent = 'Verify NIN →';
  wizardNextBtn.className = 'px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all';
} else if (stepIndex === state.TOTAL_STEPS) {
    wizardNextBtn.classList.remove('invisible');
    wizardNextBtn.textContent = 'Authorize & Submit';
    wizardNextBtn.className = 'px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all';
  } else {
    wizardNextBtn.classList.remove('invisible');
    wizardNextBtn.textContent = 'Continue →';
    wizardNextBtn.className = 'px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all';
  }

  // Step 4 canvas init
  if (stepIndex === 4) initCanvas();
}


// ─── PLAN SELECTION ──────────────────────────

document.getElementById('selectStandardBtn').addEventListener('click', () => {
  state.plan = 'standard';
  enterpriseStep1Fields.classList.add('hidden');
  enterpriseStep2Fields.classList.add('hidden');
  buildAgreementTypeDropdown(individualOptions);
  state.step = 1;
  showWizardStep(1);
});

document.getElementById('selectEnterpriseBtn').addEventListener('click', () => {
  state.plan = 'enterprise';
  enterpriseStep1Fields.classList.remove('hidden');
  enterpriseStep2Fields.classList.remove('hidden');
  buildAgreementTypeDropdown(businessOptions);
  state.step = 1;
  showWizardStep(1);
});


// ─── NAV BUTTONS ─────────────────────────────

wizardNextBtn.addEventListener('click', async () => {
  if (state.step === 3) {
    if (state.paymentDone) return;
    if (state.ninVerified) return;

    const nin = ninInput.value.replace(/\D/g, '');
    if (nin.length !== 11) {
      ninInput.classList.add('error');
      ninInputError.textContent = 'Please enter a valid 11-digit NIN.';
      ninInputError.classList.remove('hidden');
      return;
    }

    ninFirstTimeState.querySelector('.space-y-1\\.5')?.classList.add('hidden');
    ninLoadingState.classList.remove('hidden');
    ninMismatchState.classList.add('hidden');
    wizardNextBtn.disabled = true;

    try {
      const { matched, fullName: ninFullName } = await verifyNIN(nin);
      if (matched && ninFullName) {
      creatorName.value = ninFullName;
      creatorName.readOnly = true;
      creatorName.classList.add('opacity-60', 'cursor-not-allowed');
    }
      ninLoadingState.classList.add('hidden');

      if (matched) {
        await setDoc(doc(db, 'users', currentUser.uid), {
          ninVerified:   true,
          ninVerifiedAt: serverTimestamp(),
        }, { merge: true });

        state.ninVerified     = true;
        state.ninJustVerified = true;
        ninVerifiedPill.style.display = 'flex';
        verifiedBadge.classList.remove('hidden');
        verifiedBadge.style.display = 'flex';

        ninFirstTimeState.classList.add('hidden');
paymentSummary.classList.remove('hidden');
wizardNextBtn.classList.add('invisible');

if (ninFullName) {
  const nameConfirm = document.createElement('div');
  nameConfirm.className = 'flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3';
  nameConfirm.innerHTML = `
    <span class="text-emerald-600 text-sm">✓</span>
    <p class="text-xs text-emerald-800 font-semibold">Verified as: <span class="font-extrabold">${ninFullName}</span></p>
  `;
  paymentSummary.insertAdjacentElement('beforebegin', nameConfirm);
}

showToast('Identity verified! Proceed to payment.');
      } else {
        ninFirstTimeState.querySelector('.space-y-1\\.5')?.classList.remove('hidden');
        ninMismatchState.classList.remove('hidden');
      }
    } catch (err) {
      ninLoadingState.classList.add('hidden');
      ninFirstTimeState.querySelector('.space-y-1\\.5')?.classList.remove('hidden');
      ninInputError.textContent = 'Verification service unavailable. Please try again.';
      ninInputError.classList.remove('hidden');
    } finally {
      wizardNextBtn.disabled = false;
    }

    return; // never fall through
  }

  if (!validateStep(state.step)) return;

  if (state.step < state.TOTAL_STEPS) {
    state.step++;
    showWizardStep(state.step);
    if (state.step === 3) renderStep3();
  } else {
    submitAgreement();
  }
});

wizardPrevBtn.addEventListener('click', () => {
  if (state.step === 0) return;
  if (state.step === 1) {
    // Go back to plan selector
    state.step = 0;
    showWizardStep(0);
    return;
  }
  state.step--;
  showWizardStep(state.step);
});


// ─── STEP VALIDATION ─────────────────────────

function validateStep(stepIndex) {
  if (stepIndex === 0) return true; // Plan selected via button
  if (stepIndex === 3) return true; // Step 3 uses its own flow

  const el = allSteps[stepIndex];
  const fields = el.querySelectorAll('input[required], textarea[required]');
  let valid = true;

  fields.forEach(f => {
    const empty = !f.value.trim();
    f.classList.toggle('error', empty);
    if (empty) valid = false;
  });

  if (!valid) showToast('Please fill in all required fields.');
  return valid;
}

document.addEventListener('input', e => {
  if (e.target.classList.contains('error')) e.target.classList.remove('error');
});


// ─── ENTERPRISE: LOGO UPLOAD ─────────────────

logoUploadZone.addEventListener('click', () => logoFileInput.click());

logoFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    showToast('Logo must be under 2MB.');
    return;
  }
  state.logoFile = file;
  const reader = new FileReader();
  reader.onload = (ev) => {
    if (logoUploadIcon) logoUploadIcon.textContent = '';
    logoUploadZone.style.backgroundImage = `url(${ev.target.result})`;
    logoUploadZone.style.backgroundSize = 'contain';
    logoUploadZone.style.backgroundRepeat = 'no-repeat';
    logoUploadZone.style.backgroundPosition = 'center';
    logoUploadLabel.textContent = file.name;
  };
  reader.readAsDataURL(file);
});

// Drag and drop
logoUploadZone.addEventListener('dragover', e => {
  e.preventDefault();
  logoUploadZone.classList.add('drag-over');
});
logoUploadZone.addEventListener('dragleave', () => logoUploadZone.classList.remove('drag-over'));
logoUploadZone.addEventListener('drop', e => {
  e.preventDefault();
  logoUploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) { logoFileInput.files = e.dataTransfer.files; logoFileInput.dispatchEvent(new Event('change')); }
});


// ─── ENTERPRISE: THEME SELECTOR ──────────────

themeSelector.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    themeSelector.querySelectorAll('.theme-btn').forEach(b => {
      b.classList.remove('border-emerald-500');
      b.classList.add('border-slate-200');
    });
    btn.classList.add('border-emerald-500');
    btn.classList.remove('border-slate-200');
    state.selectedTheme = btn.dataset.theme;
  });
});

// ─── PARTY COUNT SELECTOR ────────────────────

document.getElementById('partyCountSelector').querySelectorAll('.party-count-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('partyCountSelector').querySelectorAll('.party-count-btn').forEach(b => {
      b.className = 'party-count-btn border-2 border-slate-200 text-slate-600 font-bold py-2 rounded-xl text-sm transition hover:border-slate-300';
    });
    btn.className = 'party-count-btn border-2 border-emerald-500 bg-emerald-50 text-emerald-700 font-bold py-2 rounded-xl text-sm transition';
    state.partiesRequired = parseInt(btn.dataset.count);
  });
});


// ─── AI POLISH ────────────────────────

aiPolishBtn.addEventListener('click', async () => {
  if (!rawTermsInput.value.trim()) {
    showToast('Write your terms first, then polish them.');
    return;
  }

  aiPolishBtn.disabled = true;
  aiPolishBtn.innerHTML = `
  <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
  </svg>
  Polishing...
`;

  try {
    const res = await fetch('https://polishterms-gqjepwevuq-uc.a.run.app/api/polish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rawTerms: rawTermsInput.value.trim(),
    creatorName: creatorName.value.trim(),
    partiesRequired: state.partiesRequired,
  })
});
const data = await res.json();
if (data.polishedTerms) rawTermsInput.value = data.polishedTerms;

    showToast('Terms polished successfully');
  } catch (err) {
    showToast('AI failed. Try again.');
  } finally {
    aiPolishBtn.disabled = false;
    aiPolishBtn.innerHTML = `
  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 21l8.904-4.473L21 9l-3.473-3.473M9.813 15.904L13.25 12.46M9.813 15.904l3.437-3.443M13.25 12.46l3.443-3.438M13.25 12.46l-3.438-3.443M9.813 15.904L6.375 12.461m0 0L3 9l8.904-4.473L15.375 8M6.375 12.461l3.438-3.438" /></svg>
  Optimize with ai
`;
  }
});


// ─── STEP 3: NIN + PAYMENT ───────────────────

function renderStep3() {
  const amountText = state.plan === 'enterprise' ? '₦6,000' : '₦1,500';
  paymentAmount.textContent    = amountText;
  paymentPlanLabel.textContent = state.plan === 'enterprise' ? 'Enterprise Agreement' : 'Standard Agreement';
  paystackPayBtn.textContent   = `Pay ${amountText} & Continue →`;

  if (state.ninVerified) {
  alreadyVerifiedState.classList.remove('hidden');
  ninFirstTimeState.classList.add('hidden');
  paymentSummary.classList.remove('hidden');
  verifiedBadge.classList.remove('hidden');
  verifiedBadge.style.display = 'flex';
  wizardNextBtn.classList.add('invisible'); // hide it — paystackPayBtn handles payment
} else {
    alreadyVerifiedState.classList.add('hidden');
    ninFirstTimeState.classList.remove('hidden');
    paymentSummary.classList.add('hidden');
  }
}

// NIN input — update button label dynamically
ninInput.addEventListener('input', () => {
  ninInputError.classList.add('hidden');
  ninInput.classList.remove('error');
  const len = ninInput.value.replace(/\D/g, '').length;
  wizardNextBtn.textContent = len === 11 ? 'Verify NIN →' : 'Continue →';
});

ninInput.addEventListener('keydown', (e) => {
  const allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab'];
  if (!allowed.includes(e.key) && !/^\d$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
  }
});

ninInput.addEventListener('paste', (e) => {
  e.preventDefault();
  const pasted = (e.clipboardData || window.clipboardData).getData('text');
  const digitsOnly = pasted.replace(/\D/g, '').substring(0, 11);
  ninInput.value = digitsOnly;
  ninInput.dispatchEvent(new Event('input'));
});

ninRetryBtn.addEventListener('click', () => {
  ninInput.value = '';
  ninMismatchState.classList.add('hidden');
  ninFirstTimeState.querySelector('.space-y-1\\.5')?.classList.remove('hidden');
});

paystackPayBtn.addEventListener('click', initiatePaystackPayment);


// ─────────────────────────────────────────────
//  app.js PATCHES
//  Drop these in to replace the two stub sections
// ─────────────────────────────────────────────


// ─── PATCH 1: verifyNIN() ────────────────────
// Replace the existing verifyNIN stub (~line 300) with this.
// The function is called as: await verifyNIN(nin, creatorName.value.trim())

async function verifyNIN(nin) {
  const res = await fetch('https://polishterms-gqjepwevuq-uc.a.run.app/api/verify-nin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nin }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Verification service error');
  }

  const data = await res.json();
  return { matched: data.matched === true, fullName: data.fullName || null };
}


// ─── PATCH 2: Paystack integration ───────────

const PAYSTACK_PUBLIC_KEY = 'pk_test_408cb31ecd55db4696350e6401fe9164c7ece94e'; // ← swap in your key

function initiatePaystackPayment() {
  paystackPayBtn.disabled    = true;
  paystackPayBtn.textContent = 'Opening payment...';

  const amount = state.plan === 'enterprise' ? 600000 : 150000; // kobo
  const email    = creatorEmail.value.trim();
  const ref      = `SIGNAM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const handler = PaystackPop.setup({
    key:      PAYSTACK_PUBLIC_KEY,
    email,
    amount,
    currency: 'NGN',
    ref,
    metadata: {
      custom_fields: [
        { display_name: 'Plan',          variable_name: 'plan',          value: state.plan },
        { display_name: 'Creator Name',  variable_name: 'creator_name',  value: creatorName.value.trim() },
      ],
    },
    callback: (response) => {
      onPaymentSuccess(response.reference);
    },
    onClose: () => {
      paystackPayBtn.disabled    = false;
      paystackPayBtn.textContent = `Pay ${state.plan === 'enterprise' ? '₦6,000' : '₦1,500'} & Continue →`;
      showToast('Payment cancelled.');
    },
  });

  handler.openIframe();
}

function onPaymentSuccess(reference) {
  state.paystackRef = reference;
  state.paymentDone = true;
  state.step = 4;
  showWizardStep(4);
}


// ─── CANVAS ──────────────────────────────────

function initCanvas() {
  if (!canvas) return;
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  ctx.lineWidth   = 2.5;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.strokeStyle = '#1e3a8a';
}

function getXY(e) {
  const rect = canvas.getBoundingClientRect();
  if (e.touches?.length) return {
    x: e.touches[0].clientX - rect.left,
    y: e.touches[0].clientY - rect.top,
  };
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function onDrawStart(e) {
  isDrawing = true;
  const { x, y } = getXY(e);
  ctx.beginPath(); ctx.moveTo(x, y);
  if (e.cancelable) e.preventDefault();
}

function onDraw(e) {
  if (!isDrawing) return;
  const { x, y } = getXY(e);
  ctx.lineTo(x, y); ctx.stroke();
  if (e.cancelable) e.preventDefault();
  if (!hasDrawn) { hasDrawn = true; canvasHint.style.display = 'none'; }
}

function onDrawEnd() { isDrawing = false; }

if (canvas) {
  canvas.addEventListener('mousedown',  onDrawStart);
  canvas.addEventListener('mousemove',  onDraw);
  window.addEventListener('mouseup',    onDrawEnd);
  canvas.addEventListener('touchstart', onDrawStart, { passive: false });
  canvas.addEventListener('touchmove',  onDraw,      { passive: false });
  canvas.addEventListener('touchend',   onDrawEnd);
}

clearCanvasBtn.addEventListener('click', () => {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  hasDrawn = false;
  canvasHint.style.display = '';
});


// ─── SUBMISSION ──────────────────────────────

function generateDocId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'SIG-';
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function isCanvasBlank() {
  const blank = document.createElement('canvas');
  blank.width = canvas.width; blank.height = canvas.height;
  return canvas.toDataURL() === blank.toDataURL();
}

async function submitAgreement() {
  if (isCanvasBlank()) { showToast('Please sign inside the canvas.'); return; }

  wizardNextBtn.disabled    = true;
  wizardNextBtn.textContent = 'Saving...';

  const docId = generateDocId();

  // Get IP
  let ipAddress = 'unknown';
  try {
    const r = await fetch('https://api.ipify.org?format=json');
    ipAddress = (await r.json()).ip;
  } catch (_) {}

  // Upload logo if enterprise
  let logoUrl = null;
  if (state.plan === 'enterprise' && state.logoFile) {
    try {
      const logoRef = ref(storage, `logos/${currentUser.uid}/${docId}`);
      await uploadBytes(logoRef, state.logoFile);
      logoUrl = await getDownloadURL(logoRef);
    } catch (err) {
      console.error('Logo upload error:', err);
    }
  }

  // Collect selected clauses
  const selectedClauses = Array.from(
    document.querySelectorAll('.clause-checkbox:checked')
  ).map(cb => cb.dataset.clause);

  const agreementData = {
    status:    'pending_recipient',
    plan:      state.plan,
    createdAt: serverTimestamp(),

    creator: {
      uid:          currentUser.uid,
      name:         creatorName.value.trim(),
      phone:        creatorPhone.value.trim(),
      email:        creatorEmail.value.trim(),
      ninVerified:  state.ninVerified,
      paystackRef:  state.paystackRef,
      signatureData: canvas.toDataURL(),
      signedAt:     new Date().toISOString(),
      ipAddress,
      userAgent:    navigator.userAgent,
    },

    agreement: {
      type:          document.getElementById('agreementType').value,
      rawTerms:      rawTermsInput.value.trim(),
      polishedTerms: null,
      clauses:       selectedClauses,
      expiresAt:     expiryDate.value ? new Date(expiryDate.value).toISOString() : null,
    },

    enterprise: state.plan === 'enterprise' ? {
      businessName:   document.getElementById('businessName').value.trim(),
      logoUrl,
      theme:          state.selectedTheme,
      documentTitle:  document.getElementById('documentTitle').value.trim() || null,
    } : null,

    partiesRequired: state.partiesRequired,
signatures:      [],

auditTrail: {
  creatorIP:    ipAddress,
  creatorDevice: navigator.userAgent,
  completedAt:  null,
},
  };

  try {
    await setDoc(doc(db, 'agreements', docId), agreementData);
    await setDoc(doc(db, 'users', currentUser.uid, 'agreements', docId), {
  docId,
  plan:            state.plan,
  createdAt:       serverTimestamp(),
  status:          'pending_signatures',
  creatorName:     creatorName.value.trim(),
  partiesRequired: state.partiesRequired,
  signatureCount:  0,
});

    closeModal(wizardModal);
    showSuccessScreen(docId);

  } catch (err) {
    console.error('Firestore write error:', err);
    showToast('Error saving agreement. Please try again.');
    wizardNextBtn.disabled    = false;
    wizardNextBtn.textContent = 'Authorize & Submit';
  }
}

// ─── PDF GENERATION ──────────────────────────

async function generatePDF(docId) {
  // Fetch full agreement data from Firestore
  const docSnap = await getDoc(doc(db, 'agreements', docId));
  if (!docSnap.exists()) {
    showToast('Could not load agreement data for PDF.');
    return;
  }

  const data = docSnap.data();
  const { creator, recipient, agreement, enterprise, plan, auditTrail } = data;

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW  = 210;
  const pageH  = 297;
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ── Theme colors ──
  const themes = {
    classic: { headerBg: [255,255,255], headerText: [15,23,42], accent: [21,128,61] },
    dark:    { headerBg: [15,23,42],    headerText: [255,255,255], accent: [16,185,129] },
    gold:    { headerBg: [255,251,235], headerText: [120,53,15],   accent: [180,130,20] },
    green:   { headerBg: [236,253,245], headerText: [6,78,59],     accent: [21,128,61] },
  };

  const theme = (plan === 'enterprise' && enterprise?.theme)
    ? (themes[enterprise.theme] || themes.classic)
    : themes.classic;

  const accentR = theme.accent[0];
  const accentG = theme.accent[1];
  const accentB = theme.accent[2];

  // ── Helper functions ──
  function setFont(size, style = 'normal', color = [15,23,42]) {
    pdf.setFontSize(size);
    pdf.setFont('helvetica', style);
    pdf.setTextColor(...color);
  }

  function drawLine(yPos, color = [226,232,240]) {
    pdf.setDrawColor(...color);
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPos, pageW - margin, yPos);
  }

  function addText(text, x, yPos, options = {}) {
    pdf.text(text, x, yPos, options);
  }

  function wrapText(text, x, yPos, maxWidth, lineHeight = 5) {
    const lines = pdf.splitTextToSize(text, maxWidth);
    lines.forEach(line => {
      if (yPos > pageH - margin - 10) {
        pdf.addPage();
        yPos = margin + 10;
      }
      pdf.text(line, x, yPos);
      yPos += lineHeight;
    });
    return yPos;
  }

  function checkPage(needed = 20) {
  if (y + needed > pageH - margin) {
    pdf.addPage();
    y = margin + 10;
  }
}

function cleanText(text) {
  return (text || '')
    .replace(/₦/g, 'NGN ')
    .replace(/[^\x00-\x7F]/g, '');
}

  // ── HEADER ──
  // Header background
  pdf.setFillColor(...theme.headerBg);
  pdf.rect(0, 0, pageW, 38, 'F');

  // Enterprise logo (if available)
  if (plan === 'enterprise' && enterprise?.logoUrl) {
    try {
      // Load image as base64
      const img = await loadImageAsBase64(enterprise.logoUrl);
      pdf.addImage(img, 'PNG', margin, 8, 22, 22);
    } catch (_) {
      // Logo failed to load — skip silently
    }
  }

  // SignAm branding or business name
  const headerX = (plan === 'enterprise' && enterprise?.logoUrl) ? margin + 26 : margin;

  setFont(14, 'bold', theme.headerText);
  const docTitle = (plan === 'enterprise' && enterprise?.documentTitle)
    ? enterprise.documentTitle.toUpperCase()
    : 'MEMORANDUM OF UNDERSTANDING';
  addText(docTitle, headerX, 18);

  if (plan === 'enterprise' && enterprise?.businessName) {
    setFont(8, 'normal', theme.headerText);
    addText(enterprise.businessName, headerX, 25);
  }

  setFont(7, 'normal', [100,116,139]);
  addText(`SignAm · Legally Binding Digital Contract`, pageW - margin, 18, { align: 'right' });
  addText(`Document ID: ${docId}`, pageW - margin, 24, { align: 'right' });
  addText(`Generated: ${new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageW - margin, 29, { align: 'right' });

  // Header bottom line
  pdf.setDrawColor(accentR, accentG, accentB);
  pdf.setLineWidth(0.8);
  pdf.line(0, 38, pageW, 38);

  y = 48;

  // ── PARTIES SECTION ──
  setFont(7, 'bold', [accentR, accentG, accentB]);
  addText('1. PARTIES INVOLVED', margin, y);
  y += 2;
  drawLine(y);
  y += 5;

  // Party A box
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, y, contentW / 2 - 3, 28, 2, 2, 'FD');

  setFont(7, 'bold', [accentR, accentG, accentB]);
  addText('PARTY A — CREATOR', margin + 4, y + 6);

  setFont(8, 'bold', [15,23,42]);
  addText(creator.name || '—', margin + 4, y + 13);

  setFont(7, 'normal', [100,116,139]);
  addText(creator.phone || '—', margin + 4, y + 19);
  addText(creator.email || '—', margin + 4, y + 24);

  if (creator.ninVerified) {
  pdf.setFillColor(accentR, accentG, accentB);
  pdf.roundedRect(margin + 4, y + 27, 24, 4, 1, 1, 'F');
  setFont(6, 'bold', [255,255,255]);
  addText('NIN VERIFIED', margin + 5, y + 30);
}

  // Party B box
  const bx = margin + contentW / 2 + 3;
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(bx, y, contentW / 2 - 3, 28, 2, 2, 'FD');

  setFont(7, 'bold', [accentR, accentG, accentB]);
  addText('PARTY B — RECIPIENT', bx + 4, y + 6);

  // All recipient party boxes (B, C, D, E...)
  const allRecipients = data.signatures || [];
  const recipientLetters = ['B', 'C', 'D', 'E'];
  const partyBoxW = contentW / 2 - 3;

  for (let i = 0; i < Math.max(allRecipients.length, 1); i++) {
    const sig = allRecipients[i];
    const letter = recipientLetters[i] || String.fromCharCode(66 + i);
    // Party B shares row with Party A (right col), Party C starts new row (left col), etc.
    const col = (i + 1) % 2;
    const isNewRow = col === 0;

    if (isNewRow) {
      y += 36;
      checkPage(36);
    }

    const bx = col === 0 ? margin : margin + partyBoxW + 6;

    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(bx, y, partyBoxW, 28, 2, 2, 'FD');

    setFont(7, 'bold', [accentR, accentG, accentB]);
    addText(`PARTY ${letter} — RECIPIENT`, bx + 4, y + 6);

    setFont(8, 'bold', [15, 23, 42]);
    addText(sig?.name || '—', bx + 4, y + 13);

    setFont(7, 'normal', [100, 116, 139]);
    addText(sig?.phone || '—', bx + 4, y + 19);
    addText(`Signed: ${sig?.signedAt ? new Date(sig.signedAt).toLocaleDateString('en-NG') : '—'}`, bx + 4, y + 24);
  }

  y += 36;

  // ── AGREEMENT TYPE ──
  if (agreement?.type) {
    const typeLabels = {
      personal_loan:   'Personal Loan / Money Lending',
      item_borrow:     'Rent / Item Borrowing',
      service_job:     'Service / Job Agreement',
      roommate:        'Roommate / House Agreement',
      event_vendor:    'Event Vendor Agreement',
      business_supply: 'Business Supply & Trade Contract',
      sla:             'Service Level Agreement (SLA)',
      nda:             'Non-Disclosure Agreement (NDA)',
      partnership:     'Partnership / Equity Agreement',
      retainer:        'Client Retainer Agreement',
      employment:      'Employment / Contractor Agreement',
      mou:             'Memorandum of Understanding (MOU)',
      custom:          'Custom Legal Contract',
    };
    setFont(7, 'normal', [100,116,139]);
    addText(`Agreement Type: ${typeLabels[agreement.type] || agreement.type}`, margin, y);
    y += 8;
  }

  // ── TERMS SECTION ──
  checkPage(30);
  setFont(7, 'bold', [accentR, accentG, accentB]);
  addText('2. AGREED TERMS & COVENANTS', margin, y);
  y += 2;
  drawLine(y);
  y += 6;

  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, y, contentW, 4, 1, 1, 'FD');

  setFont(8, 'normal', [30,41,59]);
  const termsText = cleanText(agreement?.polishedTerms || agreement?.rawTerms || 'No terms provided.');
  y += 4;

  // Terms text with wrapping
  pdf.setFillColor(248, 250, 252);
  const termsLines = pdf.splitTextToSize(termsText, contentW - 8);
  const termsBoxH = termsLines.length * 4.5 + 8;
  pdf.roundedRect(margin, y, contentW, termsBoxH, 2, 2, 'FD');
  y += 5;

  setFont(8, 'italic', [51,65,85]);
  termsLines.forEach(line => {
    if (y > pageH - margin - 10) {
      pdf.addPage();
      y = margin + 10;
    }
    addText(line, margin + 4, y);
    y += 4.5;
  });
  y += 6;

  // ── ENTERPRISE CLAUSES ──
  if (plan === 'enterprise' && agreement?.clauses?.length) {
    checkPage(20);
    setFont(7, 'bold', [accentR, accentG, accentB]);
    addText('3. STANDARD LEGAL CLAUSES', margin, y);
    y += 2;
    drawLine(y);
    y += 6;

    const clauseLabels = {
      penalty:         { title: 'Penalty Adjustment Clause', text: 'Any default or late payment shall attract a legal liability standard late fee as enforceable under Nigerian law.' },
      confidentiality: { title: 'Mutual Confidentiality Framework', text: 'All parties are bound to non-disclosure of any proprietary or sensitive information shared in connection with this agreement.' },
      dispute:         { title: 'Dispute Resolution Protocol', text: 'Any disputes arising from this agreement shall first be submitted to mandatory arbitration before any litigation steps are taken.' },
      governing_law:   { title: 'Governing Law Declaration', text: 'This agreement is governed by and construed in accordance with the laws of the Federal Republic of Nigeria.' },
    };

    agreement.clauses.forEach((key, i) => {
      const clause = clauseLabels[key];
      if (!clause) return;
      checkPage(16);

      setFont(7, 'bold', [15,23,42]);
      addText(`${i + 1}. ${clause.title}`, margin, y);
      y += 4;

      setFont(7, 'normal', [71,85,105]);
      y = wrapText(clause.text, margin + 3, y, contentW - 3, 4.5);
      y += 4;
    });
  }

  // ── SIGNATURES SECTION ──
  const sigSectionNum = (plan === 'enterprise' && agreement?.clauses?.length) ? '4.' : '3.';
  checkPage(60);
  setFont(7, 'bold', [accentR, accentG, accentB]);
  addText(`${sigSectionNum} SIGNATURES`, margin, y);
  y += 2;
  drawLine(y);
  y += 6;

  const sigBoxH = 40;
const partyLetters = ['A', 'B', 'C', 'D', 'E'];
const allParties = [
  {
    label: 'PARTY A — CREATOR',
    name: creator.name,
    signatureData: creator.signatureData,
    signedAt: creator.signedAt,
  },
  ...(data.signatures || []).map((sig, i) => ({
    label: `PARTY ${partyLetters[i + 1]} — RECIPIENT`,
    name: sig.name,
    signatureData: sig.signatureData,
    signedAt: sig.signedAt,
  })),
];

const cols = Math.min(allParties.length, 2);
const sigBoxW = cols === 1 ? contentW : contentW / 2 - 4;

for (let i = 0; i < allParties.length; i++) {
  const party = allParties[i];
  const col = i % 2;
  const isNewRow = col === 0;

  if (isNewRow && i !== 0) {
    y += sigBoxH + 6;
    checkPage(sigBoxH + 10);
  }

  const xPos = col === 0 ? margin : margin + sigBoxW + 8;

  pdf.setDrawColor(226, 232, 240);
  pdf.setFillColor(248, 252, 248);
  pdf.roundedRect(xPos, y, sigBoxW, sigBoxH, 2, 2, 'FD');

  setFont(6, 'bold', [100, 116, 139]);
  addText(party.label, xPos + 3, y + 5);

  setFont(6, 'normal', [100, 116, 139]);
  addText(party.name || '—', xPos + 3, y + 10);

  if (party.signatureData) {
    try {
      pdf.addImage(party.signatureData, 'PNG', xPos + 3, y + 12, sigBoxW - 6, 20);
    } catch (_) {}
  }

  setFont(6, 'normal', [100, 116, 139]);
  addText(
    `Signed: ${party.signedAt ? new Date(party.signedAt).toLocaleDateString('en-NG') : '—'}`,
    xPos + 3,
    y + 36
  );
}

y += sigBoxH + 10;

  // ── AUDIT TRAIL ──
  checkPage(35);
  setFont(7, 'bold', [accentR, accentG, accentB]);
  addText('AUDIT TRAIL', margin, y);
  y += 2;
  drawLine(y);
  y += 5;

const partyIpLines = (data.signatures || []).map((sig, i) => {
    const label = ['B','C','D','E'][i];
    return `Party ${label} IP: ${sig.ipAddress || '—'}`;
  });

  const auditLines = [
    `Creator IP: ${auditTrail?.creatorIP || '—'}`,
    ...partyIpLines,
    `Completed At: ${auditTrail?.completedAt?.toDate ? auditTrail.completedAt.toDate().toLocaleString('en-NG') : '—'}`,
    `Creator Device: ${(auditTrail?.creatorDevice || '—').substring(0, 80)}`,
    ...(data.signatures || []).map((sig, i) =>
      `Party ${['B','C','D','E'][i]} Device: ${(sig.userAgent || '—').substring(0, 80)}`
    ),
  ];

  pdf.setFillColor(241, 245, 249);
  const auditBoxH = Math.max(28, auditLines.length * 4.5 + 6);
  pdf.roundedRect(margin, y, contentW, auditBoxH, 2, 2, 'F');

  setFont(6, 'normal', [71, 85, 105]);
  auditLines.forEach((line, i) => {
    addText(line, margin + 4, y + 5 + i * 4.5);
  });

  y += auditBoxH + 7;

  // ── FOOTER ──
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.line(margin, pageH - 12, pageW - margin, pageH - 12);
    setFont(6, 'normal', [148,163,184]);
    addText('This document was generated by SignAm (signamnow.com) and is legally binding under the Nigerian Evidence Act 2011.', margin, pageH - 8);
    addText(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 8, { align: 'right' });
  }

  // ── DOWNLOAD ──
  pdf.save(`SignAm-${docId}.pdf`);
}

// Helper: load image URL as base64
function loadImageAsBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      c.getContext('2d').drawImage(img, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ─── SUCCESS SCREEN ──────────────────────────

function showSuccessScreen(docId) {
  const signLink = `${window.location.origin}/sign.html?id=${docId}`;
  const msg      = encodeURIComponent(`I've created a legal agreement on SignAm. Please review and sign:\n${signLink}`);

  const overlay = document.createElement('div');
  overlay.className = 'modal-wrap open';
  overlay.innerHTML = `
    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
    <div class="modal-card relative bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-w-sm w-full space-y-5 text-center">
      <div class="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-2xl">✓</div>
      <div>
        <h3 class="text-base font-bold text-slate-900">Agreement Created!</h3>
        <p class="text-xs text-slate-500 mt-1 leading-relaxed">Your agreement is live and locked. Send the link to your partner so they can sign.</p>
      </div>
      <div class="bg-slate-50 border border-slate-200 rounded-xl p-3">
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Document ID</p>
        <p class="font-mono font-bold text-slate-900">${docId}</p>
      </div>
      <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1">
        <p class="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Shareable Link</p>
        <p class="font-mono text-xs text-slate-700 break-all">${signLink}</p>
      </div>
      <div class="grid grid-cols-2 gap-2">
  <button id="successCopyBtn" data-link="${signLink}"
    class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm">
    Copy Link
  </button>
  <a href="https://wa.me/?text=${msg}" target="_blank"
    class="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm flex items-center justify-center">
    WhatsApp →
  </a>
</div>
<button id="successDoneBtn" class="text-xs font-semibold text-slate-400 hover:text-slate-600 transition">
  Back to Dashboard
</button>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#successCopyBtn').addEventListener('click', (e) => {
    navigator.clipboard.writeText(e.target.dataset.link).then(() => {
      e.target.textContent = '✓ Copied!';
      setTimeout(() => e.target.textContent = 'Copy Link', 2000);
    });
  });

  overlay.querySelector('#successDoneBtn').addEventListener('click', () => {
    overlay.remove();
    window.location.reload(); // Reload dashboard to show new agreement
  });
}

// ─── ONBOARDING STORY MODAL LOGIC ───

let currentStorySlide = 1;
const TOTAL_STORY_SLIDES = 4;

const storyModal   = document.getElementById('storyModal');
const storyNextBtn = document.getElementById('storyNextBtn');
const storyPrevBtn = document.getElementById('storyPrevBtn');

function initStoryModal() {
  // Check if user has already seen this specific app story
  const hasSeenStory = localStorage.getItem('signam_story_seen');
  
  if (!hasSeenStory) {
    storyModal.classList.remove('hidden');
    storyModal.classList.add('flex');
    renderStorySlide(1);
  }
}

function renderStorySlide(slideIndex) {
  currentStorySlide = slideIndex;

  // Toggle active slide visibility
  document.querySelectorAll('.story-slide').forEach((slide, idx) => {
    slide.classList.toggle('hidden', idx !== (slideIndex - 1));
  });

  // Update Progress Indicator Dots
  document.querySelectorAll('.story-dot').forEach((dot, idx) => {
    if (idx === (slideIndex - 1)) {
      dot.classList.add('bg-emerald-600', 'w-4');
      dot.classList.remove('bg-slate-200');
    } else {
      dot.classList.remove('bg-emerald-600', 'w-4');
      dot.classList.add('bg-slate-200');
    }
  });

  // Handle Button states based on slide progress
storyPrevBtn.classList.toggle('invisible', slideIndex === 1);

if (slideIndex === 1) {
  // Slide 1: Next button takes full width, no back button space needed
  storyNextBtn.textContent = "Next →";
  storyNextBtn.className = "w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition shadow-md shadow-emerald-600/10";
  storyPrevBtn.classList.add('hidden');
} else if (slideIndex === TOTAL_STORY_SLIDES) {
  // Last slide: CTA button
  storyNextBtn.textContent = "Lock my first deal →";
  storyNextBtn.className = "w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition shadow-md shadow-emerald-600/10";
  storyPrevBtn.classList.remove('hidden');
} else {
  // Middle slides: show back button
  storyNextBtn.textContent = "Next →";
  storyNextBtn.className = "w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition shadow-md shadow-emerald-600/10";
  storyPrevBtn.classList.remove('hidden');
}
}

// Event Listeners for Story Controls
storyNextBtn.addEventListener('click', () => {
  if (currentStorySlide < TOTAL_STORY_SLIDES) {
    renderStorySlide(currentStorySlide + 1);
  } else {
    // Action on last slide: Close and mark as completed
    localStorage.setItem('signam_story_seen', 'true');
    storyModal.classList.add('hidden');
    storyModal.classList.remove('flex');
    showToast("Welcome to SignAm! Let's lock your first deal.");
  }
});

storyPrevBtn.addEventListener('click', () => {
  if (currentStorySlide > 1) {
    renderStorySlide(currentStorySlide - 1);
  }
});

// Trigger verification once the window resources compile smoothly
window.addEventListener('DOMContentLoaded', initStoryModal);


// ─── LOGOUT ──────────────────────────────────

authStatusBtn.addEventListener('click', () => openModal(logoutModal));
cancelLogoutBtn.addEventListener('click', () => closeModal(logoutModal));

confirmLogoutBtn.addEventListener('click', async () => {
  confirmLogoutBtn.disabled    = true;
  confirmLogoutBtn.textContent = 'Leaving...';
  cancelLogoutBtn.disabled     = true;
  try {
    await signOut(auth);
    window.location.href = 'login.html';
  } catch (err) {
    showToast('Error logging out. Please try again.');
    confirmLogoutBtn.disabled    = false;
    confirmLogoutBtn.textContent = 'Sign Me Out';
    cancelLogoutBtn.disabled     = false;
    closeModal(logoutModal);
  }
});