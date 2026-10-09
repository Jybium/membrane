const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, 'public', 'membrane-logo.png');
const b64 = fs.readFileSync(logoPath).toString('base64');
const logoUri = 'data:image/png;base64,' + b64;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1A2A39" />
      <stop offset="50%" stop-color="#13202C" />
      <stop offset="100%" stop-color="#0D161F" />
    </linearGradient>

    <!-- Radial Ambient Glow -->
    <radialGradient id="glowTopRight" cx="80%" cy="20%" r="55%">
      <stop offset="0%" stop-color="#4E93B4" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#1A2A39" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="glowBottomLeft" cx="15%" cy="85%" r="45%">
      <stop offset="0%" stop-color="#4E93B4" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#1A2A39" stop-opacity="0" />
    </radialGradient>

    <!-- Glass Card Gradient -->
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#223647" stop-opacity="0.85" />
      <stop offset="100%" stop-color="#152432" stop-opacity="0.9" />
    </linearGradient>

    <!-- Code Box Gradient -->
    <linearGradient id="codeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0E1720" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0B131B" stop-opacity="0.9" />
    </linearGradient>


    <!-- Logo Clip Path -->
    <clipPath id="logoClip">
      <rect width="56" height="56" rx="14" />
    </clipPath>

    <!-- Grid Pattern -->
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#F6F3EC" stroke-opacity="0.035" stroke-width="1"/>
    </pattern>
  </defs>

  <style>
    .font-brand { font-family: 'Manrope', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; font-weight: 800; }
    .font-sans { font-family: 'DM Sans', system-ui, -apple-system, sans-serif; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
  </style>

  <!-- Background Layer -->
  <rect width="1200" height="630" fill="url(#bg)" />
  <rect width="1200" height="630" fill="url(#glowTopRight)" />
  <rect width="1200" height="630" fill="url(#glowBottomLeft)" />
  <rect width="1200" height="630" fill="url(#grid)" />

  <!-- Top Header Row -->
  <g transform="translate(64, 48)">
    <!-- App Logo Container -->
    <rect width="56" height="56" rx="14" fill="#1A2A39" stroke="#4E93B4" stroke-width="1.5" stroke-opacity="0.6" />
    <image href="${logoUri}" x="0" y="0" width="56" height="56" clip-path="url(#logoClip)" preserveAspectRatio="xMidYMid slice" />
    <!-- Brand Text -->
    <text x="74" y="38" class="font-brand" font-size="30" font-weight="800" fill="#F6F3EC" letter-spacing="-0.5">Membrane</text>
  </g>

  <!-- Midnight Network Pill Badge (Top Right) -->
  <g transform="translate(930, 56)">
    <rect width="206" height="40" rx="20" fill="#4E93B4" fill-opacity="0.12" stroke="#4E93B4" stroke-opacity="0.35" stroke-width="1.5" />
    <circle cx="22" cy="20" r="4.5" fill="#4E93B4" />
    <circle cx="22" cy="20" r="8" fill="none" stroke="#4E93B4" stroke-opacity="0.4" stroke-width="1.5" />
    <text x="40" y="24" class="font-sans" font-size="12" font-weight="700" fill="#87C2DE" letter-spacing="0.8">MIDNIGHT NETWORK</text>
  </g>

  <!-- Left Column: Copy &amp; Value Proposition -->
  <g transform="translate(64, 180)">
    <!-- Category Pill Tag -->
    <rect width="280" height="30" rx="6" fill="#4E93B4" fill-opacity="0.18" stroke="#4E93B4" stroke-opacity="0.3" stroke-width="1" />
    <text x="14" y="19.5" class="font-sans" font-size="11" font-weight="700" fill="#87C2DE" letter-spacing="1.2">ZERO-KNOWLEDGE CLINICAL PROTOCOL</text>

    <!-- Main Headline -->
    <text x="0" y="85" class="font-brand" font-size="50" fill="#F6F3EC" letter-spacing="-1.8">Find the right cohort.</text>
    <text x="0" y="145" class="font-brand" font-size="50" fill="#4E93B4" letter-spacing="-1.8">Reveal zero patient data.</text>

    <!-- Subtitle description -->
    <text x="0" y="200" class="font-sans" font-size="18" fill="#A5B6C5" font-weight="400">Privacy-preserving clinical research and hospital cohort recruitment</text>
    <text x="0" y="228" class="font-sans" font-size="18" fill="#A5B6C5" font-weight="400">powered by zero-knowledge proofs on the Midnight Network.</text>
  </g>

  <!-- Right Column: Glassmorphism ZK Verification Card -->
  <g transform="translate(730, 160)">
    <!-- Card Background -->
    <rect width="406" height="310" rx="20" fill="url(#cardGrad)" stroke="#4E93B4" stroke-opacity="0.35" stroke-width="1.5" />

    <!-- Top Card Header -->
    <text x="24" y="40" class="font-sans" font-size="11" font-weight="700" fill="#8CA0B2" letter-spacing="1">ZK VERIFICATION PROOF</text>
    <g transform="translate(285, 28)">
      <circle cx="8" cy="8" r="4" fill="#4E93B4" />
      <text x="20" y="12" class="font-sans" font-size="12" font-weight="700" fill="#4E93B4">Enclave Active</text>
    </g>
    <line x1="24" y1="56" x2="382" y2="56" stroke="#F6F3EC" stroke-opacity="0.08" stroke-width="1" />

    <!-- Matched Count Stat -->
    <text x="24" y="112" class="font-brand" font-size="48" font-weight="800" fill="#F6F3EC">42</text>
    <text x="88" y="104" class="font-sans" font-size="15" font-weight="600" fill="#8CA0B2">Eligible Patients Matched</text>
    <text x="24" y="138" class="font-sans" font-size="12" fill="#4E93B4" font-weight="600">&#x2713; Criteria cryptographically verified</text>

    <!-- Code Block / Circuit -->
    <g transform="translate(24, 165)">
      <rect width="358" height="110" rx="10" fill="url(#codeGrad)" stroke="#4E93B4" stroke-opacity="0.22" stroke-width="1" />
      <circle cx="16" cy="20" r="3.5" fill="#4E93B4" fill-opacity="0.8" />
      <text x="28" y="24" class="font-mono" font-size="12" font-weight="700" fill="#87C2DE">circuit proveEligibility()</text>
      <text x="28" y="52" class="font-mono" font-size="10.5" fill="#8CA0B2">witness: private [ehr_record_hash]</text>
      <text x="28" y="74" class="font-mono" font-size="10.5" fill="#8CA0B2">predicate: public [study_criteria]</text>
      <text x="28" y="96" class="font-mono" font-size="10" fill="#4E93B4">&#x2713; Zero raw medical data leaves host enclave</text>
    </g>
  </g>

  <!-- Bottom Divider Line -->
  <line x1="64" y1="535" x2="1136" y2="535" stroke="#F6F3EC" stroke-opacity="0.08" stroke-width="1" />

  <!-- Bottom Badges Row -->
  <g transform="translate(64, 574)">
    <!-- Badge 1: Institutional Privacy -->
    <g transform="translate(0, 0)">
      <circle cx="9" cy="9" r="6" fill="#4E93B4" fill-opacity="0.2" stroke="#4E93B4" stroke-width="1.5" />
      <text x="22" y="14" class="font-sans" font-size="13" font-weight="600" fill="#8CA0B2">Institutional Privacy</text>
    </g>

    <!-- Badge 2: Air-Gapped EHR Vaults -->
    <g transform="translate(200, 0)">
      <circle cx="9" cy="9" r="6" fill="#4E93B4" fill-opacity="0.2" stroke="#4E93B4" stroke-width="1.5" />
      <text x="22" y="14" class="font-sans" font-size="13" font-weight="600" fill="#8CA0B2">Air-Gapped EHR Vaults</text>
    </g>

    <!-- Badge 3: Compact ZK Smart Contracts -->
    <g transform="translate(420, 0)">
      <circle cx="9" cy="9" r="6" fill="#4E93B4" fill-opacity="0.2" stroke="#4E93B4" stroke-width="1.5" />
      <text x="22" y="14" class="font-sans" font-size="13" font-weight="600" fill="#8CA0B2">Midnight Compact ZK Smart Contracts</text>
    </g>

    <!-- URL -->
    <text x="1072" y="14" text-anchor="end" class="font-brand" font-size="15" font-weight="700" fill="#87C2DE" letter-spacing="0.5">membrane.health</text>
  </g>
</svg>`;

const outputPath = path.join(__dirname, 'public', 'og-image.svg');
fs.writeFileSync(outputPath, svg);
console.log('Successfully generated public/og-image.svg with official Membrane app logo!');
