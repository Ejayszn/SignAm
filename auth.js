// 1. Import required tools directly from the Firebase web client modules setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// 2. Your project application's configuration keys 
const firebaseConfig = {
  apiKey: "AIzaSyC4yCNmFHAkFoO7nYfdS2XcgIHsZn_0_ys",
  authDomain: "signamnow.firebaseapp.com",
  projectId: "signamnow",
  storageBucket: "signamnow.firebasestorage.app",
  messagingSenderId: "267871547400",
  appId: "1:267871547400:web:b70ac6c08fa0cfdd1561bd",
  measurementId: "G-4C1B313HBZ"
};

// 3. Initialize Firebase 
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// App UI States
let isSignUpMode = false;
let isPasswordRecoveryMode = false; 

// DOM Elements
const termsAgreementRow = document.getElementById('termsAgreementRow');
const agreeToTerms = document.getElementById('agreeToTerms');
const successModal = document.getElementById('successModal');
const modalMessage = document.getElementById('modalMessage');
const authForm = document.getElementById('authForm');
const fullNameRow = document.getElementById('fullNameRow');
const rememberMeRow = document.getElementById('rememberMeRow');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');

const recoveryBackRow = document.getElementById('recoveryBackRow');
const backToLoginBtn = document.getElementById('backToLoginBtn');

const authName = document.getElementById('authName');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');

// 💡 FIX: Target the grandparent element to hide the entire password block (label + input)
const passwordInputRow = authPassword.closest('div:not(.relative)'); 

const submitAuthBtn = document.getElementById('submitAuthBtn');

// Eye Toggle Elements
const togglePasswordVisibilityBtn = document.getElementById('togglePasswordVisibilityBtn');
const eyeOpenIcon = document.getElementById('eyeOpenIcon');
const eyeClosedIcon = document.getElementById('eyeClosedIcon');

// Heading Elements for Text Switching
const desktopTitle = document.getElementById('desktopTitle');
const desktopSubtitle = document.getElementById('desktopSubtitle');
const mobileTitle = document.getElementById('mobileTitle');
const mobileSubtitle = document.getElementById('mobileSubtitle');

// Mode Toggle Button Triggers
const topToggleText = document.getElementById('topToggleText');
const topToggleBtn = document.getElementById('topToggleBtn');
const bottomToggleText = document.getElementById('bottomToggleText');
const bottomToggleBtn = document.getElementById('bottomToggleBtn');

// 4. Function to change layout fluidly between Login, Sign Up, and Password Reset states
function toggleAuthMode() {
  isSignUpMode = !isSignUpMode;
  isPasswordRecoveryMode = false; 
  
  passwordInputRow.classList.remove('hidden');
  authPassword.required = true;
  recoveryBackRow.classList.add('hidden');
  
  if (isSignUpMode) {
    desktopTitle.innerText = "Create your account";
    desktopSubtitle.innerText = "Join over 7,000 Nigerian freelancers and vendors today.";
    mobileTitle.innerText = "Get Started";
    mobileSubtitle.innerText = "Create an account to protect your business on the go.";
    
    submitAuthBtn.innerText = "Create My Account →";
    
    fullNameRow.classList.remove('hidden');
    authName.required = true;
    rememberMeRow.classList.add('hidden');
    // SHOW terms row on Sign Up state
    termsAgreementRow.classList.remove('hidden');
    forgotPasswordLink.classList.add('invisible');
    forgotPasswordLink.classList.add('invisible'); 
    
    topToggleText.innerHTML = `Already have an account? <button type="button" id="topToggleBtn" class="text-emerald-600 font-bold hover:underline ml-1">Sign in</button>`;
    bottomToggleText.innerHTML = `Already have an account? <button type="button" id="bottomToggleBtn" class="text-emerald-600 font-bold hover:underline ml-0.5">Sign in</button>`;
  } else {
    desktopTitle.innerText = "Welcome back";
    desktopSubtitle.innerText = "Enter your credentials below to open your workspace dashboard.";
    mobileTitle.innerText = "Welcome Back";
    mobileSubtitle.innerText = "Sign in to access your active agreements workspace";
    
    submitAuthBtn.innerText = "Open My Workspace →";
    
    fullNameRow.classList.add('hidden');
    authName.required = false;
    rememberMeRow.classList.remove('hidden');
    // HIDE terms row on Sign In state
    termsAgreementRow.classList.add('hidden');
    forgotPasswordLink.classList.remove('invisible');
    forgotPasswordLink.classList.remove('invisible');
    
    topToggleText.innerHTML = `New to SignAm? <button type="button" id="topToggleBtn" class="text-emerald-600 font-bold hover:underline ml-1">Create an account</button>`;
    bottomToggleText.innerHTML = `New to SignAm? <button type="button" id="bottomToggleBtn" class="text-emerald-600 font-bold hover:underline ml-0.5">Create an account</button>`;
  }
  
  document.getElementById('topToggleBtn')?.addEventListener('click', toggleAuthMode);
  document.getElementById('bottomToggleBtn')?.addEventListener('click', toggleAuthMode);
}

// 5. Function to switch card layout directly to Forgot Password Mode
function enterPasswordRecoveryMode() {
  isPasswordRecoveryMode = true;
  
  desktopTitle.innerText = "Reset your password";
  desktopSubtitle.innerText = "Enter your registered email and we'll send you a secure recovery link.";
  mobileTitle.innerText = "Reset Password";
  mobileSubtitle.innerText = "Get back into your secure active workspace dashboard.";
  
  submitAuthBtn.innerText = "Send Reset Link";
  
  fullNameRow.classList.add('hidden');
  authName.required = false;
  passwordInputRow.classList.add('hidden');
  authPassword.required = false;
  rememberMeRow.classList.add('hidden');
  forgotPasswordLink.classList.add('invisible');
  
  recoveryBackRow.classList.remove('hidden');
}

// Attach event listeners to toggle views smoothly
topToggleBtn.addEventListener('click', toggleAuthMode);
bottomToggleBtn.addEventListener('click', toggleAuthMode);
forgotPasswordLink.addEventListener('click', enterPasswordRecoveryMode);
backToLoginBtn.addEventListener('click', () => {
  isSignUpMode = true; 
  toggleAuthMode();
});

// 💡 EYE TOGGLE CONTROLLER FUNCTIONALITY PLACED HERE CLEANLY
if (togglePasswordVisibilityBtn && authPassword) {
  togglePasswordVisibilityBtn.addEventListener('click', () => {
    if (authPassword.type === 'password') {
      authPassword.type = 'text';
      eyeOpenIcon.classList.add('hidden');
      eyeClosedIcon.classList.remove('hidden');
    } else {
      authPassword.type = 'password';
      eyeOpenIcon.classList.remove('hidden');
      eyeClosedIcon.classList.add('hidden');
    }
  });
}

// 6. Core Submission Controller logic
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = authEmail.value.trim();
  const password = authPassword.value;
  const displayName = authName.value.trim();

  submitAuthBtn.disabled = true;

  if (isPasswordRecoveryMode) {
    submitAuthBtn.innerText = "Sending reset link... ⏳";
    try {
      await sendPasswordResetEmail(auth, email);
      console.log(`Password reset email successfully queued for: ${email}`);
      showSuccessModal(`Done! A security reset link has been dispatched to ${email}. Please check your spam folder if it doesn't arrive shortly.`, "login.html");
    } catch (error) {
      console.error("Password Reset Transmit Error:", error);
      if (error.code === 'auth/user-not-found') {
        alert("This email address is not registered on SignAm. Please double check and try again.");
      } else {
        alert(`Reset Request Failed: ${error.message}`);
      }
      submitAuthBtn.disabled = false;
      submitAuthBtn.innerText = "Send Reset Link";
    }
    return; 
  }

  if (isSignUpMode) {
    // Check if the user accepted the legal frameworks first
    if (!agreeToTerms.checked) {
      alert("You must agree to SignAm's Terms of Service and Privacy Policy to create an account.");
      submitAuthBtn.disabled = false;
      return; // Stop the signup process right here
    }
    submitAuthBtn.innerText = "Creating your account...";
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: displayName });
      showSuccessModal(`Welcome to SignAm, ${displayName}! Account created successfully.`, "home.html");
    } catch (error) {
      console.error("Signup Failure:", error);
      if (error.code === 'auth/email-already-in-use') {
        alert("This email address is already registered. Please sign in instead.");
      } else if (error.code === 'auth/weak-password') {
        alert("Password is too weak. Please use at least 6 characters.");
      } else {
        alert(`Signup Error: ${error.message}`);
      }
      submitAuthBtn.disabled = false;
      submitAuthBtn.innerText = "Create My Account →";
    }
    
  } else {
    submitAuthBtn.innerText = "Authorizing credentials...";
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      showSuccessModal("Welcome back! Opening your workspace dashboard...", "home.html");
    } catch (error) {
      console.error("Login Failure:", error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        alert("Invalid email or password. Please verify your entries and try again.");
      } else if (error.code === 'auth/too-many-requests') {
        alert("Too many failed attempts. This device has been temporarily locked.");
      } else {
        alert(`Login Error: ${error.message}`);
      }
      submitAuthBtn.disabled = false;
      submitAuthBtn.innerText = "Open My Workspace →";
    }
  }
});

function showSuccessModal(message, redirectUrl) {
  if (modalMessage && successModal) {
    modalMessage.innerText = message;
    successModal.classList.remove('hidden'); 
  }
  setTimeout(() => {
    window.location.href = redirectUrl;
  }, 4000); 
}