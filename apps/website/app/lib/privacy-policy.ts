import { buildLegalNav } from '~/lib/legal-document';
import type { LegalContentBlock, LegalSection } from '~/lib/legal-document';

export type { LegalContentBlock, LegalSection };

export const privacyPolicyMeta = {
  title: 'GoSource Privacy Policy',
  effectiveDate: 'April 22, 2026',
  intro:
    'GoSource Technologies Limited ("GoSource", "we", "us", or "our"), operator of the GoSource food procurement and logistics platform, is committed to protecting your privacy. This Privacy Policy explains how we collect, use, share, and safeguard your personal and business information when you use our website, mobile apps, dashboards, and services ("Services"). By using the Services, you agree to these practices, which comply with the Nigeria Data Protection Regulation (NDPR) 2019 and Nigeria Data Protection Act 2023.',
};

export const privacyPolicySections: LegalSection[] = [
  {
    id: 'information-we-collect',
    number: 1,
    title: 'Information We Collect',
    blocks: [
      {
        type: 'paragraph',
        text: 'We collect only the data necessary to provide our Services:',
      },
      {
        type: 'list',
        items: [
          'Information You Provide: Account details (name, email, phone, business name, delivery addresses), order and payment information, credit application documents (revenue proofs, bank statements), communications, and uploaded content like product listings or images.',
          'Information Collected Automatically: IP address, device type, browser details, usage patterns, location data for delivery optimization, and cookies for functionality and analytics.',
          'Third-Party Information: Verification data from payment processors, logistics partners, or credit bureaus.',
        ],
      },
      {
        type: 'paragraph',
        text: 'We do not collect sensitive personal data without explicit consent.',
      },
    ],
  },
  {
    id: 'how-we-use',
    number: 2,
    title: 'How We Use Your Information',
    blocks: [
      {
        type: 'paragraph',
        text: 'Your information enables us to:',
      },
      {
        type: 'list',
        items: [
          'Create and manage accounts, process bulk orders, deliveries, payments, and credit facilities.',
          'Provide support, send confirmations, updates, and personalized recommendations.',
          'Analyze usage to improve services, prevent fraud, and generate insights.',
          'Comply with legal obligations, such as tax reporting and audits.',
        ],
      },
    ],
  },
  {
    id: 'sharing',
    number: 3,
    title: 'Sharing Your Information',
    blocks: [
      {
        type: 'paragraph',
        text: 'We never sell your data. We share it only with:',
      },
      {
        type: 'list',
        items: [
          'Trusted service providers (e.g., payment gateways like Paystack, delivery partners, cloud hosts) under strict confidentiality agreements.',
          'Legal authorities when required by law.',
          'Successor entities in business transfers, with advance notice.',
          'Aggregated, anonymized data for industry insights.',
        ],
      },
    ],
  },
  {
    id: 'international-transfers',
    number: 4,
    title: 'International Data Transfers',
    blocks: [
      {
        type: 'paragraph',
        text: 'If data is processed outside Nigeria, we use Standard Contractual Clauses or equivalent safeguards to ensure NDPR-level protection.',
      },
    ],
  },
  {
    id: 'retention',
    number: 5,
    title: 'Data Retention and Deletion',
    blocks: [
      {
        type: 'paragraph',
        text: 'We retain data only as long as needed for services, legal requirements (e.g., 7 years for tax records), or dispute resolution. Contact support@gosource.app to request deletion, subject to legal exceptions.',
      },
    ],
  },
  {
    id: 'cookies',
    number: 6,
    title: 'Cookies and Tracking',
    blocks: [
      {
        type: 'paragraph',
        text: 'Essential cookies ensure site functionality. Performance and marketing cookies improve experience and ads (manage via browser settings or our consent tool). Third-party cookies follow their own policies.',
      },
    ],
  },
  {
    id: 'your-rights',
    number: 7,
    title: 'Your Rights under NDPR',
    blocks: [
      {
        type: 'paragraph',
        text: 'You can access, correct, delete, restrict, or port your data; object to processing; or withdraw consent. Submit requests to support@gosource.app—we respond within 30 days. Complain to the Nigeria Data Protection Commission (NDPC) if needed.',
      },
    ],
  },
  {
    id: 'security',
    number: 8,
    title: 'Data Security',
    blocks: [
      {
        type: 'paragraph',
        text: 'We use encryption (in transit and at rest), access controls, regular audits, and breach response protocols. While we prioritize security, no system is fully risk-free.',
      },
    ],
  },
  {
    id: 'children',
    number: 9,
    title: "Children's Privacy",
    blocks: [
      {
        type: 'paragraph',
        text: 'Services are for businesses and users 18+. We do not knowingly collect children\'s data.',
      },
    ],
  },
  {
    id: 'policy-changes',
    number: 10,
    title: 'Policy Changes',
    blocks: [
      {
        type: 'paragraph',
        text: 'Updates will be posted here with notice via email or dashboard. Continued use means acceptance.',
      },
    ],
  },
  {
    id: 'contact',
    title: 'Contact Us',
    blocks: [
      {
        type: 'paragraph',
        text: 'GoSource, Independent Purchasing Company.',
      },
      {
        type: 'emails',
        prefix: 'Email:',
        addresses: ['support@gosource.app', 'dpo@gosource.app'],
      },
    ],
  },
];

export const privacyPolicyNav = buildLegalNav(privacyPolicySections);
