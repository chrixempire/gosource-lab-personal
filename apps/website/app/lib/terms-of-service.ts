import { buildLegalNav } from '~/lib/legal-document';
import type { LegalSection } from '~/lib/legal-document';

export const termsOfServiceMeta = {
  title: 'GoSource Terms of Service',
  intro: [
    'These Terms of Service ("Terms") form a legally binding agreement between you and GoSource Technologies Limited, a company doing business as "GoSource" ("GoSource", "we", "us", or "our"). These Terms govern your access to and use of our website, mobile applications for iOS and Android, user dashboards, order tracking systems, procurement tools, and all related services and features (collectively referred to as the "Websites" or "Services").',
    'By creating an account, placing an order, logging in, or otherwise accessing or using any part of the Services, you confirm that you have read, understood, and agree to be bound by these Terms. If you do not agree with any part of these Terms, you must immediately stop using the Services.',
    'Our Privacy Policy, Acceptable Use Policy, and any applicable Merchant or Credit Terms are incorporated into these Terms by reference and form part of this agreement. In these Terms, "You" refers to the individual user, business entity (such as a restaurant, caterer, ghost kitchen, food service provider, retailer, or supplier), or any affiliates accessing or using the Services on behalf of a business. We provide the Services without any warranties except those explicitly stated in these Terms.',
  ],
};

export const termsOfServiceSections: LegalSection[] = [
  {
    id: 'about-us-and-services',
    number: 1,
    title: 'About Us and Our Services',
    blocks: [
      {
        type: 'paragraph',
        text: 'GoSource is a leading food procurement, supply-chain management, and logistics platform designed specifically for businesses operating in Nigeria, including restaurants, catering services, quick-service outlets, grocery shops, and food suppliers. We help streamline your operations by offering a full suite of integrated tools and services, including:',
      },
      {
        type: 'list',
        items: [
          'Bulk ordering of fresh produce, staples, proteins, and specialty ingredients from a network of verified suppliers across Nigeria.',
          'Fast 24-hour delivery services with real-time GPS tracking, automated notifications, and proof-of-delivery confirmations.',
          'A centralized user dashboard for seamless order management, procurement planning, inventory monitoring with low-stock alerts and automated deductions, instant digital invoicing, and customizable reports.',
          'Flexible credit facilities dependent on Your creditworthiness and spending capacity, approved based on verified business revenue, bank statements, trade references, and payment history, with net-7 payment terms for eligible users.',
          'Secure payment processing supporting cash-on-delivery, bank transfers, cards, and digital wallets, complete with receipt generation and daily/weekly reconciliation totals.',
          'Advanced customer and business tools such as loyalty programs, promotional campaigns, reorder favorites, purchase history analytics, and personalized procurement recommendations.',
          'Seamless third-party integrations with popular payment gateways, logistics providers, and accounting software for end-to-end efficiency.',
          'Comprehensive analytics and insights into sales trends, procurement costs, supplier performance, and supply-chain optimizations to drive better business decisions.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Any new features, tools, updates, or enhancements added to the Services in the future will automatically be governed by these Terms. We continuously evolve our platform to meet the needs of growing food businesses.',
      },
    ],
  },
  {
    id: 'our-relationship',
    number: 2,
    title: 'Our Relationship with You',
    blocks: [
      {
        type: 'paragraph',
        text: 'GoSource acts as a procurement and supply-chain facilitator for your business. While we source and deliver products through verified suppliers, we assume responsibility for defective goods and will work to resolve issues such as replacements or refunds in accordance with our policies. We do not control, endorse, or guarantee the identities or legitimacy of suppliers, the completion of transactions, or disputes between you, your customers, delivery personnel, or third-party providers (such as payment processors).',
      },
    ],
  },
  {
    id: 'privacy-policy',
    number: 3,
    title: 'Privacy Policy',
    blocks: [
      {
        type: 'paragraph',
        text: 'We collect, use, store, and protect your personal data, business information, order histories, procurement records, customer details, and analytics data in strict accordance with our Privacy Policy. Our practices fully comply with the Nigeria Data Protection Regulation (NDPR) 2019, the Nigeria Data Protection Act 2023, and international best practices. Please review the full Privacy Policy for details on your rights, data security measures, and how to exercise them.',
      },
    ],
  },
  {
    id: 'copyright-ip',
    number: 4,
    title: 'Copyright and Intellectual Property',
    blocks: [
      {
        type: 'paragraph',
        text: 'All content on the Websites and Services—including text, images, graphics, logos, software code, dashboard interfaces, tracking maps, analytics visualizations, and proprietary algorithms—is the exclusive property of GoSource or our licensed partners. This content is protected by copyright, trademark, and other intellectual property laws. You are granted a limited, revocable, non-exclusive license to access and use the Services for your legitimate business purposes only. Any unauthorized copying, reproduction, distribution, modification, or commercial exploitation is strictly prohibited and may result in legal action, including claims for damages and injunctions.',
      },
    ],
  },
  {
    id: 'your-content',
    number: 5,
    title: 'Your Content',
    blocks: [
      {
        type: 'paragraph',
        text: '"Your Content" means any information, data, materials, or items you upload, submit, or display through the Services, such as product listings, supplier details, menu items, order specifications, business profiles, images, pricing information, delivery addresses, inventory records, customer notes, or promotional content.',
      },
      {
        type: 'paragraph',
        text: 'By providing Your Content, you grant GoSource a worldwide, perpetual, irrevocable, royalty-free, fully sublicensable license to host, store, use, display, reproduce, modify, adapt, distribute, and create derivative works from Your Content as necessary to operate, improve, and provide the Services. This license survives termination of your account.',
      },
      {
        type: 'paragraph',
        text: 'You represent and warrant that Your Content is accurate, complete, lawful, and does not infringe any third-party rights (e.g., intellectual property, privacy). You agree to indemnify and hold GoSource harmless from any claims, losses, or liabilities arising from Your Content or your breach of these warranties. We reserve the right to review, edit, remove, or refuse any Your Content at our sole discretion, without notice or liability.',
      },
    ],
  },
  {
    id: 'restrictions',
    number: 6,
    title: 'Restrictions on Use of Our Services',
    blocks: [
      {
        type: 'paragraph',
        text: 'To ensure a safe, reliable platform for all users, the following actions are strictly prohibited. Violation may lead to immediate suspension or termination of your account:',
      },
      {
        type: 'list',
        items: [
          'Attempting to reverse-engineer, decompile, disassemble, or replicate any part of our platforms, software, algorithms, or Services.',
          'Overloading our servers through excessive automated requests, denial-of-service attacks, or similar disruptive activities.',
          'Introducing malware, viruses, or harmful code into the Services.',
          'Engaging in illegal, fraudulent, or unethical activities, such as placing fake orders, evading payments, or misrepresenting your business.',
          'Bypassing security features, hacking accounts, or scraping data without explicit permission.',
          'Creating competing services or clones using our intellectual property or data.',
          'Commercializing or reselling GoSource features, dashboards, or tools as your own product.',
        ],
      },
      {
        type: 'paragraph',
        text: 'We may take enforcement actions without prior warning, including account bans, content removal, and reporting to authorities.',
      },
    ],
  },
  {
    id: 'age-restriction',
    number: 7,
    title: 'Age Restriction',
    blocks: [
      {
        type: 'paragraph',
        text: 'The Services are intended for use by businesses and individuals who are at least 18 years of age. We do not knowingly facilitate transactions involving minors. If your business involves age-restricted products (e.g., alcohol), you must implement and enforce appropriate verification measures.',
      },
    ],
  },
  {
    id: 'acceptable-use',
    number: 8,
    title: 'Acceptable Use Policy',
    blocks: [
      {
        type: 'paragraph',
        text: 'Our Acceptable Use Policy ("AUP") sets forth detailed rules for responsible use of the Services, including dashboards, ordering systems, tracking features, and procurement tools. Breaches may result in immediate suspension or permanent termination without refund or notice. All users must comply with applicable Nigerian laws, including the Food and Drugs Act 2004, NAFDAC regulations on food safety and labelling, the Nigeria Data Protection Act 2023, and anti-fraud statutes.',
      },
      {
        type: 'list',
        intro: 'Prohibited Activities (Zero-Tolerance Policy):',
        items: [
          'Illegal or Fraudulent Use: Placing or facilitating fake orders, selling counterfeit or adulterated goods, money laundering, tax evasion, or sanctions circumvention.',
          'Security Violations: Hacking into dashboards, apps, or supplier systems; sharing login credentials; introducing malware; or unauthorized access to user data.',
          'Abusive Practices: Sending spam promotions, posting fake reviews or ratings, discriminating in service based on race, religion, gender, or other protected characteristics, or harassing users via chat or notifications.',
          'System Overloading: Excessive API calls, using bots or scripts to automate orders beyond fair use, or disrupting inventory sync and order processing.',
          'Content Violations: Uploading infringing materials (e.g., stolen images or menus), obscene, hateful, or illegal content (e.g., promoting unsafe food practices), or misleading information like false pricing or availability.',
          'Commercial Misuse: Reselling GoSource Services as your own, harvesting data for sale to third parties, or using the platform for non-food procurement unrelated to your business.',
        ],
      },
      {
        type: 'paragraph',
        text: 'We actively monitor usage patterns for compliance and security. Violations may lead to content removal, feature restrictions, or account termination. You agree to indemnify us for any losses from your breaches. If you believe an action was taken in error, contact support@gosource.app for review.',
      },
    ],
  },
  {
    id: 'disclaimers',
    number: 9,
    title: 'Disclaimers of Warranties',
    blocks: [
      {
        type: 'paragraph',
        text: 'The Services are provided strictly on an "AS IS" and "AS AVAILABLE" basis. To the fullest extent permitted by law, GoSource disclaims all express, implied, and statutory warranties, including but not limited to warranties of merchantability, fitness for a particular purpose, title, non-infringement, uninterrupted access, error-free performance, accurate order fulfillment, timely deliveries, precise inventory tracking, reliable credit decisions, or any guarantees of business outcomes or profitability. We do not warrant the reliability, security, or performance of third-party integrations, such as payment processors or delivery partners.',
      },
    ],
  },
  {
    id: 'limitation-liability',
    number: 10,
    title: 'Limitation of Liability',
    blocks: [
      {
        type: 'paragraph',
        text: 'In no event shall GoSource, its affiliates, officers, directors, employees, or agents be liable for any indirect, incidental, consequential, special, punitive, or exemplary damages arising from or related to your use of the Services, including lost profits, lost revenue, business interruption, stock spoilage, customer disputes, regulatory fines, or supply-chain disruptions—even if advised of the possibility. Our total aggregate liability to you under these Terms shall not exceed the total fees or order values you have paid to us in the twelve (12) months preceding the claim. This limitation applies regardless of the legal theory.',
      },
    ],
  },
  {
    id: 'statutory-exclusions',
    number: 11,
    title: 'Statutory Exclusions',
    blocks: [
      {
        type: 'paragraph',
        text: 'Nothing in these Terms excludes or limits our liability where prohibited by Nigerian law, such as for death, personal injury, or fraud resulting from gross negligence.',
      },
    ],
  },
  {
    id: 'indemnification',
    number: 12,
    title: 'Indemnification',
    blocks: [
      {
        type: 'paragraph',
        text: 'You agree to defend, indemnify, and hold harmless GoSource, its affiliates, officers, directors, employees, agents, suppliers, and licensors from and against all claims, losses, liabilities, damages, costs, and expenses (including reasonable attorneys\' fees) arising out of or related to: (i) Your Content; (ii) your violation of these Terms or the AUP; (iii) your business operations, products, or services (e.g., food safety claims or poisoning incidents); (iv) disputes with customers, suppliers, or third parties; or (v) your negligence or willful misconduct. We reserve the right to assume control of the defense at your expense, but you must cooperate fully.',
      },
    ],
  },
  {
    id: 'termination',
    number: 13,
    title: 'Termination and Suspension',
    blocks: [
      {
        type: 'paragraph',
        text: 'We may suspend or terminate your access to all or part of the Services at any time, with or without cause, immediately and without notice or liability. Grounds include AUP violations, non-payment, security risks, or at our sole discretion. Upon termination: (i) all outstanding payments become due immediately; (ii) your right to use the Services ends; and (iii) we may delete your data after a reasonable export period as outlined in our Privacy Policy. Sections on IP rights, disclaimers, liability limits, indemnification, and governing law survive termination indefinitely.',
      },
    ],
  },
  {
    id: 'third-party',
    number: 14,
    title: 'Third-Party Links and Integrations',
    blocks: [
      {
        type: 'paragraph',
        text: 'The Services may contain links to or integrations with third-party websites, apps, or services (e.g., payment gateways like Paystack, delivery apps, or accounting tools). These are provided for convenience only. GoSource has no control over, responsibility for, or endorsement of such third parties, and we disclaim all liability for their content, privacy practices, or performance.',
      },
    ],
  },
  {
    id: 'limited-role',
    number: 15,
    title: 'Our Limited Role',
    blocks: [
      {
        type: 'paragraph',
        text: 'GoSource is purely a technology platform—we are not a party to your transactions, a guarantor of products or deliveries, a mediator for disputes, or an agent for you or suppliers. We do not vet users, suppliers, or products for quality, safety, or compliance. You are solely responsible for verifying all regulatory requirements, such as NAFDAC approvals for food items, proper storage/handling, and business licensing.',
      },
    ],
  },
  {
    id: 'updates-amendments',
    number: 16,
    title: 'Updates and Amendments to Terms',
    blocks: [
      {
        type: 'paragraph',
        text: 'We may modify these Terms at any time to reflect changes in our Services, legal requirements, or business needs. We will notify you of material changes via email, in-app notifications, dashboard alerts, or postings on the Websites. Your continued use of the Services after such changes constitutes your acceptance of the revised Terms. We encourage you to review these Terms periodically.',
      },
    ],
  },
  {
    id: 'governing-law',
    number: 17,
    title: 'Governing Law',
    blocks: [
      {
        type: 'paragraph',
        text: 'These Terms and any disputes arising from or related to them shall be governed exclusively by the laws of the Federal Republic of Nigeria, without regard to conflict of laws principles.',
      },
    ],
  },
  {
    id: 'dispute-resolution',
    number: 21,
    title: 'Dispute Resolution and Legal Proceedings',
    blocks: [
      {
        type: 'paragraph',
        text: 'In the event of any dispute, you agree to first attempt good-faith negotiations for at least sixty (60) days by emailing support@gosource.app. If negotiations fail to resolve the issue, any legal proceedings shall be brought exclusively in the High Court of Lagos State, to the exclusion of all other courts. You waive any objections to venue or jurisdiction.',
      },
    ],
  },
  {
    id: 'entire-agreement',
    number: 18,
    title: 'Entire Agreement',
    blocks: [
      {
        type: 'paragraph',
        text: 'These Terms, together with our Privacy Policy and any incorporated policies, constitute the entire and exclusive agreement between you and GoSource regarding the Services, superseding all prior or contemporaneous understandings, whether oral or written.',
      },
    ],
  },
  {
    id: 'miscellaneous',
    number: 19,
    title: 'Miscellaneous Provisions',
    blocks: [
      {
        type: 'list',
        items: [
          'All notices under these Terms may be provided electronically (e.g., email or dashboard), and shall be deemed received upon sending.',
          'You may not assign, transfer, or subcontract your rights or obligations under these Terms without our prior written consent. GoSource may freely assign or subcontract our rights and obligations.',
          'If any provision is held invalid or unenforceable, the remaining provisions remain in full effect.',
          'No waiver of any breach shall constitute a waiver of subsequent breaches.',
          'Neither party is liable for delays or failures due to force majeure events (e.g., natural disasters, strikes, government actions beyond control).',
          'These Terms do not create any partnership, joint venture, agency, or employment relationship.',
        ],
      },
    ],
  },
  {
    id: 'contact',
    number: 22,
    title: 'Contact Us',
    blocks: [
      {
        type: 'paragraph',
        text: 'For questions, support, appeals, or notices, please contact:',
      },
      {
        type: 'paragraph',
        text: 'GoSource, Independent Purchasing Company.',
      },
      {
        type: 'emails',
        addresses: ['admin@ipc-africa.com'],
      },
    ],
  },
];

export const termsOfServiceNav = buildLegalNav(termsOfServiceSections);
