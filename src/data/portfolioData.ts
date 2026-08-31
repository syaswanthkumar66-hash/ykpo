import { DigitalProduct, ServiceTier, Project } from '../types';

export const DIGITAL_PRODUCTS: DigitalProduct[] = [
  {
    id: 'prod-test-rupee',
    slug: 'test-rupee-transaction',
    title: '₹1 Live Direct UPI & PayU Test Sandbox',
    tagline: 'Test real-time PayU Hosted checkout, direct UPI intent, and instant payment verification for ₹1.',
    description: 'A dedicated 1-Rupee live transaction sandbox designed to verify PayU Hosted checkout, dynamic UPI QR scanning, instant mobile app launching, and real-time webhook confirmation with reverse SHA-512 cryptographic verification.',
    priceINR: 1,
    category: 'testing',
    badge: '⚡ ₹1 Live Sandbox',
    fileSize: '120 KB (.zip)',
    version: 'v1.0.0',
    downloadFileName: 'ykyash-payment-sandbox-test.zip',
    features: [
      'Real-time ₹1.00 Live PayU Gateway & UPI Verification',
      'Dynamic UPI QR code scanning (PhonePe, GPay, Paytm, BHIM, CRED)',
      'Reverse SHA-512 Cryptographic Signature Validation',
      'Instant Supabase Database Ledger Persistence',
      'Real-Time Web Push Notification Dispatch'
    ],
    techStack: ['PayU Hosted', 'Direct UPI', 'SHA-512', 'Supabase', 'Web Push'],
    highlights: ['₹1.00 Live Test', 'Instant Verification', 'Real-Time Webhook']
  }
];

export const SERVICES: ServiceTier[] = [
  {
    id: 'web-development',
    title: 'Full-Stack Web App Development',
    priceINR: 48000,
    duration: '2 – 3 Weeks',
    description: 'End-to-end web application development using React, Node.js, Express, and PostgreSQL/MongoDB with high-conversion UI/UX.',
    features: [
      'Custom Responsive Frontend with Tailwind CSS & Motion',
      'Secure REST / GraphQL API Architecture with JWT Auth',
      'Database Modeling & Cloud Deployment (Vercel / Cloud Run)',
      'Secure Payment Gateway Integration (Online Payment APIs)',
      'SEO Optimization & Performance Auditing (95+ Lighthouse)',
      '30-Day Complimentary Post-Launch Defect Warranty'
    ],
    milestones: [
      { phase: 'Phase 1: Architecture & UI Prototype', percentage: 30, description: 'Design sign-off and database schema setup' },
      { phase: 'Phase 2: Core Development & Staging', percentage: 40, description: 'Functional backend and interactive frontend deployed on staging' },
      { phase: 'Phase 3: Final Testing & Handover', percentage: 30, description: 'Production deployment, domain setup, and source code transfer' }
    ]
  },
  {
    id: 'iot-prototyping',
    title: 'IoT Prototyping & Embedded Firmware',
    priceINR: 38000,
    duration: '2 – 4 Weeks',
    description: 'Complete hardware prototyping, PCB schematic design, and FreeRTOS embedded firmware for ESP32 and ARM microcontrollers.',
    features: [
      'Custom Embedded C++ / FreeRTOS Firmware Development',
      'Sensor & Actuator Calibration (I2C, SPI, UART, ADC)',
      'Cloud Telemetry via MQTT, CoAP, or WebSockets',
      'Low-Power Sleep Optimization & Battery Life Modeling',
      'KiCad PCB Layout & Component Bill of Materials (BOM)',
      'Web-based Real-Time Control & Monitoring Dashboard'
    ],
    milestones: [
      { phase: 'Phase 1: Hardware Selection & Circuit Design', percentage: 40, description: 'BOM approval and schematic design' },
      { phase: 'Phase 2: Firmware & Sensor Pipeline', percentage: 35, description: 'Data ingestion and cloud telemetry integration' },
      { phase: 'Phase 3: Enclosure & Live Demonstration', percentage: 25, description: 'Bench testing, hardware handover, and documentation' }
    ]
  },
  {
    id: 'api-payment-integration',
    title: 'Custom API & Payment Gateway Integration',
    priceINR: 19500,
    duration: '4 – 7 Days',
    description: 'Secure payment gateway integration, webhook automation, and third-party API connectivity for Indian and global merchants.',
    features: [
      'Online Payment Gateway Integration (UPI, Cards, NetBanking, EMI)',
      'Cryptographic HMAC SHA-512 Hash Generation & Response Validation',
      'Idempotent Webhook Handlers with Database Transaction Locks',
      'Automated PDF Invoice & Email Notification Dispatch',
      'Merchant KYC Compliance Guidance & Policy Pages Setup',
      'Production Sandbox Testing & Go-Live Verification'
    ],
    milestones: [
      { phase: 'Phase 1: Endpoint Setup & Test Checkout', percentage: 50, description: 'Sandbox verification and hash integration' },
      { phase: 'Phase 2: Webhooks & Production Deployment', percentage: 50, description: 'Live credentials testing and receipt dispatch' }
    ]
  }
];

export const PROJECTS: Project[] = [
  {
    id: 1,
    title: 'Smart Campus Environment Monitor',
    category: 'iot',
    description: 'A comprehensive hardware monitoring system utilizing embedded sensors and real-time data telemetry. Built with ESP32, DHT11/MQ-135 sensors, FreeRTOS, and MQTT broadcasting to cloud dashboards.',
    tags: ['ESP32', 'FreeRTOS', 'MQTT', 'C++', 'IoT'],
    iconName: 'Cpu',
    stats: '500k+ Data Points Logged'
  },
  {
    id: 2,
    title: 'Real-Time MQTT Telemetry Web Dashboard',
    category: 'web',
    description: 'A cloud-synced dashboard connecting hardware telemetry to a high-density web interface via WebSockets and time-series charts with sub-100ms latency.',
    tags: ['React', 'WebSockets', 'Tailwind', 'ChartJS'],
    iconName: 'Globe',
    stats: '< 100ms Live Latency'
  },
  {
    id: 3,
    title: 'Student Book & Inventory Manager',
    category: 'web',
    description: 'Full-stack utility web application featuring barcode scanning, inventory tracking, and automated Telegram Bot notification dispatch for overdue returns.',
    tags: ['Node.js', 'Telegram API', 'PostgreSQL', 'React'],
    iconName: 'Code2',
    stats: '1,200+ Active Books Tracked'
  },
  {
    id: 4,
    title: 'Fintech Money Manager & Expense Tracker',
    category: 'fintech',
    description: 'Secure personal finance tracking platform with REST API, PostgreSQL storage, dynamic visual categorical breakdown, and automated subscription billing.',
    tags: ['PostgreSQL', 'Express', 'React', 'Payment Gateway'],
    iconName: 'Globe',
    stats: '99.9% Uptime SLA'
  }
];

export const SKILL_CATEGORIES = [
  {
    name: 'Full-Stack Web Development',
    skills: ['React 19 & Next.js', 'TypeScript', 'Node.js & Express', 'Tailwind CSS', 'REST & GraphQL APIs', 'PostgreSQL & Supabase']
  },
  {
    name: 'IoT & Embedded Engineering',
    skills: ['ESP32 & STM32 Microcontrollers', 'Embedded C / C++', 'FreeRTOS Multi-Tasking', 'MQTT & CoAP Protocols', 'Circuit Schematics (KiCad)', 'Sensor Fusion & Calibration']
  },
  {
    name: 'Payments & Cloud Architecture',
    skills: ['Secure Payment Gateway Integration', 'SHA-512 Security & Webhooks', 'Vercel & Cloud Run', 'Docker & CI/CD', 'WebSockets & Real-Time Sync', 'Web Push & Service Workers']
  }
];

export const MERCHANT_KYC_DETAILS = {
  legalName: 'S. Yaswanth Kumar',
  businessName: 'YK Yash (Full-Stack & IoT Systems Engineering)',
  domain: 'https://ykyash.in',
  officialEmail: 'contact@ykyash.in',
  supportEmail: 'contact@ykyash.in',
  operatingHours: 'Monday – Saturday: 10:00 AM – 7:00 PM IST',
  grievanceOfficer: 'S. Yaswanth Kumar (Lead Developer & Proprietor)',
  gstNumber: '' // Composition / Unregistered
};

export const LEGAL_TEXTS = {
  terms: {
    title: 'Terms and Conditions',
    lastUpdated: 'August 18, 2026',
    summary: 'Governs the purchase of digital source code, templates, and engineering service contracts on ykyash.in.',
    content: `# TERMS AND CONDITIONS FOR DIGITAL PRODUCTS & FREELANCE SERVICES
**Domain:** https://ykyash.in
**Proprietor / Service Provider:** S. Yaswanth Kumar (Operating as "YK Yash")
**Contact:** contact@ykyash.in
**Last Updated:** August 18, 2026

---

### 1. ACCEPTANCE OF TERMS
By accessing https://ykyash.in, purchasing any digital product (templates, source code, boilerplates, firmware), or contracting software/hardware engineering services, you ("Customer" or "Client") agree to be legally bound by these Terms and Conditions.

---

### 2. DIGITAL PRODUCTS & LICENSING
2.1. **Grant of License:** Upon successful payment of the specified fee in Indian Rupees (INR), YK Yash grants the customer a non-exclusive, non-transferable, worldwide commercial license to use, modify, and integrate the downloaded source code into personal and commercial projects.
2.2. **Restrictions:** You may NOT redistribute, resell, sub-license, or republish the raw source code files or template packages as a standalone competitor or boilerplate in public repositories or marketplaces.
2.3. **Instant Delivery:** Digital products are delivered electronically. Upon payment clearance, download links are generated immediately on screen and confirmed via email.

---

### 3. FREELANCE ENGINEERING & CONSULTING SERVICES
3.1. **Statement of Work (SOW):** Custom development (web apps, IoT firmware, API integrations) is governed by mutually agreed milestone deliverables and timelines.
3.2. **Milestone Billing:** Payments are structured into agreed milestones (e.g., Phase 1 Kickoff, Phase 2 Beta, Phase 3 Final Delivery). Work on a subsequent phase commences upon receipt of the preceding milestone payment.
3.3. **Intellectual Property Transfer:** Complete IP ownership of custom client code transfers to the Client solely upon 100% full settlement of all project invoices.

---

### 4. PAYMENT TERMS & GATEWAY COMPLIANCE
4.1. **Currency:** All transactions are denominated and billed in Indian Rupees (INR ₹).
4.2. **Payment Processing:** Payments are securely processed through RBI-authorized payment aggregators and payment gateways. We do not store raw card numbers, CVV, or banking passwords.
4.3. **Taxes & Invoicing:** Prices displayed represent the final checkout amounts. Electronic transaction receipts are generated automatically upon successful gateway verification.

---

### 5. WARRANTY & LIMITATION OF LIABILITY
5.1. Digital products are provided "as-is" with guaranteed compatibility for the versions documented in the product specifications.
5.2. YK Yash shall not be held liable for any indirect, incidental, or consequential damages resulting from the use or inability to use the software deliverables.

---

### 6. GOVERNING LAW & JURISDICTION
These Terms shall be governed by and construed in accordance with the laws of the Republic of India.`
  },

  privacy: {
    title: 'Privacy Policy',
    lastUpdated: 'August 18, 2026',
    summary: 'Explains how customer and transaction data is handled in strict compliance with the Indian Information Technology Act and DPDP guidelines.',
    content: `# PRIVACY POLICY
**Domain:** https://ykyash.in
**Proprietor:** S. Yaswanth Kumar (YK Yash)
**Official Email:** contact@ykyash.in
**Applicable Framework:** Information Technology Act, 2000, SPDI Rules, 2011 & Indian DPDP Act.

---

### 1. INFORMATION WE COLLECT
We collect only the minimum necessary information to fulfill your digital purchases and project inquiries:
- **Customer Identity Data:** Full Name, Email Address, and Billing Country.
- **Transaction Metadata:** Transaction ID (\`txnid\`), Product/Milestone Identifier, Amount Paid in INR, Payment Method (UPI, NetBanking, Card), and Gateway Timestamp.
- **Technical & Usage Data:** IP address, browser type, and download token timestamps to verify authorized file delivery.

*(Note: We NEVER collect or store raw Credit/Debit card numbers, CVV, NetBanking passwords, or UPI PINs. All financial processing occurs on PCI-DSS certified servers operated by authorized payment gateways.)*

---

### 2. PURPOSE OF DATA PROCESSING
We process your personal information strictly for:
- Facilitating secure checkout and instantaneous digital download link generation.
- Dispatching digital invoices, license keys, and milestone completion receipts.
- Responding to technical support, consultation requests, and warranty claims.
- Maintaining statutory audit records in compliance with Indian taxation and merchant regulations.

---

### 3. THIRD-PARTY DISCLOSURES & SECURITY
We do NOT sell, rent, or trade personal customer information with any marketing brokers. Data is shared solely with trusted payment infrastructure:
- **Payment Processing:** RBI-authorized payment aggregators (Secured with 256-bit TLS encryption and SHA-512 cryptographic checksums).
- **Communication & Delivery:** Resend / Vercel infrastructure (for email confirmation and receipt generation).

---

### 4. DATA RETENTION & YOUR RIGHTS
You have the right to request access to, correction of, or deletion of your personal records from our active database. For inquiries, email **contact@ykyash.in**.

---

### 5. GRIEVANCE OFFICER DETAILS
In accordance with Information Technology Act, 2000:
- **Grievance Officer:** S. Yaswanth Kumar
- **Designation:** Proprietor & Engineering Lead
- **Email:** contact@ykyash.in
- **Response Window:** Grievances are acknowledged within 24 hours and addressed within 15 business days.`
  },

  refund: {
    title: 'Refund and Cancellation Policy',
    lastUpdated: 'August 18, 2026',
    summary: 'Defines clear, fair refund conditions for instant digital downloads and custom milestone development services.',
    content: `# REFUND AND CANCELLATION POLICY
**Domain:** https://ykyash.in
**Proprietor:** S. Yaswanth Kumar (YK Yash)
**Official Email:** contact@ykyash.in

---

### 1. DIGITAL PRODUCTS & SOURCE CODE PURCHASES
Due to the digital and immediately accessible nature of downloadable goods (templates, UI kits, firmware source code):
- **Final Sale Rule:** All digital product sales are final once the download link has been generated and delivered.
- **Defective File Exception:** If a purchased digital package is proven to be corrupt, broken, or missing documented files, and our technical support cannot provide a working copy within 48 hours of notification, a **100% full refund** will be issued.
- **Pre-Download Cancellation:** If a payment is processed but the customer has not accessed or downloaded the files, a cancellation request made within 24 hours of payment will be honored minus nominal payment gateway processing charges (typically 2-3%).

---

### 2. FREELANCE & BESPOKE DEVELOPMENT SERVICES
- **Non-Refundable Hours:** Milestone payments for custom web applications or IoT engineering work that has already been executed and delivered for review are non-refundable.
- **Uncommenced Milestones:** Any prepaid funds for future development phases that have not commenced will be refunded in full upon written project cancellation.
- **Hardware Procurement:** Hardware modules, custom sensors, or PCBs procured specifically for client projects are non-refundable once purchased from suppliers.

---

### 3. REFUND PROCESSING & TIMELINES
- To request a refund, email **contact@ykyash.in** with your Transaction ID (\`txnid\`) and reason for the request.
- Approved refunds are credited directly to the original payment source (UPI ID, Debit/Credit Card, or Bank Account) within **5 to 7 business days** in accordance with Indian banking norms.`
  },

  delivery: {
    title: 'Shipping and Delivery Policy',
    lastUpdated: 'August 18, 2026',
    summary: 'Declaration confirming instantaneous, 100% digital electronic delivery with zero physical shipping.',
    content: `# SHIPPING AND DELIVERY POLICY (DIGITAL GOODS)
**Domain:** https://ykyash.in
**Proprietor:** S. Yaswanth Kumar (YK Yash)
**Official Email:** contact@ykyash.in
**Last Updated:** August 18, 2026

---

### 1. 100% DIGITAL ELECTRONIC DELIVERY
**All products and services offered on https://ykyash.in are strictly digital goods and services.**
- **No Physical Shipping:** We do not manufacture, package, or ship any physical goods or postal packages. No physical shipping fees or courier tracking applies.

---

### 2. DELIVERY TIMELINES & METHODS
- **Digital Products (Templates, Firmware, Source Code):**
  - **Instant Screen Access:** Immediately upon successful order checkout, you are redirected to the secure **Payment Success & Download Portal** where you can download your ZIP package with one click.
  - **Email Confirmation:** A copy of the download credentials, license key, and payment invoice is dispatched to your registered email address within **5 minutes** of transaction completion.
- **Custom Development Services:**
  - Delivered electronically via private Git repository access, staging server deployments, and cloud infrastructure provisioning in accordance with the project SOW timeline.

---

### 3. DOWNLOAD ISSUES & SUPPORT
If you do not receive your digital download link or email confirmation within 15 minutes of completing your transaction:
1. Check your email Spam/Promotions folder.
2. Visit the [Payment Status](/payment/success) portal with your Transaction ID.
3. Contact our support team at **contact@ykyash.in** for instant manual link re-issuance.`
  }
};
