# GoSource Product Requirements Document (PRD)

| Field | Value |
| --- | --- |
| **Author** | Chris Anyikamadu |
| **Status** | Draft |
| **Version** | 2.1 |
| **Date** | May 2026 |
| **Reviewers** | Lanre Bello, Essien Ekanem |

**Product type:** B2B procurement platform with embedded working capital **(Phase B — after core MVP validation).**

**Surfaces:** Customer Web App, Admin Web App, Public API

**Rebuild baseline:** This PRD guides a **greenfield rebuild** of the legacy reference implementations under `reference/gosource-web-app` (customer), `reference/gosource-admin-v2` (admin), and `reference/gosource-api` (backend). New implementations should match **functional parity** with reference unless a phase explicitly defers a capability.

---

## Document changes (v2.1)

- Resolved **credit vs MVP** contradiction via explicit **Phase A / Phase B** delivery.
- Defined **MVP approvals** (optional single-step) vs deferred advanced governance.
- Separated **customer procurement requests / orders** from **admin inbound purchase orders** (stock replenishment).
- Scoped **admin dashboard** to minimum widgets for Phase A.
- Clarified **wallet**: optional balance storage; checkout may use wallet and/or external rails without mandatory prefunding.
- Split **Public API** into Phase A externally supported vs internal-only surfaces.
- Added **glossary**, **MVP boundary table**, **metric definitions**, and **procurement request lifecycle**.

---

## 1. Executive Summary

GoSource is a procurement platform for multi-branch small and medium-sized businesses (SMBs). It enables businesses to discover products, manage procurement across teams and branches, complete purchases through **wallet and/or external payment rails**, track fulfillment, and—**after Phase A validation**—access **trade credit** with structured repayment.

The platform centralizes procurement into a single system that supports:

- Product discovery and ordering  
- Procurement execution workflows (**including optional lightweight approvals in Phase A**)  
- Order tracking and fulfillment visibility  
- Wallet-based payments and transaction history  
- **Phase B:** Embedded trade credit for working capital  

GoSource is designed for businesses where procurement is distributed across staff, requires oversight, and needs financial traceability.

---

## 2. Product Overview

GoSource is a **branch-aware** procurement platform built for SMBs with recurring inventory and operational purchasing needs.

The platform enables businesses to:

- Discover and purchase products  
- Manage procurement across branches and teams  
- Track operational purchasing activity  
- Maintain visibility into orders and payments  
- Support repeat procurement workflows  

GoSource replaces fragmented procurement coordination (WhatsApp, spreadsheets, manual approvals, phone calls, paper invoices) with a centralized workflow designed for **procurement control** and **financial visibility**.

### 2.1 Three layers

1. **Procurement & commerce** — Product discovery, ordering, fulfillment, reorder workflows.  
2. **Operational control** — Branch-aware visibility, role-based access, purchasing governance (lightweight in Phase A).  
3. **Financial infrastructure** — Wallet, payments, reconciliation; **Phase B:** procurement-linked credit.

### 2.2 Problem statement

Multi-branch SMBs often manage procurement through fragmented offline and semi-digital workflows. That drives:

- No centralized visibility into branch-level spending  
- Uncontrolled or unauthorized staff purchases  
- Inconsistent pricing across branches and suppliers  
- Slow, informal approval processes  
- Weak inventory coordination across locations  
- Limited audit trails  
- Difficulty tracking financial obligations tied to purchases  
- Fragmented reconciliation across payments and orders  

Existing B2B commerce platforms often stop at discovery and ordering. GoSource adds **governance**, **branch context**, and **financial traceability**—and **Phase B** adds **behavior-linked credit**.

---

## 3. Product strategy & positioning

GoSource is positioned as the **procurement operating system** for multi-branch SMBs. Core value is **procurement control** across teams, branches, and workflows—not discovery alone.

**Wedge:** Employee-initiated activity, visible approval states (when enabled), branch-level context, wallet/payment tracking, procurement-linked data for future credit.

### 3.1 Product principles

- Keep procurement fast.  
- Keep approval flows visible **when they exist**.  
- Keep financial actions auditable.  
- Keep the API as the system of record.  
- Keep the buyer experience simple.  
- Keep the product branch-aware from the start.  
- Optimize for repeat purchasing.  
- Make credit behavior-driven, not only form-driven (**Phase B**).

---

## 4. Target users

**Business types:** Restaurants, hotels, supermarkets/mini-marts, retail chains, wholesalers/distributors, SMBs with recurring inventory needs.

**Roles:** Business Owner, Branch Manager, Employee Buyer, Finance/Admin User, Operations Manager, Inventory Manager, **Credit Analyst (Phase B)**, Super Admin (platform/internal).

---

## 5. Product architecture & rebuild mapping

GoSource ships three surfaces:

| Surface | Users | Rebuild reference |
| --- | --- | --- |
| **Customer Web App** | Owners, managers, staff | `reference/gosource-web-app` |
| **Admin Web App** | Internal ops, catalog, finance | `reference/gosource-admin-v2` |
| **Public API** | Apps + integrations | `reference/gosource-api` |

### 5.1 Customer Web App

Used to sign up and log in; browse products; build cart; **create and manage procurement requests** where applicable; checkout and pay; fund wallet; **Phase B:** request/repay credit; track orders; manage branches, members, and lists; reorder.

### 5.2 Admin Web App

Used to manage **customer-facing orders**; products and inventory; **inbound purchase orders** (supplier/stock receiving); customers/businesses; promotions/discounts; **Phase B:** credit operations; users, roles, fees, settings; reporting.

### 5.3 Public API

**Authoritative** for authentication and permissions; business and branch data; catalog/inventory; **requests, carts, and orders**; wallet and payment events; **Phase B:** credit/repayment; accounting/ledger events; notifications; analytics/logs; jobs/automation.

---

## 6. System architecture (simplified)

### 6.1 Domain boundaries

- **Identity & Access** — Auth, roles, permissions, invitations, branch access  
- **Business & Branch** — Profiles, branches, member assignment  
- **Catalog** — Products, categories, pricing, availability  
- **Procurement** — **Requests**, cart, optional approval, path to order  
- **Orders & Fulfillment** — Lifecycle, tracking, invoices/receipts  
- **Wallet & Payments** — Funding, transactions, gateway reconciliation  
- **Credit (Phase B)** — Applications, limits, repayments, risk signals  
- **Accounting & Ledger** — Immutable financial records  
- **Notifications** — Email/SMS/push hooks  
- **Analytics & Logs** — Activity and ops reporting  
- **Jobs & Automation** — Async processing, retries  

### 6.2 Communication model

- **Synchronous:** Auth, browsing, cart/checkout actions, most admin reads/writes.  
- **Asynchronous:** Payment confirmations, notifications, ledger posts, reconciliation, retries.

**Principle:** Financial and state-changing operations must tolerate delays, retries, and duplicate events (**idempotency**).

### 6.3 Data ownership

- API is source of truth for business and financial state.  
- Frontends mirror UX only; **rules enforced server-side**.  
- Domain-owned bounded contexts.  
- Ledger entries immutable once written.  
- All state transitions validated at backend.

### 6.4 Reliability (SMB realities)

Design for unstable networks, delayed confirmations, duplicate webhooks, shared devices, concurrent orders/payments, partial third-party failures.

Requirements: idempotent financial ops, safe retries, recoverable workflows, consistent state.

### 6.5 Financial integrity

Wallet balances **derived from ledger** (or equivalent immutable postings)—no silent balance mutation without an auditable event. Operations idempotent, auditable, recoverable.

---

## 7. Core user journey

Users discover products, add to cart (often after or alongside a **procurement request**), and checkout. **If** the business enables approvals, a request or basket may need approval before payment. Payment uses wallet and/or external methods. Orders fulfill, track to completion; users reorder from history. **Phase B:** credit draw and repayment join the loop.

### 7.1 UX principles

- Optimized for non-technical SMB users.  
- Target **≤ 3 steps** for common actions where possible.  
- Reordering minimal friction.  
- Clear financial status feedback.  
- Persistent **branch context** in procurement flows.

### 7.2 Interaction principles

- Errors in plain language (what / why / how to fix).  
- Approval state explicit: pending / approved / rejected, reason when rejected.  
- Loading and empty states always purposeful.  
- Destructive actions require confirmation.

### 7.3 Usability requirements

Core tasks without formal training; business-friendly language; balances and transaction states visible; branch context visible; history accessible.

---

## 8. Scope, phasing & prioritization

### 8.0 Delivery phases (resolves MVP contradictions)

| Phase | Name | Goal |
| --- | --- | --- |
| **A** | **Core transactional MVP** | Validate onboarding → browse → request/cart → checkout → pay → fulfill → reorder; wallet + external pay; branch/member; admin orders/inventory/customers; inbound PO basics; no trade credit. |
| **B** | **Embedded finance & advanced governance** | Trade credit (apply, limit, draw, repay), richer analytics, multi-level approvals/thresholds/policies as needed. |

**Rebuild parity:** Engineering should track reference feature coverage in a separate checklist; Phase A intentionally **may omit** credit even if reference contained stubs—unless product mandates **parity-first** launch.

### 8.1 MVP boundary table (Phase A)

| Area | In Phase A | Deferred (Phase B+) |
| --- | --- | --- |
| Trade credit / repayments | No | Yes |
| Credit applications / limits | No | Yes |
| Approvals | Optional **single-step** (configurable per business) | Multi-level, thresholds, routing |
| Checkout payments | Wallet + external rails | — |
| Wallet funding mandatory | **No** — users may pay externally without prefunding wallet | — |
| Customer procurement request | Yes (create/edit/submit; approve/reject if enabled) | Advanced routing |
| Admin purchase order | Yes (create, receive, partial receive, status) | Supplier portal |
| Promotions / discounts | Baseline admin + customer application | Advanced campaigns |
| Public API exposure | See §9.3 | Full partner-facing analytics |

### 8.2 Phase A — Must have (P0)

**Customer Web App**

- Business registration and authentication (login, reset, OTP/verification as designed)  
- Branch setup; member invite/onboarding  
- Catalog browse, search, categories, product detail  
- Cart and checkout (coupons if in scope for parity)  
- **Procurement requests**: create, edit, submit; reject/approve **when business setting enabled**; visibility of status  
- Wallet: create, balance, funding rail (e.g. virtual account), transactions  
- Order creation, list, detail, timeline, invoice/receipt download  
- Reorder from history  
- Lists (create, manage, move items); branches; members (invite, roles visibility)  

**Admin Web App**

- Authenticated access  
- **Dashboard (minimum):** counts/links for **open orders**, **recent payment failures** (if detectable), **pending procurement requests** (if surfaced), shortcut to inventory — expand KPIs in P1  
- Order management (list, detail, operational actions aligned with API)  
- Product/inventory management (catalog, stock, categories as per parity)  
- Customer/business profile and activity  
- **Purchase orders**: create, line items, logistics cost, notify stakeholders, receive/partial receive, status, delete/cancel policies per API  
- Roles/users/settings baseline (RBAC, fees/security as scoped)  

**Backend / API (Phase A)**

- AuthZ, business/branch/members  
- Catalog, cart, **requests** (+ optional approval endpoints), orders  
- Wallet, payments, webhooks, idempotent handlers  
- Ledger/accounting hooks as required for wallet/payments  
- Inventory and admin PO domains  
- Notifications hooks (minimal); audit/event logging; job runner for async work  

### 8.3 Should have (P1)

- Recently purchased rails; richer search/filters  
- Transaction history search  
- Email/SMS notifications volume  
- Inventory reporting; order timeline polish  
- Role-aware dashboards  

### 8.4 Could have (P2)

- Smart reorder suggestions; low-stock alerts  
- Promotional campaigns depth  
- Loyalty; recommendations  
- Delivery ETA  
- Business health insights  

### 8.5 Deferred beyond Phase B planning (P3)

- Supplier portal; supplier analytics  
- Demand forecasting  
- Heavy personalization  

### 8.6 Phase A success criteria

Businesses can onboard, browse, complete checkout with **reliable payments**, track and reorder, operate **multi-branch**, and admins can run orders/inventory/customers and **inbound PO** flows. Platform maintains reconciliation discipline, inventory consistency, and traceable financial records.

---

## 9. Functional requirements (detailed scope)

### 9.1 Customer Web App

Aligned with reference rebuild:

| Area | Requirements |
| --- | --- |
| **Onboarding & access** | Registration, login/logout, reset, OTP/verification, invites, branch creation, profile/first-branch gates |
| **Discovery** | Categories, promotions rails, search, product detail, stock-aware UX |
| **Cart & checkout** | Cart sync (local/server), coupons, payment method selection (wallet, online, transfer per product strategy), delivery notes |
| **Procurement requests** | Request cart, edit floating/request mode, submit; manager/admin approve or reject with reason; tie-out to checkout |
| **Orders & tracking** | List, detail, timeline, invoice download, reorder |
| **Wallet** | Balance, virtual account/funding, transactions, search |
| **Lists / branches / members** | Lists CRUD/move items; branches HQ; members invite/activate/edit |
| **Credit (Phase B)** | Eligibility, apply, dashboard, top-up, repay, limits — **out of Phase A** |

### 9.2 Admin Web App

| Area | Requirements |
| --- | --- |
| **Dashboard** | Phase A minimum widgets (§8.2); expand later |
| **Orders** | Customer order ops, reference parity |
| **Inventory & catalog** | Products, categories, stock, reports/store count parity if required |
| **Customers** | Business detail: orders, wallet, branches; **Phase B:** credit tabs |
| **Purchase orders** | Distinct from **customer orders**: inbound replenishment, suppliers/officers, receive/mark-all-received, PDF preview/download where applicable |
| **Promotions & discounts** | Baseline parity |
| **Roles, users, settings** | RBAC, fees, security |
| **Credit ops** | **Phase B** |
| **Reporting** | Phase A basic filters/reports; deepen in P1+ |

### 9.3 Public API — Phase A exposure vs internal

**Partner / app MVP (expose with versioning & auth):**

- Identity, business, branch, members  
- Catalog, inventory reads/writes as needed by apps  
- Cart, requests, approval endpoints  
- Orders, wallet, payments  

**Primarily internal (same codebase, not necessarily public docs Day 1):**

- Deep ledger internals, job runners, raw analytics pipelines  

**Phase B:** Credit/repayment public surfaces; expanded webhooks for finance partners if needed.

### 9.4 Permissions & access control

RBAC; branch-scoped permissions; **Phase A:** optional single approver role or permission bit; Super Admin platform separation; financial ops protected.

---

## 10. Non-functional requirements

- **Security:** Strong auth, RBAC, encryption at rest/in transit for sensitive data, webhook verification, auditability.  
- **Reliability:** Idempotent payments, retries, consistent transitions.  
- **Performance:** Fast catalog; paginated admin tables; efficient filters.  
- **Maintainability:** Clear domain boundaries, reusable UI patterns, contract-tested APIs.  
- **Scalability:** Multi-tenant, multi-branch, growing transaction volume.

---

## 11. User stories

**Business Owner** — Cross-branch visibility; **when approvals enabled**, authorize purchases before payment; wallet/transparency; **Phase B:** credit oversight.

**Branch Manager** — Fast order and track; reorder; branch context.

**Employee Buyer** — Easy requests; visible approval/payment status.

**Admin & ops** — Single pane for orders, inventory, customers; traceability for disputes.

*(Stories assume Phase A request + optional approval; credit stories activate Phase B.)*

---

## 12. Platform & operational requirements

Secure auth/RBAC; branch-aware visibility; reliable payment reconciliation; ops visibility for wallet/orders/payments; inventory consistency under concurrency; responsive/mobile-friendly ops UX; scalable APIs; safe webhook handling; centralized reporting and audit.

---

## 13. Risks & dependencies

**Dependencies:** Payment gateways, wallet/virtual account providers, notification providers, fulfillment/supplier ops, catalog stewardship.

**Risks:** Delayed confirmations, fulfillment delays, inventory drift, scaling bottlenecks, low adoption vs offline habits, onboarding friction, duplicate payments.

**Mitigations:** Idempotency, audits, reconciliation workflows, phased feature rollout, simple onboarding.

---

## 14. Future expansion

Phase B credit; advanced approvals and budgets; supplier portal; recurring automation; forecasting; loyalty; accounting exports; health scoring.

---

## 15. Product direction (summary)

GoSource aims to be **procurement OS** for multi-branch SMBs: procurement + operational control + payments (**+ Phase B finance**).

---

## 16. Success metrics & definitions

| Metric | Definition / note |
| --- | --- |
| Onboarding completion | % businesses reaching “first successful branch + first member” or agreed milestone |
| Monthly active businesses | Distinct businesses with ≥1 meaningful session or order in period |
| Repeat purchase rate | % businesses with **≥2 paid orders** in rolling 30 days (tune window in analytics) |
| Checkout completion | Sessions reaching payment success / sessions reaching checkout |
| Reorder usage | % orders attributed to reorder flow |
| Payment success rate | Successful / initiated gateway attempts (exclude user-cancel where tracked) |
| Reconciliation accuracy | % wallet/gateway batches matching internal ledger expectations |
| Branch adoption | Avg branches with ≥1 order per active business |

Set numeric targets when baseline data exists.

---

## 17. Lifecycle definitions

### 17.1 Procurement request lifecycle (Phase A)

- **Draft** — Editable by creator  
- **Submitted** — Awaiting decision if approvals **on**; else eligible to proceed to checkout per rules  
- **Approved** — May proceed to payment/checkout  
- **Rejected** — Blocked; reason recorded  
- **Cancelled** — Withdrawn  

### 17.2 Order lifecycle

Draft → *(Pending approval if applicable)* → Approved → Paid → Processing → Fulfilled → Completed **or** Cancelled. Principles: no fulfillment before paid; terminal states completed/cancelled; status visible end-to-end.

### 17.3 Payment lifecycle

Pending / Successful / Failed — failed must not corrupt order/wallet state; traceable.

### 17.4 Approval lifecycle (when enabled)

Not required → Pending → Approved | Rejected. Rejected cannot pay. Approver visible.

### 17.5 Wallet transaction lifecycle

Pending / Successful / Failed — balance reflects successful only.

### 17.6 Admin purchase order lifecycle

Distinct from §17.2: PO states driven by **received quantities** (e.g. pending / partial / complete), inbound logistics, and receiving APIs.

---

## 18. Operational workflows

### 18.1 Procurement (Phase A)

Discover → add to cart and/or **request** → **optional approval** → checkout → pay → fulfill → complete → reorder.

### 18.2 Reorder

History → select prior order → adjust qty → standard checkout path.

### 18.3 Wallet funding

Initiate → provider processes → confirm → post ledger → balance/history update.

### 18.4 Disputes

Report → flag → internal review → refund/partial/deny → notify user.

### 18.5 Inbound purchase order (admin)

Create PO → notify stakeholders → receive stock (partial/all) → update inventory → close PO.

---

## 19. Conceptual data model

### 19.1 Core entities

- **Business**, **Branch**, **User** — As before; users scoped to business/branch with roles.  
- **Product**, **Category** — Catalog.  
- **Procurement request** — Branch-scoped basket/work item **before or alongside** order; holds lines, initiator, status, approvals.  
- **Cart** — Session/branch scoped aggregation for checkout.  
- **Order** — Customer-facing procurement outcome; lines, payment, fulfillment.  
- **Purchase order (admin)** — **Inbound** stock order to suppliers/internal fulfillment; **not** the same as customer order; lines, receivers, logistics amount.  
- **Payment**, **Wallet**, **Wallet transaction** — As §17.  
- **Approval decision** — Attached to request or pre-order state per implementation.  
- **Phase B:** Credit account, application, repayment schedules.

### 19.2 Relationships (summary)

Business → many Branches, Users, Wallet  
Branch → many Users, Requests, Orders  
Request → optional Approval → feeds/converts to checkout Order  
Order → Payment; many Order lines → Products  
Wallet → many Transactions  
Admin PO → suppliers/officers, lines, receipts → Inventory  

---

## 20. Glossary

| Term | Meaning |
| --- | --- |
| **Customer order** | SMB-facing sale/procurement outcome after checkout |
| **Procurement request** | Internal approval/unit of work before payment (when used) |
| **Purchase order (PO)** | Admin **inbound** replenishment document; receiving drives inventory |
| **Ledger entry** | Immutable financial posting backing balances |
| **Phase A / B** | Core transactional MVP vs finance/advanced governance |

---

## 21. Open questions

- Exact rules: when **request is mandatory** vs **direct checkout** allowed?  
- Single approver vs role-based approver pool in Phase A?  
- Which notification channels ship first (email vs SMS vs in-app only)?  
- Admin dashboard KPI sources if gateway failure signals are limited Day 1?  
- Phase B credit eligibility signals (transactional vs bureau)?  
- Regional payment methods per market?

---

## Appendix A — Reference rebuild checklist (non-exhaustive)

Use this to verify parity during rebuild:

- **Customer:** market rails, cart/request/edit-request, checkout methods, wallet VA, track orders, lists, branches, members, settings modal, auth flows  
- **Admin:** orders, inventory + categories + PO + store count/report, customers, promotions, discounts, roles/settings/fees, auth  
- **API:** modules mirroring domains in §6.1; webhook/idempotent payment handling  

---

*End of PRD*
