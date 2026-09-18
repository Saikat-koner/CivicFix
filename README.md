<div align="center">

# 🛡️ CivicFix (नागरिक समाधान)
### *Next-Generation Civic Infrastructure Reporting, Severity Triage & Hearing Escalation Platform*

[![Flutter Web](https://img.shields.io/badge/Flutter-Web%20Ready-02569B?style=for-the-badge&logo=flutter&logoColor=white)](https://flutter.dev)
[![Dart](https://img.shields.io/badge/Dart-3.13+-0175C2?style=for-the-badge&logo=dart&logoColor=white)](https://dart.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime%20Postgres-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![OpenStreetMap](https://img.shields.io/badge/OpenStreetMap-Nominatim%20Geocoding-7EBC6F?style=for-the-badge&logo=openstreetmap&logoColor=white)](https://www.openstreetmap.org)
[![Zero Lint](https://img.shields.io/badge/Linter-0%20Issues-brightgreen?style=for-the-badge&logo=codefactor&logoColor=white)](https://dart.dev/tools/linter-rules)
[![Tests Passing](https://img.shields.io/badge/Tests-100%25%20Passed-success?style=for-the-badge&logo=checkmarx&logoColor=white)](test/widget_test.dart)

---

### 🌐 [**Live Web Platform Demo**](https://saikat-koner.github.io/CivicFix/) &bull; 🚀 [**AI Studio Web Workspace**](https://civicfix-2.ai.studio)

</div>

---

## 📖 Overview

**CivicFix** is a full-stack, real-time civic infrastructure reporting and municipal management web platform. It connects citizens directly with municipal ward engineers to report, verify, track, and resolve urban hazards (such as open manholes, non-functional traffic lights, road cave-ins, and water leaks).

Unlike conventional reporting tools with subjective priority flags, **CivicFix solves the civic severity problem** using an algorithmic **5-Variable Composite Severity Scoring Engine** and an active **2-Hour Rapid On-Site Survey Framework**.

---

## 🧮 1. The Severity Scoring Engine (How Issues Are Prioritized)

CivicFix determines issue severity mathematically rather than arbitrarily. Every ticket is assigned a deterministic score from **0.0 to 100.0**:

$$\text{Severity Score} = (W_{\text{cat}} \times 0.35) + (W_{\text{urgency}} \times 0.25) + (W_{\text{affected}} \times 0.15) + (W_{\text{community}} \times 0.15) + (W_{\text{time}} \times 0.10) + \text{GroundModifier}$$

```
+---------------------------------------------------------------------------------------------------+
|                                  CIVICFIX COMPOSITE SEVERITY FORMULA                              |
+---------------------------------------------------------------------------------------------------+
|  [Category Base Weight]     x  0.35  -->  (e.g., Open Manhole = 95, Pothole = 70, Parking = 30)   |
|  [Citizen Urgency Rating]   x  0.25  -->  (Level 1-5 scale normalized to 20% - 100%)              |
|  [Affected Population]      x  0.15  -->  (1 to 500+ citizens normalized to 0.2% - 100%)          |
|  [Community Upvotes]        x  0.15  -->  (0 to 100+ public verifications normalized)             |
|  [Aging Decay Factor]       x  0.10  -->  (0 to 72h aging scale ensuring long-standing escalation)|
|  + [Ground Audit Modifier]          -->  (-10.0 to +45.0 pts from 2-Hour Rapid Citizen Audits)   |
+---------------------------------------------------------------------------------------------------+
|  = FINAL SEVERITY SCORE (0.0 - 100.0) --> Mapped directly to Statutory SLAs (S1 - S5)            |
+---------------------------------------------------------------------------------------------------+
```

### Statutory SLA Mapping & Response Tiers

| Tier | Severity Score | Classification | Statutory Resolution SLA | Color Code |
| :---: | :---: | :--- | :---: | :---: |
| **S5** | $80.0 - 100.0$ | **Critical / Life-Threatening Emergency** | **4 Hours** | 🔴 Crimson |
| **S4** | $65.0 - 79.9$ | **High Priority Structural Disruption** | **12 Hours** | 🟠 Deep Orange |
| **S3** | $50.0 - 64.9$ | **Moderate Civic Inconvenience** | **48 Hours** | 🟡 Amber |
| **S2** | $35.0 - 49.9$ | **Low Priority / Minor Wear** | **7 Days** | 🔵 Indigo |
| **S1** | $0.0 - 34.9$ | **Minimal / Informational** | **14 Days** | 🟢 Teal |

---

## ⚡ 2. Core Features & Capabilities

### ⏱️ 2-Hour Rapid On-Site Survey Framework
- When a new civic hazard is logged, a **120-minute active rapid survey countdown** starts on the ticket.
- Nearby citizens can conduct an on-site audit to inspect hazard levels (Minimal to Lethal), road closures (None, Partial, Full), and proximity to schools/hospitals.
- Submitting an audit recalibrates the ticket score with ground-truth accuracy ($-10$ to $+45$ pts) and rewards the citizen with **+50 XP**.

### 🗺️ OpenStreetMap with Automated Reverse Geocoding
- Real-time GPS location auto-detection.
- Interactive map pin selection with OpenStreetMap Nominatim reverse geocoding into human-readable Indian street addresses.
- Cluster map view displaying colored hazard pins corresponding to S1–S5 severity levels.

### 🏛️ Escalation Hearing Booking System
- If a ticket breaches its statutory SLA or remains unresolved, citizens can book direct virtual or in-person escalation hearings with municipal ward officers.

### 🏆 Citizen Reputation & Gamified Leaderboard
- Citizen progression tiers:
  - 💎 **Diamond Guardian** (500+ XP)
  - 🥇 **Gold Warden** (250+ XP)
  - 🥈 **Silver Inspector** (100+ XP)
  - 🥉 **Bronze Scout** (50+ XP)
  - 🛡️ **Active Citizen** (<50 XP)
- 6 milestone achievement badges celebrating rapid triage, first reports, and resolved issues.

### 📊 Municipal Admin Control Room
- Real-time KPI summaries: Total Reports, Active Rapid Survey Queue, S5 Critical Triage, Resolved Tickets.
- Triage priority filter streams: ⚡ *Rapid Survey Active*, 🚨 *Highest Severity*, ⏳ *Overdue SLA*, 🕒 *Newest*.
- Verified state machine transitions: `pending` $\rightarrow$ `in_progress` $\rightarrow$ `resolved_by_worker` $\rightarrow$ `community_verified`.

---

## 🏗️ Technical Architecture

```
                                  +-----------------------+
                                  |   Flutter Web Client  |
                                  |   (Material 3, PWA)   |
                                  +-----------+-----------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
         [Realtime / REST]                                     [HTTP Geocoding]
                     v                                                 v
        +-------------------------+                      +--------------------------+
        |     Supabase Backend    |                      | OpenStreetMap Nominatim  |
        |  - Postgres Database    |                      |  - Reverse Geocoding     |
        |  - Realtime Streams     |                      |  - Place Search API      |
        |  - Storage (Web Binary) |                      +--------------------------+
        |  - Row Level Security   |
        +-------------------------+
```

---

## 🚀 Getting Started & Local Development

### Prerequisites
- [Flutter SDK](https://docs.flutter.dev/get-started/install) (3.13.2 or higher)
- Chrome / Edge browser for Web development
- Git

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Saikat-koner/CivicFix.git
   cd CivicFix
   ```

2. **Install Flutter packages**:
   ```bash
   flutter pub get
   ```

3. **Run Unit Tests**:
   ```bash
   flutter test
   ```

4. **Verify Static Code Analysis**:
   ```bash
   flutter analyze
   ```

5. **Launch Flutter Web Application**:
   ```bash
   flutter run -d chrome
   ```

---

## 📦 Supabase Database Setup

Run the SQL migration script located in `D:\e drive everything\ClaudeWorkspace\civicfix-migration.sql` or `civicfix-migration.sql` inside your **Supabase Dashboard $\rightarrow$ SQL Editor** to initialize:
- `issues` (with severity scores, SLA breach triggers, and category weights)
- `categories` (14 bilingual hazard categories with base weights)
- `officer_appointments` (escalation hearing schedules)
- `issue_upvotes`, `issue_comments`, `issue_verifications`, and `issue_recurrences`
- Realtime replication & Row Level Security (RLS) policies.

---

## 🌐 Web Deployment

### Automated GitHub Pages Deployment (CI/CD)
This repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`). Any push to `main` automatically runs tests, builds the web application, and deploys it live to **GitHub Pages**.

To enable GitHub Pages in your fork:
1. Go to **Settings $\rightarrow$ Pages**.
2. Set **Source** to **GitHub Actions**.

### Manual Production Build
```bash
flutter build web --release --base-href "/CivicFix/"
```
The output files in `build/web/` can be hosted on any static hosting provider (GitHub Pages, AI Studio, Vercel, Firebase Hosting, Netlify, or Cloudflare Pages).

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
