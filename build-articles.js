const fs = require('fs');
const path = require('path');

// ─── Article Data ────────────────────────────────────────────────
const articles = [
  {
    id: "what-to-do-when-someone-owes-you-money-in-nigeria-and-refuses-to-pay",
    title: "What to Do When Someone Owes You Money in Nigeria and Refuses to Pay",
    desc: "Wondering what to do when someone owes you money in Nigeria and won't pay? Learn how to legally recover your funds, use small claims court, and protect your cash.",
    tag: "Debt Recovery",
    readTime: "4 min read",
    content: `
      <p class="font-semibold text-slate-800 text-base leading-relaxed">In Nigeria, lending money or giving goods on credit is easy; the real work starts when it's time to get your money back.</p>
      <p>Whether it's a friend who promised to pay 'by weekend,' a client who vanished after receiving their order, or a vendor holding your deposit without delivering, being ghosted leaves you feeling helpless. If you are wondering exactly what to do when someone owes you money in Nigeria, the legal system provides clear pathways—if you take a structured approach.</p>
      
      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">Can I involve the Police if someone owes me money?</h2>
      <p>This is the most common question people ask. By law, the Nigerian Police Force is not a debt collection agency, and civil contract breaches are outside their jurisdiction. However, if the person intentionally used a fake identity, presented a cloned bank transfer alert, or collected money for goods they never possessed, it transitions into a criminal offense known as <em>Obtaining Under False Pretences</em>. In that specific scam scenario, you can legally file a criminal petition.</p>

      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">Step 1: Gather your evidence trail before acting</h2>
      <p>In Nigeria, the burden of proof rests entirely on you. If you make official claims with just verbal accusations, a debtor can easily deny it. Gather an unedited compilation of bank transfer receipts, WhatsApp chat screenshots where they explicitly acknowledged the debt balance, and any receipts or paper agreements issued.</p>
      <div class="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl my-4 text-sm text-amber-900 leading-relaxed">
        <strong>Important:</strong> Do not post the debtor's face or details on Instagram, X, or TikTok to shame them. Under Nigerian cyber-bullying and defamation laws, they can sue you for damages, which could completely cancel out the money they owe you. Keep the process professional.
      </div>

      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">Step 2: Serve a formal Letter of Demand</h2>
      <p>If casual reminders fail, the next step is moving the conversation from informal text messages to formal legal notice via a <strong>Letter of Demand</strong>.</p>
      <p>This is a document that outlines the exact balance due, the history of the transaction, and sets a strict timeline (usually 7 to 14 days) for complete payment. It warns the debtor that failure to comply will result in immediate litigation. Over 65% of Nigerian debt defaults are resolved at this stage because debtors realize you are tracking them formally.</p>

      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">Step 3: Take them to Small Claims Court</h2>
      <p>If the deadline expires and they still refuse to comply, you don't need a massive budget for a lawyer. States like Lagos, Abuja, and Oyo operate specialized <strong>Small Claims Courts</strong>. These courts handle financial disputes below a specific cap, bypass classic multi-year judicial delays, and are mandated to deliver final judgments within 60 days.</p>

      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">How to protect your money from the start</h2>
      <p>The hardest time to fix an evidence trail is <em>after</em> a default has happened. Once someone blocks you on WhatsApp, your options shrink.</p>
      <p>The smartest defense is locking down the transaction before any money leaves your bank app. By signing an agreement linked to verified credentials like a National Identification Number (NIN) via a secure system, you create a tamper-proof digital record that cannot be denied or disputed in a Nigerian court.</p>
    `
  },
  {
    id: "how-to-make-a-legally-binding-contract-in-nigeria",
    title: "How to Make a Legally Binding Contract in Nigeria",
    desc: "Do you need a lawyer or a red seal to make an agreement legal? Learn the 4 basic rules of how to make a contract in Nigeria that stands up in court.",
    tag: "Legal Advice",
    readTime: "3 min read",
    content: `
      <p class="font-semibold text-slate-800 text-base leading-relaxed">One of the biggest myths in Nigeria is that an agreement is only valid if it was drafted by a lawyer, printed on thick paper, or decorated with a red wax seal.</p>
      <p>The truth is, under the Nigerian law of contract, you don't need expensive ceremonies to protect your deals. Whether you are partnering on a business, selling a phone, or renting out an apartment, you can create a perfectly valid contract yourself—provided you satisfy a few basic legal rules.</p>
      
      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">What makes an agreement legally valid in Nigeria?</h2>
      <p>For any contract to hold water before a Nigerian magistrate or high court judge, it must have these 4 essential ingredients:</p>
      <ul class="list-disc pl-5 space-y-3 my-3">
        <li><strong>Offer:</strong> One party must make a clear proposition (e.g., "I will build this website for you for ₦250,000").</li>
        <li><strong>Acceptance:</strong> The other party must accept that exact offer without changing the terms. Saying "I will pay ₦200,000 instead" is not acceptance; it is a counter-offer.</li>
        <li><strong>Consideration:</strong> This is the value exchanged. It doesn't have to be money, but something of value must change hands.</li>
        <li><strong>Intention to Create Legal Relations:</strong> Both parties must clearly intend for the deal to be an official commitment, not a casual joke or a family favor.</li>
      </ul>

      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">Does a contract have to be written to be enforceable?</h2>
      <p>Technically, no. Verbal agreements are recognized in Nigeria. However, the real problem is <strong>proof</strong>. If a dispute breaks out six months later, a verbal contract quickly turns into an argument of "your word against mine."</p>
      <p>When you put your terms in writing—even a simple document—it serves as permanent proof of exactly what everybody agreed to do.</p>

      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">Can a digital contract stand up in a Nigerian Court?</h2>
      <p>Yes. Under the <strong>Nigerian Evidence Act</strong>, electronic signatures and digital agreements carry the exact same legal weight as a physical pen-and-paper contract. You do not need to print out a document or search for blue ink to make it binding.</p>
      <p>However, to be safe, a digital contract needs to prove exactly <em>who</em> signed it and that the text wasn't tampered with afterward.</p>

      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">How to create your contract using SignAm</h2>
      <p>Instead of downloading complex legal templates you don't fully understand, you can use SignAm to lock down your agreements instantly. By typing your straightforward terms and sending it to the other party's phone, you tie the agreement to verified identity parameters. It takes less than a minute, works on any mobile screen, and protects your business before stories begin.</p>
    `
  },
  {
    id: "how-to-write-a-loan-agreement",
    title: "How to Write a Loan Agreement Form in Nigeria (Legally Binding)",
    desc: "Learn how to write an enforceable loan contract format in Nigeria to safeguard your cash. Legal parameters, templates, and evidence rules explained.",
    tag: "Debt Recovery",
    readTime: "4 min read",
    content: `
      <p class="font-semibold text-slate-800 text-base">Lending money to friends, family, or business partners in Nigeria without formal paperwork is the fastest way to lose both the relationship and your capital.</p>
      <p>Under Nigerian law, a verbal contract is technically legal, but proving it in court when the individual defaults is almost impossible. To ensure your agreement has real legal weight, it must explicitly outline specific milestones.</p>
      
      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">Essential Requirements for an Enforceable Loan Agreement</h2>
      <ul class="list-disc pl-5 space-y-3 my-3">
        <li><strong>Clear Identity Proof:</strong> Full legal names matching their government identities, not just casual social nicknames or WhatsApp handles.</li>
        <li><strong>The Principal Amount & Interest Structure:</strong> The exact figure lent and whether any interest or late fees accrue over time.</li>
        <li><strong>Definite Repayment Timeline:</strong> A specific date or clear instalment framework (e.g., "The 5th day of every consecutive month").</li>
        <li><strong>Default Penalty Terms:</strong> What occurs if the payment deadline passes without fulfillment?</li>
      </ul>

      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">The Danger of Simple Paper Downloads</h2>
      <p>Most small business owners download a random sample PDF from Google, fill it out manually, and store it. If a dispute arises, the debtor can easily claim: <em>'That is not my signature,'</em> or <em>'I wasn't the one who signed that paper.'</em></p>
      <p>This is why using digital systems linked directly to verified credentials (like a National Identification Number) provides structural protection that raw paper or casual chats cannot duplicate.</p>

      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">What happens when someone defaults on a loan in Nigeria?</h2>
      <p>If the borrower refuses to pay after the repayment date passes, your signed agreement gives you standing to send a formal Letter of Demand, file a claim at the Small Claims Court, or engage a recovery solicitor. Without a written agreement, each of these routes becomes significantly harder—courts will require proof that the loan existed and that repayment terms were set.</p>
    `
  },
  {
    id: "how-to-write-a-freelance-agreement",
    title: "Freelance Service Contract Agreement Format for Nigerian Creatives",
    desc: "How to protect your payments as a Nigerian web developer, designer, or copywriter. Stop clients from ghosting you after delivery.",
    tag: "Freelance & Remote",
    readTime: "3 min read",
    content: `
      <p class="font-semibold text-slate-800 text-base">Every Nigerian freelancer has a horror story about a client who promised payment upon completion, only to stop replying to messages once the work was delivered.</p>
      <p>A professional service agreement avoids scope creep and sets clear boundaries regarding downpayments, revisions, and intellectual property releases.</p>
      
      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">Key Terms Your Freelance Contract Must Contain</h2>
      <ul class="list-disc pl-5 space-y-3 my-3">
        <li><strong>The Deposit Threshold:</strong> Never begin execution without a locked commitment (e.g., 50% upfront) verified in writing.</li>
        <li><strong>Milestone Sign-offs:</strong> Break large build schedules into verifiable components so you get paid as you go.</li>
        <li><strong>IP Ownership Transfer:</strong> Explicitly state that the copyright and source code only shift to the buyer <em>after</em> the final balance is settled in full.</li>
        <li><strong>Revision Limits:</strong> Specify how many rounds of revisions are included. Open-ended revision promises are how projects run for six months on a one-week budget.</li>
      </ul>

      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">Why WhatsApp agreements don't protect you</h2>
      <p>Many Nigerian freelancers rely on WhatsApp chats as their "contract." The problem is that chat logs can be deleted, screenshots can be altered, and a client can simply claim the messages were taken out of context. A signed digital agreement with a verified phone number attached to it is fundamentally harder to dispute.</p>

      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">How to lock down your next project in under 60 seconds</h2>
      <p>Before sending any designs or writing a single line of code, use SignAm to create a simple agreement that captures the project scope, deposit amount, and delivery terms. Send the link to the client's phone, they verify with an OTP, and both parties have a tamper-proof record instantly.</p>
    `
  },
  {
    id: "is-a-digital-signature-legal-in-nigeria",
    title: "Is a Digital Signature Legally Binding in Nigeria?",
    desc: "What the Nigerian Evidence Act 2011 says about electronic signatures, digital contracts, and WhatsApp agreement admissibility in court.",
    tag: "Legal Compliance",
    readTime: "3 min read",
    content: `
      <p class="font-semibold text-slate-800 text-base">Many people in Nigeria still believe an agreement is only valid if it features a blue-ink physical signature and a red wax seal. This is entirely false.</p>
      <p>Under <strong>Section 93 of the Nigerian Evidence Act 2011</strong>, electronic and digital signatures are fully recognized and carry the same legal authority as a handwritten pen signature.</p>
      
      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">What Makes a Digital Contract Valid in a Nigerian Court?</h2>
      <p>To satisfy the strict standards of <strong>Section 84 of the Evidence Act</strong> regarding computer-generated electronic records, you must satisfy three core conditions:</p>
      <ul class="list-disc pl-5 space-y-3 my-3">
        <li><strong>Authenticity:</strong> You must be able to prove the signature actually belongs to the person who supposedly signed it.</li>
        <li><strong>Integrity:</strong> You must prove the document has not been altered, tampered with, or modified after the signing occurred.</li>
        <li><strong>Non-Repudiation:</strong> The tracking details must be so secure that the signer cannot falsely claim, <em>'My phone was stolen,'</em> or <em>'I didn't authorize that.'</em></li>
      </ul>

      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">Are WhatsApp agreements admissible in court?</h2>
      <p>WhatsApp chats can be presented as evidence in a Nigerian court, but they carry significant weaknesses. Screenshots can be fabricated, messages can be deleted, and proving the identity of the account holder is non-trivial. A judge will weigh them but they rarely stand alone as conclusive proof of a formal agreement.</p>

      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">What about email agreements?</h2>
      <p>Emails are stronger than WhatsApp because they carry sender metadata and are harder to edit. However, email alone still doesn't prove <em>who</em> was physically behind the keyboard. Adding a layer of phone-verified OTP to your digital agreement closes that gap completely.</p>

      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">How SignAm satisfies the Evidence Act requirements</h2>
      <p>Using SignAm natively satisfies all three conditions by embedding real-time identity lookups, device tracking, and instant SMS OTP validation into the document metadata. The result is a signed record that can be presented to any Nigerian magistrate or judge with confidence.</p>
    `
  },
  {
    id: "landlord-keeping-caution-deposit",
    title: "Landlord Keeping Your Caution Deposit? Legal Steps for Nigerian Tenants",
    desc: "Your legal rights as a tenant in Nigeria. How to recover your caution fees when your landlord or estate agent refuses to refund.",
    tag: "Property & Rental",
    readTime: "4 min read",
    content: `
      <p class="font-semibold text-slate-800 text-base">In Nigeria, caution deposits are frequently treated by landlords as bonus income rather than refundable money held in trust.</p>
      <p>By default, unless physical damage is explicitly proven, your caution fee must be returned to you at the expiration of your tenancy. Sadly, thousands of tenants lose this money because their tenancy agreements were vague or entirely verbal.</p>
      
      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">Is a landlord legally required to return a caution deposit in Nigeria?</h2>
      <p>Yes—unless the tenancy agreement explicitly states otherwise or damage beyond normal wear and tear has occurred. The Tenancy Laws of states like Lagos (Lagos Tenancy Law 2011) provide tenant protections, and a landlord who refuses to return a deposit without valid justification can be pursued in court.</p>

      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">How to Ensure Your Caution Fee Comes Back Safely</h2>
      <ul class="list-disc pl-5 space-y-3 my-3">
        <li><strong>Pre-Move Inspection Log:</strong> Take clear photos of any pre-existing faults before moving in and link them to your initial agreement.</li>
        <li><strong>Explicit Refunding Criteria:</strong> Your contract must explicitly state a specific timeframe for refunds (e.g., "Within 14 business days of moving out").</li>
        <li><strong>Formal Notice:</strong> If they refuse to pay, a written demand referencing your signed, timestamped agreement changes the entire tone of the conversation.</li>
      </ul>

      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">What to do if your landlord still refuses</h2>
      <p>First, send a formal Letter of Demand setting a 7–14 day payment deadline. If that fails, file a claim at the Magistrate Court or the Rental Tribunal in your state. Bring your tenancy agreement, proof of the caution deposit payment (bank receipt or transfer record), and your move-out inspection evidence. Courts regularly rule in favor of tenants who can present this documentation clearly.</p>
    `
  },
  {
    id: "how-to-send-money-in-nigeria",
    title: "How to Send Money in Nigeria and Have Bulletproof Legal Proof",
    desc: "A bank transfer receipt isn't always enough to prove a business transaction. Learn how to tie bank payments directly to locked legal terms.",
    tag: "Business Advice",
    readTime: "3 min read",
    content: `
      <p class="font-semibold text-slate-800 text-base">When you send a bank transfer in Nigeria, the transaction receipt only proves that money moved from Account A to Account B. It does <em>not</em> prove what the money was for.</p>
      <p>If you transfer ₦2,000,000 for a car purchase and the seller vanishes, they can easily argue in court that the money was a gift, a long-term loan repayment, or for an entirely different transaction.</p>
      
      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">Why your bank receipt isn't enough evidence</h2>
      <p>Nigerian banks issue transfer receipts that record the amount, date, and account details—but nothing about <em>intent</em>. In commercial disputes, it's the <em>purpose</em> of a payment that determines who wins in court, and a receipt alone cannot establish that purpose without a supporting agreement.</p>

      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">The Right Way to Make High-Value Business Payments</h2>
      <p>Before you tap 'Send' or input your bank token pin, complete this sequence:</p>
      <ul class="list-disc pl-5 space-y-3 my-3">
        <li><strong>Tie the Reference to a Contract:</strong> In the transfer description field, input the exact reference number of your signed agreement.</li>
        <li><strong>Execute Before Payment:</strong> Never drop a downpayment based on a verbal assurance of "I will send the receipt later."</li>
        <li><strong>Lock the Purpose:</strong> Ensure both parties sign an electronic record capturing the precise exchange details before any funds leave your account.</li>
      </ul>

      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">How much does this actually matter?</h2>
      <p>In Lagos alone, thousands of civil disputes annually center on payments where no contract exists. Judges regularly dismiss cases not because the claimant didn't pay, but because they cannot prove what the payment was for. A 60-second digital agreement signed before transferring money eliminates this risk entirely.</p>
    `
  },
  {
    id: "how-to-write-a-vendor-agreement",
    title: "Vendor Agreement Guide for Nigerian Events and Small Businesses",
    desc: "Essential clauses for catering, photography, decoration, and makeup vendors in Nigeria to handle sudden date changes or cancellations.",
    tag: "Vendor Operations",
    readTime: "3 min read",
    content: `
      <p class="font-semibold text-slate-800 text-base">Nigerian event vendors—caterers, MCs, decorators, makeup artists, photographers—are highly vulnerable to sudden planning adjustments and outright cancellations.</p>
      <p>When an event date gets shifted or canceled entirely, a simple verbal chat about deposits leads straight to bad blood, heated arguments, and social media call-outs.</p>
      
      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">3 Clauses Every Event Vendor Contract Needs</h2>
      <ul class="list-disc pl-5 space-y-3 my-3">
        <li><strong>Non-Refundable Retainer Fee:</strong> Explicitly state that the booking deposit is non-refundable because it blocks other paying clients from booking that same calendar date.</li>
        <li><strong>Postponement Penalty:</strong> Specify exactly what it costs the client if they move the date within 30 days of the planned event.</li>
        <li><strong>Force Majeure (Unforeseen Disasters):</strong> Detail what happens if extreme weather, government bans, or fuel scarcities prevent fulfillment.</li>
      </ul>

      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">How to handle the "we are family" client</h2>
      <p>In Nigeria's close-knit social circles, many vendor disputes involve clients who are relatives, churchmates, or referrals from trusted friends. The emotional pressure to skip paperwork is real—but the financial risk is identical. A digital agreement doesn't signal distrust; it signals professionalism. Frame it as protecting both parties, and most clients respect the structure.</p>

      <h2 class="text-xl font-bold text-slate-900 pt-6 pb-1 serif-font">What to do when a client cancels last minute</h2>
      <p>With a signed vendor agreement referencing your retainer terms, you have standing to keep the deposit without argument. Present the signed record, reference the cancellation clause, and issue a formal payment-due notice for any additional costs incurred. Courts consistently enforce clear, signed vendor terms—but only when they exist in writing.</p>
    `
  }
];

// ─── HTML Template ────────────────────────────────────────────────
function buildArticlePage(article, allArticles) {
  // Related articles: exclude current, pick up to 3
  const related = allArticles.filter(a => a.id !== article.id).slice(0, 3);

  const relatedCards = related.map(r => `
    <a href="${r.id}.html" class="group block bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-xl p-4 transition-all">
      <span class="text-[10px] font-bold uppercase tracking-widest text-emerald-600">${r.tag}</span>
      <h4 class="text-sm font-bold text-slate-900 mt-1 group-hover:text-emerald-700 transition-colors leading-snug">${r.title}</h4>
      <span class="text-xs font-semibold text-emerald-600 mt-2 inline-block">Read →</span>
    </a>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Primary SEO -->
  <title>${article.title} | SignAm</title>
  <meta name="description" content="${article.desc}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://signamnow.com/${article.id}.html">

  <!-- Open Graph -->
  <meta property="og:title" content="${article.title}">
  <meta property="og:description" content="${article.desc}">
  <meta property="og:image" content="https://signamnow.com/apple-touch-icon.png">
  <meta property="og:url" content="https://signamnow.com/${article.id}.html">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="SignAm">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${article.title}">
  <meta name="twitter:description" content="${article.desc}">

  <!-- Article Structured Data (JSON-LD) -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${article.title.replace(/"/g, '\\"')}",
    "description": "${article.desc.replace(/"/g, '\\"')}",
    "author": {
      "@type": "Organization",
      "name": "SignAm Compliance Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "SignAm",
      "url": "https://signamnow.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://signamnow.com/apple-touch-icon.png"
      }
    },
    "datePublished": "2026-06-01",
    "dateModified": "2026-06-18",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://signamnow.com/${article.id}.html"
    }
  }
  <\/script>

  <!-- Breadcrumb Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://signamnow.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Guides",
        "item": "https://signamnow.com/blog.html"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "${article.title.replace(/"/g, '\\"')}",
        "item": "https://signamnow.com/${article.id}.html"
      }
    ]
  }
  <\/script>

  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="manifest" href="/site.webmanifest">

  <script src="https://cdn.tailwindcss.com"><\/script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;1,400&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .serif-font { font-family: 'Playfair Display', serif; }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 antialiased">

  <!-- Header -->
  <header class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
    <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
      <a href="index.html" class="flex items-center gap-2">
        <img src="apple-touch-icon.png" alt="SignAm Logo" class="w-9 h-9 object-contain">
        <span class="font-bold text-xl tracking-tight text-slate-900">Sign<span class="text-emerald-600">Am</span></span>
      </a>
      <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
        <a href="index.html" class="hover:text-slate-900 transition-colors">Home</a>
        <a href="index.html#how-it-works" class="hover:text-slate-900 transition-colors">How It Works</a>
        <a href="index.html#pricing" class="hover:text-slate-900 transition-colors">Pricing</a>
        <a href="blog.html" class="text-emerald-600 font-semibold">Guides</a>
      </nav>
      <div class="flex items-center gap-4">
        <a href="login.html" class="hidden sm:inline-block text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Sign In</a>
        <a href="login.html" class="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm">Get Started</a>
      </div>
    </div>
  </header>

  <!-- Breadcrumb -->
  <div class="max-w-5xl mx-auto px-4 pt-5 pb-1">
    <nav class="text-xs text-slate-400 font-medium flex items-center gap-1.5">
      <a href="index.html" class="hover:text-emerald-600 transition-colors">Home</a>
      <span>›</span>
      <a href="blog.html" class="hover:text-emerald-600 transition-colors">Guides</a>
      <span>›</span>
      <span class="text-slate-600 truncate max-w-[200px] sm:max-w-none">${article.title}</span>
    </nav>
  </div>

  <!-- Content Layout -->
  <main class="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

    <!-- Article Body -->
    <article class="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5 mb-6">
        <span class="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md inline-block w-fit">${article.tag}</span>
        <div class="text-xs text-slate-400 font-medium">
          <span>SignAm Compliance Team</span> · <span>June 2026</span> · <span>${article.readTime}</span>
        </div>
      </div>

      <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 serif-font mb-6 leading-snug">
        ${article.title}
      </h1>

      <div class="space-y-4 text-sm sm:text-base leading-relaxed text-slate-600">
        ${article.content}
      </div>

      <!-- Article Footer CTA -->
      <div class="mt-10 pt-6 border-t border-slate-100">
        <div class="bg-emerald-50 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div class="flex-1">
            <p class="text-sm font-bold text-slate-900">Ready to protect your next deal?</p>
            <p class="text-xs text-slate-500 mt-0.5">Create a signed, tamper-proof agreement in under 60 seconds.</p>
          </div>
          <a href="login.html" class="shrink-0 inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all">
            Start Now →
          </a>
        </div>
      </div>
    </article>

    <!-- Sidebar -->
    <aside class="lg:col-span-4 space-y-5 lg:sticky lg:top-24 h-fit">

      <!-- Pitch Card -->
      <div class="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none"></div>
        <div class="relative space-y-2">
          <span class="text-emerald-600 font-bold tracking-wider text-[10px] uppercase bg-emerald-50 px-2 py-0.5 rounded-md">IMPORTANT NOTE</span>
          <h3 class="text-base font-bold text-slate-900 tracking-tight leading-snug pt-1">
            Paper agreements can still be easily denied or destroyed.
          </h3>
          <p class="text-xs text-slate-500 leading-relaxed">
            Don't leave your business hanging on casual conversations or raw messaging text. Lock down agreements instantly using secure identity tracking.
          </p>
        </div>
        <div class="space-y-2.5 pt-1 text-xs text-slate-600 font-medium border-t border-slate-100">
          <div class="flex items-start gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0"></span>
            <span>Admissible under Evidence Act 2011</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0"></span>
            <span>Recipient phone verified via SMS OTP</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0"></span>
            <span>Secure cloud storage backup</span>
          </div>
        </div>
        <div class="pt-2">
          <a href="login.html" class="group block w-full text-center font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 py-3.5 rounded-xl transition-all shadow-sm hover:-translate-y-px">
            Create Agreement Now
            <span class="inline-block transition-transform group-hover:translate-x-0.5 ml-1">→</span>
          </a>
          <p class="text-[10px] text-center text-slate-400 mt-2.5 font-medium">Takes less than 60 seconds from your browser</p>
        </div>
      </div>

      <!-- Related Articles -->
      ${related.length > 0 ? `
      <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Related Guides</p>
        <div class="space-y-3">
          ${relatedCards}
        </div>
      </div>` : ''}
    </aside>
  </main>

  <!-- Footer -->
  <footer class="bg-slate-900 text-slate-400 pt-16 pb-8 border-t border-slate-800 mt-12">
    <div class="max-w-6xl mx-auto px-4">
      <div class="grid grid-cols-2 md:grid-cols-12 gap-8 pb-12 border-b border-slate-800/60">
        <div class="col-span-2 md:col-span-5 space-y-4">
          <div class="flex items-center gap-2 text-white">
            <img src="apple-touch-icon.png" alt="SignAm Logo" class="w-9 h-9 object-contain">
            <span class="font-bold text-lg tracking-tight">Sign<span class="text-emerald-500">Am</span></span>
          </div>
          <p class="text-[13px] text-slate-400 leading-relaxed max-w-sm">
            Stop doing business by mouth alone to avoid stories. Turn your agreements into real, locked, and legally binding contracts that protect your money.
          </p>
        </div>
        <div class="col-span-1 md:col-span-2 space-y-3 text-xs">
          <h4 class="font-bold text-white uppercase tracking-wider text-[10px]">Product</h4>
          <ul class="space-y-2 font-medium">
            <li><a href="index.html" class="hover:text-emerald-500 transition-colors">Home</a></li>
            <li><a href="dashboard.html" class="hover:text-emerald-500 transition-colors">Dashboard</a></li>
            <li><a href="index.html#how-it-works" class="hover:text-emerald-500 transition-colors">How It Works</a></li>
            <li><a href="index.html#pricing" class="hover:text-emerald-500 transition-colors">Pricing & Plans</a></li>
          </ul>
        </div>
        <div class="col-span-1 md:col-span-2 space-y-3 text-xs">
          <h4 class="font-bold text-white uppercase tracking-wider text-[10px]">Resources</h4>
          <ul class="space-y-2 font-medium">
            <li><a href="blog.html" class="hover:text-emerald-500 transition-colors">Legal Guides</a></li>
            <li><a href="is-a-digital-signature-legal-in-nigeria.html" class="hover:text-emerald-500 transition-colors">Compliance Info</a></li>
            <li><a href="mailto:support@signam.com" class="hover:text-emerald-500 transition-colors">Help Support</a></li>
          </ul>
        </div>
        <div class="col-span-2 md:col-span-3 space-y-3 text-xs">
          <h4 class="font-bold text-white uppercase tracking-wider text-[10px]">Legal Framework</h4>
          <ul class="space-y-2 font-medium text-slate-400">
            <li class="flex items-center gap-1.5 text-slate-500">✓ Evidence Act 2011 Enforceable</li>
            <li class="flex items-center gap-1.5 text-slate-500">✓ NIN Verification</li>
            <li class="flex items-center gap-1.5 text-slate-500">✓ Secure SMS OTP Attestation</li>
            <li class="flex items-center gap-1.5 text-slate-500">✓ Encrypted Verification Trail</li>
          </ul>
        </div>
      </div>
      <div class="pt-8 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 text-xs font-medium">
        <div class="flex flex-col items-center lg:items-start gap-2">
          <div class="text-slate-500">© 2026 SignAm. All rights reserved. Made for Nigerians by Nigerians.</div>
          <div class="flex items-center gap-3 text-slate-600">
            <a href="privacy.html" class="hover:text-emerald-500 transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="terms.html" class="hover:text-emerald-500 transition-colors">Terms of Service</a>
          </div>
        </div>
        <div class="text-slate-500 text-[11px] text-center lg:text-right max-w-xl leading-relaxed">
          SignAm is a transactional technology infrastructure provider and is not a law firm. We do not provide structural legal advice, custom opinions, or individual courtroom representation.
        </div>
      </div>
    </div>
  </footer>

</body>
</html>`;
}

// ─── Updated blog.html with correct links ────────────────────────
function buildBlogIndex(allArticles) {
  const featuredCards = allArticles.slice(0, 2).map((a, i) => {
    const bgColor = i === 0 ? 'bg-emerald-600' : 'bg-slate-900';
    const quote = i === 0
      ? '"He said he\'d pay back<br>next week."'
      : '"We don\'t need paperwork,<br>we are brothers."';
    return `
    <div class="mb-8">
      <a href="${a.id}.html" class="article-card group block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-5">
          <div class="md:col-span-2 ${bgColor} p-8 flex items-center justify-center min-h-[180px]">
            <p class="text-white text-3xl font-bold serif-font italic leading-tight text-center">${quote}</p>
          </div>
          <div class="md:col-span-3 p-7 space-y-3 flex flex-col justify-center">
            <span class="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block w-fit">${a.tag}</span>
            <h2 class="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">${a.title}</h2>
            <p class="text-sm text-slate-500 leading-relaxed">${a.desc}</p>
            <div class="flex items-center gap-3 pt-1">
              <span class="text-xs text-slate-400">${a.readTime}</span>
              <span class="text-slate-200">·</span>
              <span class="text-xs font-semibold text-emerald-600 group-hover:underline">Read article →</span>
            </div>
          </div>
        </div>
      </a>
    </div>`;
  }).join('');

  const gridCards = allArticles.slice(2).map(a => `
    <a href="${a.id}.html" class="article-card bg-white rounded-2xl border border-slate-200 p-6 space-y-3 block hover:text-emerald-700 transition-all">
      <span class="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">${a.tag}</span>
      <h3 class="text-base font-bold text-slate-900 leading-snug">${a.title}</h3>
      <p class="text-xs text-slate-500 leading-relaxed">${a.desc}</p>
      <div class="text-[11px] font-semibold text-emerald-600 pt-1">Read guide →</div>
    </a>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SignAm Blog — Legal Tips & Agreement Guides for Nigerians</title>
  <meta name="description" content="Practical guides on how to protect your money, write agreements and contracts, and handle disputes in Nigeria. Powered by SignAm.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://signamnow.com/blog.html">

  <meta property="og:title" content="SignAm Blog — Legal Tips for Nigerians">
  <meta property="og:description" content="How to write agreements, protect your money, and handle disputes in Nigeria.">
  <meta property="og:image" content="https://signamnow.com/apple-touch-icon.png">
  <meta property="og:url" content="https://signamnow.com/blog.html">
  <meta property="og:type" content="website">

  <!-- Blog Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "SignAm Legal Guides",
    "description": "Practical guides on how to protect your money, write agreements and contracts, and handle disputes in Nigeria.",
    "url": "https://signamnow.com/blog.html",
    "publisher": {
      "@type": "Organization",
      "name": "SignAm",
      "url": "https://signamnow.com"
    }
  }
  <\/script>

  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="manifest" href="/site.webmanifest">

  <script src="https://cdn.tailwindcss.com"><\/script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;1,400&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .serif-font { font-family: 'Playfair Display', serif; }
    .article-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .article-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.08); }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 antialiased">

  <header class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
    <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
      <a href="index.html" class="flex items-center gap-2">
        <img src="apple-touch-icon.png" alt="SignAm Logo" class="w-10 h-10 object-contain">
        <span class="font-bold text-xl tracking-tight text-slate-900">Sign<span class="text-emerald-600">Am</span></span>
      </a>
      <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
        <a href="index.html" class="hover:text-emerald-600 transition-colors">Home</a>
        <a href="index.html#how-it-works" class="hover:text-emerald-600 transition-colors">How It Works</a>
        <a href="index.html#pricing" class="hover:text-emerald-600 transition-colors">Pricing</a>
        <a href="blog.html" class="text-emerald-600 font-semibold">Blog</a>
      </nav>
      <a href="login.html" class="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm">Login</a>
    </div>
  </header>

  <section class="bg-white border-b border-slate-200/60 py-14">
    <div class="max-w-3xl mx-auto px-4 text-center space-y-4">
      <span class="inline-block text-[11px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">SignAm Blog</span>
      <h1 class="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight serif-font">Protect yourself before stories start.</h1>
      <p class="text-slate-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">Practical guides on how to write agreements, recover money, and handle disputes in Nigeria.</p>
    </div>
  </section>

  <main class="max-w-5xl mx-auto px-4 py-14">
    <div class="mb-4">
      <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-5">Featured Articles</p>
      ${featuredCards}
    </div>
    <div>
      <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-5">More Articles</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        ${gridCards}
      </div>
    </div>
  </main>

  <section class="bg-emerald-600 py-14">
    <div class="max-w-2xl mx-auto px-4 text-center space-y-4">
      <h2 class="text-2xl font-bold text-white tracking-tight">Ready to protect your next deal?</h2>
      <p class="text-emerald-100 text-sm leading-relaxed">Create a signed, locked agreement in under a minute. Works on phone and laptop, no app needed.</p>
      <a href="login.html" class="inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-emerald-700 bg-white hover:bg-emerald-50 rounded-xl transition-all shadow-md mt-2">
        Start an Agreement →
      </a>
    </div>
  </section>

  <footer class="bg-slate-900 text-slate-400 pt-16 pb-8 border-t border-slate-800">
    <div class="max-w-6xl mx-auto px-4">
      <div class="grid grid-cols-2 md:grid-cols-12 gap-8 pb-12 border-b border-slate-800/60">
        <div class="col-span-2 md:col-span-5 space-y-4">
          <div class="flex items-center gap-2 text-white">
            <img src="apple-touch-icon.png" alt="SignAm Logo" class="w-9 h-9 object-contain">
            <span class="font-bold text-lg tracking-tight">Sign<span class="text-emerald-500">Am</span></span>
          </div>
          <p class="text-[13px] text-slate-400 leading-relaxed max-w-sm">Stop doing business by mouth alone to avoid stories. Turn your agreements into real, locked, and legally binding contracts that protect your money.</p>
        </div>
        <div class="col-span-1 md:col-span-2 space-y-3 text-xs">
          <h4 class="font-bold text-white uppercase tracking-wider text-[10px]">Product</h4>
          <ul class="space-y-2 font-medium">
            <li><a href="index.html" class="hover:text-emerald-500 transition-colors">Home</a></li>
            <li><a href="dashboard.html" class="hover:text-emerald-500 transition-colors">Dashboard</a></li>
            <li><a href="index.html#how-it-works" class="hover:text-emerald-500 transition-colors">How It Works</a></li>
            <li><a href="index.html#pricing" class="hover:text-emerald-500 transition-colors">Pricing & Plans</a></li>
          </ul>
        </div>
        <div class="col-span-1 md:col-span-2 space-y-3 text-xs">
          <h4 class="font-bold text-white uppercase tracking-wider text-[10px]">Resources</h4>
          <ul class="space-y-2 font-medium">
            <li><a href="blog.html" class="hover:text-emerald-500 transition-colors">Legal Guides</a></li>
            <li><a href="is-a-digital-signature-legal-in-nigeria.html" class="hover:text-emerald-500 transition-colors">Compliance Info</a></li>
            <li><a href="mailto:support@signam.com" class="hover:text-emerald-500 transition-colors">Help Support</a></li>
          </ul>
        </div>
        <div class="col-span-2 md:col-span-3 space-y-3 text-xs">
          <h4 class="font-bold text-white uppercase tracking-wider text-[10px]">Legal Framework</h4>
          <ul class="space-y-2 font-medium text-slate-400">
            <li class="flex items-center gap-1.5 text-slate-500">✓ Evidence Act 2011 Enforceable</li>
            <li class="flex items-center gap-1.5 text-slate-500">✓ NIN Verification</li>
            <li class="flex items-center gap-1.5 text-slate-500">✓ Secure SMS OTP Attestation</li>
            <li class="flex items-center gap-1.5 text-slate-500">✓ Encrypted Verification Trail</li>
          </ul>
        </div>
      </div>
      <div class="pt-8 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 text-xs font-medium">
        <div class="flex flex-col items-center lg:items-start gap-2">
          <div class="text-slate-500">© 2026 SignAm. All rights reserved. Made for Nigerians by Nigerians.</div>
          <div class="flex items-center gap-3 text-slate-600">
            <a href="privacy.html" class="hover:text-emerald-500 transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="terms.html" class="hover:text-emerald-500 transition-colors">Terms of Service</a>
          </div>
        </div>
        <div class="text-slate-500 text-[11px] text-center lg:text-right max-w-xl leading-relaxed">
          SignAm is a transactional technology infrastructure provider and is not a law firm. We do not provide structural legal advice, custom opinions, or individual courtroom representation.
        </div>
      </div>
    </div>
  </footer>

</body>
</html>`;
}

// ─── Generate sitemap.xml ─────────────────────────────────────────
function buildSitemap(allArticles) {
  const today = new Date().toISOString().split('T')[0];
  const articleUrls = allArticles.map(a => `
  <url>
    <loc>https://signamnow.com/${a.id}.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://signamnow.com/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://signamnow.com/blog.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  ${articleUrls}
</urlset>`;
}

// ─── Run ──────────────────────────────────────────────────────────
const outDir = path.join(__dirname, 'dist');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

// Generate each article as its own HTML file
articles.forEach(article => {
  const html = buildArticlePage(article, articles);
  const filePath = path.join(outDir, `${article.id}.html`);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✓ ${article.id}.html`);
});

// Generate updated blog.html
const blogHtml = buildBlogIndex(articles);
fs.writeFileSync(path.join(outDir, 'blog.html'), blogHtml, 'utf8');
console.log('✓ blog.html');

// Generate sitemap.xml
const sitemap = buildSitemap(articles);
fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemap, 'utf8');
console.log('✓ sitemap.xml');

console.log(`\nDone. ${articles.length} article files + blog.html + sitemap.xml → ./dist/`);