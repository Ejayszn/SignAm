// ─────────────────────────────────────────────
//  SignAm — Auth JS
//  Handles: Login / Sign Up / Password Recovery / Google OAuth
// ─────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC4yCNmFHAkFoO7nYfdS2XcgIHsZn_0_ys",
  authDomain: "signamnow.firebaseapp.com",
  projectId: "signamnow",
  storageBucket: "signamnow.firebasestorage.app",
  messagingSenderId: "267871547400",
  appId: "1:267871547400:web:b70ac6c08fa0cfdd1561bd",
  measurementId: "G-4C1B313HBZ",
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();


// ─── MODE STATE ──────────────────────────────
// Three possible modes: 'login' | 'signup' | 'recovery'

let mode = 'login';


// ─── DOM REFS ────────────────────────────────

const authForm       = document.getElementById('authForm');
const submitAuthBtn  = document.getElementById('submitAuthBtn');
const googleAuthBtn  = document.getElementById('googleAuthBtn');
const googleBtnText  = document.getElementById('googleBtnText');
const authDividerRow = document.getElementById('authDividerRow');

const authName     = document.getElementById('authName');
const authEmail    = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const rememberMe   = document.getElementById('rememberMe');
const agreeToTerms = document.getElementById('agreeToTerms');

const fullNameRow      = document.getElementById('fullNameRow');
const passwordBlock    = document.getElementById('passwordBlock');
const rememberMeRow    = document.getElementById('rememberMeRow');
const termsAgreementRow = document.getElementById('termsAgreementRow');
const recoveryBackRow  = document.getElementById('recoveryBackRow');

const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const backToLoginBtn     = document.getElementById('backToLoginBtn');

// Toggle buttons — referenced by stable IDs; no innerHTML recreation needed
const topToggleBtn    = document.getElementById('topToggleBtn');
const bottomToggleBtn = document.getElementById('bottomToggleBtn');

// Text-only nodes that JS updates via .textContent (no innerHTML)
const topToggleText    = document.getElementById('topToggleText');  // <p>
const bottomToggleLabel = document.getElementById('bottomToggleLabel'); // <span>
const desktopTitle    = document.getElementById('desktopTitle');
const desktopSubtitle = document.getElementById('desktopSubtitle');
const mobileTitle     = document.getElementById('mobileTitle');
const mobileSubtitle  = document.getElementById('mobileSubtitle');

// Eye toggle
const togglePasswordVisibilityBtn = document.getElementById('togglePasswordVisibilityBtn');
const eyeOpenIcon   = document.getElementById('eyeOpenIcon');
const eyeClosedIcon = document.getElementById('eyeClosedIcon');

// Error elements
const formErrorBanner = document.getElementById('formErrorBanner');
const nameError     = document.getElementById('nameError');
const emailError    = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const termsError    = document.getElementById('termsError');

// Success modal
const successModal  = document.getElementById('successModal');
const modalMessage  = document.getElementById('modalMessage');


// ─── MODE SWITCHER ───────────────────────────
// Single source of truth — call setMode() to switch, never mutate mode directly elsewhere.

function setMode(newMode) {
  mode = newMode;
  clearAllErrors();

  // Shared defaults
  googleAuthBtn.classList.remove('hidden');
  authDividerRow.classList.remove('hidden');
  passwordBlock.classList.remove('hidden');
  authPassword.required = true;
  recoveryBackRow.classList.add('hidden');
  forgotPasswordLink.classList.remove('invisible');

  if (mode === 'signup') {
    desktopTitle.textContent    = 'Create your account';
    desktopSubtitle.textContent = 'Join Nigerian freelancers and vendors protecting their business today.';
    mobileTitle.textContent     = 'Get Started';
    mobileSubtitle.textContent  = 'Create an account to protect your business on the go.';
    submitAuthBtn.textContent   = 'Create My Account →';
    googleBtnText.textContent   = 'Sign up with Google';

    fullNameRow.classList.remove('hidden');
    authName.required = true;
    rememberMeRow.classList.add('hidden');
    // FIX: toggle 'flex' explicitly — don't use 'hidden flex' in markup
    termsAgreementRow.classList.remove('hidden');
    termsAgreementRow.style.display = 'flex';

    topToggleBtn.textContent    = 'Sign in';
    bottomToggleBtn.textContent = 'Sign in';
    bottomToggleLabel.textContent = 'Already have an account?';
    // Update accessible label on top toggle paragraph
    topToggleText.firstChild.textContent = 'Already have an account? ';

  } else if (mode === 'login') {
    desktopTitle.textContent    = 'Welcome back';
    desktopSubtitle.textContent = 'Enter your credentials to open your workspace.';
    mobileTitle.textContent     = 'Welcome Back';
    mobileSubtitle.textContent  = 'Sign in to access your agreements workspace';
    submitAuthBtn.textContent   = 'Open My Workspace →';
    googleBtnText.textContent   = 'Continue with Google';

    fullNameRow.classList.add('hidden');
    authName.required = false;
    rememberMeRow.classList.remove('hidden');
    termsAgreementRow.classList.add('hidden');
    termsAgreementRow.style.display = '';
    forgotPasswordLink.classList.remove('invisible');

    topToggleBtn.textContent    = 'Create an account';
    bottomToggleBtn.textContent = 'Create an account';
    bottomToggleLabel.textContent = 'New to SignAm?';
    topToggleText.firstChild.textContent = 'New to SignAm? ';

  } else if (mode === 'recovery') {
    desktopTitle.textContent    = 'Reset your password';
    desktopSubtitle.textContent = "Enter your registered email and we'll send you a secure recovery link.";
    mobileTitle.textContent     = 'Reset Password';
    mobileSubtitle.textContent  = 'Get back into your SignAm workspace.';
    submitAuthBtn.textContent   = 'Send Reset Link';

    googleAuthBtn.classList.add('hidden');
    authDividerRow.classList.add('hidden');
    passwordBlock.classList.add('hidden');
    authPassword.required = false;
    fullNameRow.classList.add('hidden');
    authName.required = false;
    rememberMeRow.classList.add('hidden');
    termsAgreementRow.classList.add('hidden');
    termsAgreementRow.style.display = '';
    forgotPasswordLink.classList.add('invisible');
    recoveryBackRow.classList.remove('hidden');
  }
}

// Stable event listeners — buttons never recreated so no stale reference issue
topToggleBtn.addEventListener('click',    () => setMode(mode === 'login' ? 'signup' : 'login'));
bottomToggleBtn.addEventListener('click', () => setMode(mode === 'login' ? 'signup' : 'login'));
forgotPasswordLink.addEventListener('click', () => setMode('recovery'));
backToLoginBtn.addEventListener('click',     () => setMode('login'));


// ─── PASSWORD VISIBILITY TOGGLE ──────────────

togglePasswordVisibilityBtn.addEventListener('click', () => {
  const isHidden = authPassword.type === 'password';
  authPassword.type = isHidden ? 'text' : 'password';
  eyeOpenIcon.classList.toggle('hidden', isHidden);
  eyeClosedIcon.classList.toggle('hidden', !isHidden);
});


// ─── INLINE ERROR HELPERS ────────────────────

function showFieldError(el, msg) {
  el.textContent = msg;
  el.classList.add('visible');
}

function clearAllErrors() {
  formErrorBanner.classList.add('hidden');
  formErrorBanner.textContent = '';
  [nameError, emailError, passwordError, termsError].forEach(el => {
    el.classList.remove('visible');
  });
  [authName, authEmail, authPassword].forEach(el => {
    el.classList.remove('error');
  });
}

function showBannerError(msg) {
  formErrorBanner.textContent = msg;
  formErrorBanner.classList.remove('hidden');
  formErrorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Clear field error on keystroke
[authName, authEmail, authPassword].forEach(input => {
  input.addEventListener('input', () => {
    input.classList.remove('error');
    // Clear corresponding field error
    const map = { authName: nameError, authEmail: emailError, authPassword: passwordError };
    map[input.id]?.classList.remove('visible');
    formErrorBanner.classList.add('hidden');
  });
});


// ─── CLIENT-SIDE VALIDATION ──────────────────

function validateForm() {
  clearAllErrors();
  let valid = true;

  if (mode === 'signup') {
    if (!authName.value.trim()) {
      showFieldError(nameError, 'Please enter your full name.');
      authName.classList.add('error');
      valid = false;
    }
  }

  if (mode !== 'recovery') {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(authEmail.value.trim())) {
      showFieldError(emailError, 'Please enter a valid email address.');
      authEmail.classList.add('error');
      valid = false;
    }
    if (authPassword.value.length < 6) {
      showFieldError(passwordError, 'Password must be at least 6 characters.');
      authPassword.classList.add('error');
      valid = false;
    }
  } else {
    // Recovery: only email needed
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(authEmail.value.trim())) {
      showFieldError(emailError, 'Please enter a valid email address.');
      authEmail.classList.add('error');
      valid = false;
    }
  }

  if (mode === 'signup' && !agreeToTerms.checked) {
    showFieldError(termsError, 'You must agree to the Terms to create an account.');
    valid = false;
  }

  return valid;
}


// ─── FIREBASE ERROR MAP ──────────────────────

function getFriendlyError(code) {
  const map = {
    'auth/email-already-in-use':  'This email is already registered. Try signing in instead.',
    'auth/invalid-credential':    'Incorrect email or password. Please check and try again.',
    'auth/wrong-password':        'Incorrect email or password. Please check and try again.',
    'auth/user-not-found':        'No account found with that email address.',
    'auth/weak-password':         'Password is too weak — use at least 6 characters.',
    'auth/too-many-requests':     'Too many failed attempts. Please wait a few minutes and try again.',
    'auth/popup-closed-by-user':  'Google sign-in was cancelled. Please try again.',
    'auth/network-request-failed':'Network error. Please check your connection and retry.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}


// ─── SUCCESS MODAL ───────────────────────────

function showSuccess(message, redirectUrl, delayMs = 2500) {
  modalMessage.textContent = message;
  // FIX: was "hidden flex" in HTML — now we explicitly set display
  successModal.classList.remove('hidden');
  successModal.style.display = 'flex';
  setTimeout(() => { window.location.href = redirectUrl; }, delayMs);
}


// ─── FORM SUBMISSION ─────────────────────────

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const email       = authEmail.value.trim();
  const password    = authPassword.value;
  const displayName = authName.value.trim();

  submitAuthBtn.disabled = true;
  const originalLabel = submitAuthBtn.textContent;

  try {
    if (mode === 'recovery') {
      submitAuthBtn.textContent = 'Sending link...';
      await sendPasswordResetEmail(auth, email);
      showSuccess(`Reset link sent to ${email}. Check your spam folder if it doesn't arrive shortly.`, 'login.html', 4000);
      return;
    }

    if (mode === 'signup') {
      submitAuthBtn.textContent = 'Creating account...';
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName });
      showSuccess(`Welcome to SignAm, ${displayName}! Account created.`, 'dashboard.html');
      return;
    }

    // Login
    submitAuthBtn.textContent = 'Authorizing...';

    // Honor "remember me" — FIX: was collected but never used
    const persistence = rememberMe.checked ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);

    await signInWithEmailAndPassword(auth, email, password);
    showSuccess('Welcome back! Opening your workspace...', 'dashboard.html');

  } catch (err) {
    showBannerError(getFriendlyError(err.code));
    submitAuthBtn.disabled = false;
    submitAuthBtn.textContent = originalLabel;
  }
});


// ─── GOOGLE OAUTH ────────────────────────────

googleAuthBtn.addEventListener('click', async () => {
  if (mode === 'signup' && !agreeToTerms.checked) {
    showFieldError(termsError, 'You must agree to the Terms to create an account.');
    return;
  }

  googleAuthBtn.disabled = true;
  const originalText = googleBtnText.textContent;
  googleBtnText.textContent = 'Connecting...';

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const name = result.user.displayName || 'User';
    showSuccess(`Welcome, ${name}! Syncing your workspace...`, 'dashboard.html');
  } catch (err) {
    showBannerError(getFriendlyError(err.code));
    googleAuthBtn.disabled = false;
    googleBtnText.textContent = originalText;
  }
});


// ─── INIT ────────────────────────────────────

setMode('login');