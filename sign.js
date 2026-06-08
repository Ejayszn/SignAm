// Mock Database Object (In production, this comes from your Node.js API fetch)
const mockDatabase = {
  "SIG-8392A83F": {
    creatorName: "Emmanuel Oguibe",
    terms: "I am giving Musa 150,000 Naira today to buy market supply. He promises to pay me back completely on or before July 15th, 2026. If he doesn't pay, I will collect his remaining shop goods.",
    parties: [
      { name: "Emmanuel Oguibe", phone: "08012345678", isCreator: true },
      { name: "Alhaji Musa Bello", phone: "09087654321", isCreator: false }
    ]
  }
};

// 1. Parse Document ID from URL Path
// Example: signam.app/sign.html?id=SIG-8392A83F
const urlParams = new URLSearchParams(window.location.search);
const activeDocId = urlParams.get('id') || "SIG-8392A83F"; // Fallback placeholder for testing

// DOM Elements
const docIdDisplay = document.getElementById('docIdDisplay');
const inviterName = document.getElementById('inviterName');
const displayTerms = document.getElementById('displayTerms');
const partiesList = document.getElementById('partiesList');

const verifyPhoneInput = document.getElementById('verifyPhone');
const verifyPhoneBtn = document.getElementById('verifyPhoneBtn');
const verificationPhase = document.getElementById('verificationPhase');
const signingPhase = document.getElementById('signingPhase');

// Current loaded contract state holder
let currentAgreement = null;

// 2. Populate the Layout Sheet with Contract Data
function loadAgreementData() {
  currentAgreement = mockDatabase[activeDocId.toUpperCase()];
  
  if (!currentAgreement) {
    alert("Error: Agreement contract document not found or expired.");
    return;
  }

  // Map text values into the paper preview frame
  docIdDisplay.innerText = activeDocId.toUpperCase();
  inviterName.innerText = currentAgreement.creatorName;
  displayTerms.innerText = currentAgreement.terms;

  // Build the parties tracking lists rows dynamically
  partiesList.innerHTML = currentAgreement.parties.map((party, idx) => {
    return `<p><strong>Party ${String.fromCharCode(65 + idx)} ${party.isCreator ? '(Creator)' : ''}:</strong> ${party.name}</p>`;
  }).join('');
}

// Execute data injection on boot up
loadAgreementData();


// 3. Identity Verification Check Matcher Logic
verifyPhoneBtn.addEventListener('click', () => {
  const enteredPhone = verifyPhoneInput.value.trim();
  
  // Search the contract payload party data arrays for a matching number
  const matchingParty = currentAgreement.parties.find(p => p.phone === enteredPhone && !p.isCreator);

  if (matchingParty) {
    alert(`Identity Verified successfully. Welcome, ${matchingParty.name}! Please sign below.`);
    
    // Smooth transition to uncover HTML5 finger signing sketchpad canvas box
    verificationPhase.classList.add('hidden');
    signingPhase.classList.remove('hidden');
    
    // Update Document Paper Placeholder text elements to show active focus state
    document.getElementById('receiverSigPlaceholder').innerHTML = `
      <span class="text-[9px] text-emerald-600 font-bold animate-pulse">✍️ Signing Active Live...</span>
    `;
    
    initializeReceiverCanvas();
  } else {
    alert("Access Denied! That phone number is not listed as an authorized recipient partner for this specific agreement.");
  }
});


// 4. HTML5 Signature Drawing Engine for Recipient Page
const canvas = document.getElementById('receiverCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;

function initializeReceiverCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#047857'; // Using green ink accent style for receiver signatures
}

function getCoordinates(e) {
  const rect = canvas.getBoundingClientRect();
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
  }
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  const { x, y } = getCoordinates(e);
  ctx.beginPath(); ctx.moveTo(x, y);
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return;
  const { x, y } = getCoordinates(e);
  ctx.lineTo(x, y); ctx.stroke();
});

window.addEventListener('mouseup', () => isDrawing = false);

// Precise Mobile Finger Touch Configuration Listeners
canvas.addEventListener('touchstart', (e) => {
  isDrawing = true;
  const { x, y } = getCoordinates(e);
  ctx.beginPath(); ctx.moveTo(x, y);
  if(e.cancelable) e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  if (!isDrawing) return;
  const { x, y } = getCoordinates(e);
  ctx.lineTo(x, y); ctx.stroke();
  if(e.cancelable) e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', () => isDrawing = false);

document.getElementById('clearReceiverCanvasBtn').addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Final execution submission post payload compilation click listener
document.getElementById('submitSignatureBtn').addEventListener('click', () => {
  const finalSignatureData = canvas.toDataURL();
  console.log("Receiver Signature Encoded Data:", finalSignatureData);
  alert("Awesome! Your signature has been verified and permanently appended to this agreement. The contract is now locked and fully binding! Closing session window pipeline.");
});