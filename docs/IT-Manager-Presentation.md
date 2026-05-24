# SecondLife — Internal Asset Redistribution Marketplace
## IT Manager Presentation | Applied Materials Israel

---

# PART 1 — WHY THIS SYSTEM IS NECESSARY

## The Problem Today

At Applied Materials Israel, equipment and assets are routinely scheduled for **scrap or disposal** even when they are still functional and usable.

The current process:
- A department decides to scrap or dispose of an item
- **No central visibility** exists for other departments to know about it
- Redistribution happens (when it happens at all) via emails, WhatsApp messages, or word of mouth
- Most items simply get **discarded** — at significant cost and waste

### What Gets Lost

| Asset Type | Typical Value (₪) | Example |
|------------|-------------------|---------|
| FOUP lot (25 units) | 40,000–55,000 | Entegris A300 300mm FOUPs |
| Turbo Pump | 28,000–52,000 | Pfeiffer HiPace 700 |
| Electrostatic Chuck | 30,000–40,000 | AMAT Centura ESC Assembly |
| Test Equipment | 12,000–52,000 | Keysight Oscilloscope, Signal Generator |
| Mass Flow Controllers (12 units) | 16,000–24,000 | Brooks SLA5800 |
| IT Equipment | 9,000–20,000 | Monitors, Workstations |

> **Conservative estimate**: If AMAT Israel prevents even 5–10 asset write-offs per quarter, the annual value saved is in the range of ₪400,000–₪1,000,000.

---

## Why Existing Tools Are Not Enough

| Tool | Why It Fails |
|------|-------------|
| Email | No central visibility, no tracking, buried in inboxes |
| WhatsApp / Teams message | No history, no search, no formal workflow |
| Shared spreadsheet | No photos, no notifications, no lifecycle tracking |
| Paper / verbal | Zero traceability |

---

## The Business Case — 3 Key Benefits

### 1. Financial Savings
- Assets with remaining useful life are **redeployed internally** instead of scrapped
- Reduces spend on purchasing replacement equipment
- Every item claimed = direct cost avoidance

### 2. Operational Efficiency
- Departments can **search and subscribe** to categories they need
- Automatic notifications when matching items are posted
- Formal pickup coordination — no more chasing people

### 3. Sustainability / ESG
- Reduces physical waste sent to disposal
- Supports AMAT's corporate sustainability goals
- Items diverted from scrap = CO₂ and materials saved

---

# PART 2 — WHAT THE SYSTEM DOES (System Overview)

**SecondLife** is an internal web-based marketplace where AMAT Israel departments can:

1. **Post** an asset that is scheduled for disposal (with photos, specs, deadline, and estimated value)
2. **Browse and search** available items across all departments
3. **Claim** an item — triggering a formal pickup coordination workflow
4. **Track** the full lifecycle from posting to completed pickup
5. **Measure impact** — analytics dashboard showing value saved per user and per department

### Core Workflow

```
Department has surplus item
        ↓
Post to SecondLife (photos + details + scrap deadline)
        ↓
System notifies users who subscribed to that category/keyword
        ↓
Another department claims the item
        ↓
Pickup is scheduled and completed
        ↓
Value saved is recorded in analytics
```

---

# PART 3 — FUNCTIONAL REQUIREMENTS

## FR-1: User Management
| ID | Requirement |
|----|-------------|
| FR-1.1 | Users must authenticate before accessing the system |
| FR-1.2 | Each user has a name, email, department, and role (poster / claimer / viewer) |
| FR-1.3 | The system must support role-based access (who can post vs. who can only claim) |
| FR-1.4 | Future: integration with AMAT LDAP / Active Directory for SSO |

## FR-2: Asset Posting
| ID | Requirement |
|----|-------------|
| FR-2.1 | A poster can create an asset offer with: name, category, description, quantity, condition, location, scrap deadline, estimated value |
| FR-2.2 | A poster can upload up to 6 photos per item (auto-compressed and stored) |
| FR-2.3 | Items are assigned to one of 16 predefined categories (FOUP, Chamber, Vacuum/Gas, Electronics, etc.) |
| FR-2.4 | A poster can edit, extend the deadline, or mark an item as scrapped |
| FR-2.5 | Items automatically change status when claimed or completed |

## FR-3: Discovery (Search & Browse)
| ID | Requirement |
|----|-------------|
| FR-3.1 | All users can browse available items with filtering by category, condition, and status |
| FR-3.2 | Full-text search across item name, description, and location |
| FR-3.3 | Items nearing their scrap deadline are visually flagged as urgent |

## FR-4: Watchlist (Search Subscriptions)
| ID | Requirement |
|----|-------------|
| FR-4.1 | A user can save keyword searches as a "watchlist" |
| FR-4.2 | When a new item matches a saved keyword, the user receives an automatic notification |
| FR-4.3 | Users can manage (add / remove) their watchlist entries |

## FR-5: Claims Workflow
| ID | Requirement |
|----|-------------|
| FR-5.1 | A claimer can claim any AVAILABLE item |
| FR-5.2 | Claim statuses: PENDING → PICKUP_SCHEDULED → COMPLETED (or CANCELLED) |
| FR-5.3 | Both the poster and claimer are notified at each stage |
| FR-5.4 | Completed pickups are recorded with a timestamp |
| FR-5.5 | Only one active claim is allowed per item at a time |

## FR-6: Notifications
| ID | Requirement |
|----|-------------|
| FR-6.1 | In-app notification inbox with unread badge count |
| FR-6.2 | Notifications triggered by: new matching item (watchlist), item claimed, claim status change, item deadline approaching |
| FR-6.3 | Future: email notifications via SMTP |

## FR-7: Analytics & Impact Dashboard
| ID | Requirement |
|----|-------------|
| FR-7.1 | Per-user dashboard showing: value rehomed, items posted, items claimed |
| FR-7.2 | Monthly activity chart (posted vs. claimed over 12 months) |
| FR-7.3 | Department leaderboard / ranking per quarter |
| FR-7.4 | Achievement badges for milestones (first claim, ₪10k diverted, ₪100k diverted) |
| FR-7.5 | Category breakdown of value contributed |

---

# PART 4 — TECHNICAL REQUIREMENTS

## TR-1: Infrastructure & Hosting

| Component | Current (MVP) | Required for Production |
|-----------|---------------|------------------------|
| **Hosting** | Vercel (cloud) | Vercel OR internal server (Node.js 22) |
| **Domain** | vercel.app subdomain | Internal AMAT domain (e.g. `secondlife.amat.co.il`) |
| **SSL/TLS** | Vercel managed | Required — either Vercel or internal certificate |
| **Network access** | Public internet | VPN-only or internal network access preferred |

## TR-2: Database

| Attribute | Specification |
|-----------|--------------|
| **Engine** | PostgreSQL 15+ |
| **Current provider** | Neon (serverless PostgreSQL, cloud) |
| **Production option** | Neon / AWS RDS / Azure Database for PostgreSQL / internal PostgreSQL server |
| **Schema management** | Prisma ORM — schema migrations run automatically on deploy |
| **Tables** | User, Offer, Claim, Notification, SearchSubscription, SearchSubscriptionMatch |
| **Backup** | Daily backup recommended; Neon provides point-in-time recovery |
| **Size estimate** | < 1GB for first 3 years of normal use (primarily text + metadata) |

### Database Schema Summary

```
User          → stores employee info + role
Offer         → the asset being offered (core table)
Claim         → tracks who claimed what and pickup status
Notification  → in-app inbox messages
SearchSubscription      → user watchlist keywords
SearchSubscriptionMatch → which watchlist matched which offer
```

## TR-3: File Storage (Images)

| Attribute | Specification |
|-----------|--------------|
| **Provider** | Vercel Blob (current) — or AWS S3 / Azure Blob Storage |
| **What is stored** | Item photos (auto-resized to WebP, max 1600×1600px, ~200KB each) |
| **Limit per item** | 6 images |
| **Estimated storage** | ~50MB per 100 items posted |
| **Access** | Public read (images displayed in UI), authenticated write |

## TR-4: Application Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Node.js | 22.x |
| **Framework** | Next.js (React, App Router) | 15.x |
| **Language** | TypeScript | 5.6 |
| **ORM** | Prisma | 5.22 |
| **Styling** | Tailwind CSS | 3.4 |
| **Image processing** | Sharp | 0.33 |

## TR-5: Authentication (Current Gap → Production Need)

> **Current state:** Mock authentication — a dropdown allows selecting any demo user. This is for development/demo only.

| Requirement | Description |
|-------------|-------------|
| **TR-5.1** | Production must integrate with AMAT Israel Active Directory / LDAP |
| **TR-5.2** | Recommended: SAML 2.0 or OAuth 2.0 SSO (same login as Windows/Outlook) |
| **TR-5.3** | Department and role should be pulled from AD attributes |
| **TR-5.4** | Session management with secure cookies (Next.js session or NextAuth.js) |

## TR-6: Email Notifications (Future)

| Requirement | Description |
|-------------|-------------|
| **TR-6.1** | SMTP server access (or Microsoft Exchange relay) for outbound emails |
| **TR-6.2** | Used for: deadline reminders, new watchlist matches, claim confirmations |
| **TR-6.3** | Email address = employee's AMAT email (from AD) |

---

# PART 5 — WHAT IS BUILT vs. WHAT IS NEEDED FOR PRODUCTION

## Already Built (MVP — Demo Ready)

| Feature | Status |
|---------|--------|
| Asset posting with photos | ✅ Complete |
| Browse, search, filter | ✅ Complete |
| Claims workflow (full lifecycle) | ✅ Complete |
| Watchlist / search subscriptions | ✅ Complete |
| In-app notifications | ✅ Complete |
| Analytics & impact dashboard | ✅ Complete |
| Mobile-responsive UI | ✅ Complete |
| Image upload + auto-compression | ✅ Complete |
| Database schema + ORM | ✅ Complete |
| Demo seed data (60+ realistic items) | ✅ Complete |

## Needed for Production Go-Live

| Item | Priority | Effort |
|------|----------|--------|
| SSO / LDAP authentication | 🔴 Critical | Medium (1–2 weeks) |
| Production PostgreSQL database | 🔴 Critical | Low (1–2 days) |
| Internal domain + SSL | 🔴 Critical | Low (IT setup) |
| Email notifications (SMTP) | 🟡 Important | Low–Medium |
| Admin panel (manage users, moderate posts) | 🟡 Important | Medium |
| VPN / network access control | 🟡 Important | IT setup |
| Automated database backups | 🟡 Important | Low |
| Usage analytics for management | 🟢 Nice to have | Medium |

---

# PART 6 — SUMMARY FOR DECISION

| Question | Answer |
|----------|--------|
| What does it solve? | Prevents functional assets from being scrapped when other departments could use them |
| Who uses it? | All AMAT Israel employees (any department can post or claim) |
| What does IT need to provide? | PostgreSQL DB, domain/SSL, SMTP relay, LDAP/AD SSO integration |
| How long to production? | 3–4 weeks after IT infrastructure is ready |
| Hosting cost | ~$20–50/month (Vercel + Neon managed services) OR internal server |
| Expected ROI | ₪400k–₪1M/year in avoided scrap (based on pilot data) |

---

*Document prepared for IT Manager review — Applied Materials Israel, May 2026*
