// 1. Import required tools directly from the Firebase web client modules setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// Your project application's configuration keys
const firebaseConfig = {
  apiKey: "AIzaSyC4yCNmFHAkFoO7nYfdS2XcgIHsZn_0_ys",
  authDomain: "signamnow.firebaseapp.com",
  projectId: "signamnow",
  storageBucket: "signamnow.firebasestorage.app",
  messagingSenderId: "267871547400",
  appId: "1:267871547400:web:b70ac6c08fa0cfdd1561bd",
  measurementId: "G-4C1B313HBZ"
};

// Initialize Firebase 
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// State Management Engine
let currentStep = 1;
const totalSteps = 3;

// DOM Selectors
const logoutModal = document.getElementById('logoutModal');
const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
const steps = document.querySelectorAll('.form-step');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const progressBar = document.getElementById('progressBar');
const partiesContainer = document.getElementById('partiesContainer');
const addPartyBtn = document.getElementById('addPartyBtn');

const inputTerms = document.getElementById('rawTerms');
const previewTerms = document.getElementById('previewTerms');
const previewSigImage = document.getElementById('previewSigImage');

// DOM Elements for Top Nav Profiles Tracker
const userDisplayBadge = document.getElementById('userDisplayBadge');
const avatarContainer = document.getElementById('avatarContainer');
const userNameText = document.getElementById('userNameText');
const authStatusBtn = document.getElementById('authStatusBtn');


// --- FIREBASE SECURITY & PROFILE AUTH ENGINE ---

// Helper function to extract elegant profile initials fallback string tokens
function getInitials(name) {
  if (!name) return "??";
  const namesArray = name.trim().split(" ");
  if (namesArray.length === 1) return namesArray[0].substring(0, 2).toUpperCase();
  return (namesArray[0][0] + namesArray[1][0]).toUpperCase();
}

// Active Session Listener Observer Loop
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is securely signed in! Let's populate their identity details cleanly
    if (userDisplayBadge) userDisplayBadge.classList.remove('hidden');
    if (userNameText) userNameText.innerText = user.displayName || "SignAm User";

    // Handle Profile Avatar UI Rendering
    if (avatarContainer) {
      if (user.photoURL) {
        avatarContainer.innerHTML = `<img src="${user.photoURL}" alt="Profile Avatar" class="w-full h-full object-cover">`;
      } else {
        const initials = getInitials(user.displayName);
        avatarContainer.innerHTML = `<span>${initials}</span>`;
      }
    }
    
    // Auto-populate the first party name field with the logged-in user's name if empty
    const firstPartyInput = partiesContainer.querySelector('.party-name');
    if (firstPartyInput && !firstPartyInput.value && user.displayName) {
      firstPartyInput.value = user.displayName;
      updateDocumentPartiesPreview();
    }

  } else {
    // No user session token located, force back to authentication checkpoint gates!
    console.log("Unauthorized execution attempt intercepted. Redirecting to login...");
    window.location.href = "login.html";
  }
});

// 1. When the user clicks the header Log Out text link...
if (authStatusBtn) {
  authStatusBtn.addEventListener('click', () => {
    // Simply pop open our custom SignAm styled alert overlay box structure
    logoutModal.classList.remove('hidden');
  });
}

// 2. If the user chickens out or changes mind, intercept and close modal view safely
if (cancelLogoutBtn) {
  cancelLogoutBtn.addEventListener('click', () => {
    logoutModal.classList.add('hidden');
  });
}

// 3. If they click the absolute destructive execution block trigger button...
if (confirmLogoutBtn) {
  confirmLogoutBtn.addEventListener('click', async () => {
    try {
      // Toggle interface feedback loading states visually
      confirmLogoutBtn.disabled = true;
      confirmLogoutBtn.innerText = "Leaving...";
      if (cancelLogoutBtn) cancelLogoutBtn.disabled = true;

      // Fire core network call request to clear session tokens across instance nodes
      await signOut(auth);
      
      console.log("Logged out cleanly via custom dashboard gateway.");
      window.location.href = "login.html";
    } catch (error) {
      console.error("Sign out process threw unexpected fault profiles:", error);
      alert("Error logging out. Please refresh and try again.");
      
      // Reset layout states on unhandled runtime failures
      confirmLogoutBtn.disabled = false;
      confirmLogoutBtn.innerText = "Sign Me Out";
      if (cancelLogoutBtn) cancelLogoutBtn.disabled = false;
      logoutModal.classList.add('hidden');
    }
  });
}


// --- DYNAMIC MULTI-PARTY LOGIC ---

function getPartyLetter(index) {
  return String.fromCharCode(67 + index); // ASCII 67 is 'C'
}

addPartyBtn.addEventListener('click', () => {
  const currentExtraParties = partiesContainer.querySelectorAll('.extra-party').length;
  const partyLetter = getPartyLetter(currentExtraParties);

  const newPartyRow = document.createElement('div');
  newPartyRow.className = 'space-y-3 border-l-2 border-slate-300 pl-3 pt-2 extra-party transition-all duration-300';
  newPartyRow.innerHTML = `
    <div class="flex justify-between items-center">
      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Partner Details (Party ${partyLetter})</h3>
      <button type="button" class="remove-party-btn text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 px-2 py-0.5 rounded-lg transition-colors">✕ Remove</button>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <input type="text" placeholder="Their Full Name/ Company Name" class="party-name w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium" required>
      <input type="tel" placeholder="Their WhatsApp Number" class="party-phone w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium" required>
    </div>
  `;

  newPartyRow.querySelector('.remove-party-btn').addEventListener('click', () => {
    newPartyRow.remove();
    updateDocumentPartiesPreview();
  });

  partiesContainer.appendChild(newPartyRow);
  
  newPartyRow.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', updateDocumentPartiesPreview);
  });

  updateDocumentPartiesPreview();
});

function updateDocumentPartiesPreview() {
  const nameInputs = partiesContainer.querySelectorAll('.party-name');
  const previewPartyA = document.getElementById('previewPartyA');
  if (!previewPartyA) return;
  
  const previewContainer = previewPartyA.parentElement;
  if (nameInputs.length === 0) return;

  let textString = "This business agreement is entered into directly between ";
  
  nameInputs.forEach((input, index) => {
    const nameVal = input.value.trim() || `[Party ${String.fromCharCode(65 + index)} Name]`;
    
    if (index === 0) {
      textString += `the First Party: <span class="font-semibold underline text-slate-900 bg-slate-50 px-1 rounded">${nameVal}</span>`;
    } else if (index === nameInputs.length - 1) {
      textString += `, and the final Partner: <span class="font-semibold underline text-slate-900 bg-slate-50 px-1 rounded">${nameVal}</span>.`;
    } else {
      textString += `, Partner: <span class="font-semibold underline text-slate-900 bg-slate-50 px-1 rounded">${nameVal}</span>`;
    }
  });

  previewContainer.innerHTML = textString;
}

document.querySelectorAll('.party-name').forEach(input => {
  input.addEventListener('input', updateDocumentPartiesPreview);
});

inputTerms.addEventListener('input', () => {
  previewTerms.innerText = inputTerms.value || 'Provide transaction context details in the wizard to watch AI parse and frame your operative clauses live...';
});


// --- MULTI-STEP WIZARD ENGINE ---

function updateWizardUI() {
  steps.forEach((step, index) => {
    step.classList.toggle('hidden', index !== (currentStep - 1));
  });

  prevBtn.classList.toggle('invisible', currentStep === 1);
  
  if (currentStep === totalSteps) {
    nextBtn.innerText = "Authorize & Submit Link";
    nextBtn.className = "px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-all";
  } else {
    nextBtn.innerText = "Continue";
    nextBtn.className = "px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-sm transition-all";
  }

  progressBar.style.width = `${(currentStep / totalSteps) * 100}%`;
}

nextBtn.addEventListener('click', () => {
  // Field validation rule checklist enforcement step before proceeding forward
  const currentStepFields = steps[currentStep - 1].querySelectorAll('input[required], textarea[required]');
  let allValid = true;
  
  currentStepFields.forEach(field => {
    if (!field.value.trim()) {
      allValid = false;
      field.classList.add('border-red-400');
    } else {
      field.classList.remove('border-red-400');
    }
  });

  if (!allValid) {
    alert("Please fill all mandatory layout fields correctly before continuing.");
    return;
  }

  if (currentStep < totalSteps) {
    currentStep++;
    updateWizardUI();
    if (currentStep === 3) {
      initializeCanvasParameters();
    }
  } else {
    processFinalPayloadSubmission();
  }
});

prevBtn.addEventListener('click', () => {
  if (currentStep > 1) {
    currentStep--;
    updateWizardUI();
  }
});


// --- INTERACTIVE SIGNATURE BOX ENGINE ---

const canvas = document.getElementById('signatureCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;

function initializeCanvasParameters() {
  if (!canvas) return;
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#1e3a8a'; // Blue Ink tone
}

window.addEventListener('resize', initializeCanvasParameters);
setTimeout(initializeCanvasParameters, 200);

function getCoordinates(e) {
  const rect = canvas.getBoundingClientRect();
  if (e.touches && e.touches.length > 0) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  }
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function startDrawing(e) {
  isDrawing = true;
  const { x, y } = getCoordinates(e);
  ctx.beginPath();
  ctx.moveTo(x, y);
  if(e.cancelable) e.preventDefault();
}

function draw(e) {
  if (!isDrawing) return;
  const { x, y } = getCoordinates(e);
  ctx.lineTo(x, y);
  ctx.stroke();
  if(e.cancelable) e.preventDefault();
}

function stopDrawing() {
  if (!isDrawing) return;
  isDrawing = false;
  const dataURL = canvas.toDataURL();
  previewSigImage.src = dataURL;
  previewSigImage.classList.remove('hidden');
}

if (canvas) {
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  window.addEventListener('mouseup', stopDrawing);

  canvas.addEventListener('touchstart', startDrawing, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDrawing);
}

document.getElementById('clearCanvasBtn').addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  previewSigImage.src = '';
  previewSigImage.classList.add('hidden');
});


// --- DATA EXTRACTION GATEWAY ---

function processFinalPayloadSubmission() {
  const namesArray = Array.from(partiesContainer.querySelectorAll('.party-name')).map(input => input.value);
  const phonesArray = Array.from(partiesContainer.querySelectorAll('.party-phone')).map(input => input.value);

  // Simple validation to check if they actually drew a signature
  const blankCanvas = document.createElement('canvas');
  blankCanvas.width = canvas.width;
  blankCanvas.height = canvas.height;
  if (canvas.toDataURL() === blankCanvas.toDataURL()) {
    alert("Please sign inside the canvas box before finalizing the deal.");
    return;
  }

  const payload = {
    partiesNames: namesArray,
    partiesPhones: phonesArray,
    type: document.getElementById('agreementType').value,
    text: inputTerms.value,
    signatureData: canvas.toDataURL()
  };
  
  console.log("Transmission Pipeline Processing Package Formed:", payload);
  alert(`Perfect! Agreement structured safely with ${namesArray.length} total parties locked in. Ready for database storage pipeline.`);
}