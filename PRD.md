# Product Requirements Document (PRD) - CodeLabs MVP

## 1. Project Vision & Overview
CodeLabs is a minimal, high-performance web application designed for software developers to practice typing real code snippets. Unlike standard typing tests that use prose, CodeLabs emphasizes syntax muscle memory, exact special character placement, and structural indentation patterns. 

The application operates in a distraction-free, IDE-like dark mode environment optimized for quick, iterative typing sessions.

## 2. Target Tech Stack
* **Frontend Framework:** React.js (Bootstrapped with Vite)
* **Styling:** Tailwind CSS (Utility-first styling), Radix UI (Accessible primitive components)
* **Backend & Database:** Supabase (PostgreSQL for user data, sessions, and snippets)
* **Authentication:** Supabase Auth (Email/Password or GitHub OAuth)
* **Hosting & Deployment:** Vercel

## 3. Core Typography & Layout Rules
* **Theme:** "Glacier Interface" dark mode aesthetic.
    * Background: Radial gradient transitioning from deep slate (`#1a2438`) at the top center to pure midnight blue (`#0a0e1a`).
    * Accent Color: Glacier blue (`#7dd3fc`) for active states, highlights, and the blinking cursor.
* **Typography:** * UI Elements: `Inter`
    * Code Elements: `JetBrains Mono`
* **Header Configuration:**
    * **Left:** Text branding `>_ CodeLabs` accompanied by a terminal icon.
    * **Center:** A subtle, glassmorphism pill button displaying the active code snippet name (Default: `Binary Search Algorithm`).
    * **Right:** Live session stats (`WPM: 0 | Acc: 100%`) alongside a minimalist profile avatar slot.
* **Typing Canvas:** * Completed Text: Displayed at full syntax brightness.
    * Upcoming/Untyped Text: Rendered at exactly 27% opacity.
    * Cursor: A glowing, blinking block-style cursor (`#7dd3fc`) with a subtle drop shadow (`shadow-[0_0_8px_rgba(125,211,252,0.8)]`).
* **Floating Action Bar (Footer):** Glassmorphism pill (`rgba(20, 28, 46, 0.6)` with a 12px backdrop blur) containing icon buttons for Restart, Sound, Settings, and a mobile-only keyboard toggle.

## 4. Functional Specifications & Mechanics

### A. The Typing Engine State
* **Strict Verification:** Input is tracked character-by-character against the target solution string. 
* **Hard-Lock Error Prevention:** If a user registers a typo, the cursor blocks progression and visually highlights the error. The user *must* utilize `Backspace` to correct the error before subsequent inputs are permitted.
* **IDE Emulation Features:** * Opening delimiters `(`, `{`, `[` must trigger auto-pairing.
    * Hitting `Enter` at block boundaries must automatically calculate and supply correct structural indentation.
* **Typing Modes:**
    * *Standard Overlay:* The active snippet is displayed at low opacity; characters are typed directly over it.
    * *Blind Mode:* The code block is hidden or hidden after an initial preview timer, forcing the developer to type the pattern entirely from structural memory and verify compilation accuracy at completion.

### B. Content & Data Management
* **Default State:** Upon direct site entry, the typing canvas must immediately render a clean, standard implementation of a **Binary Search Algorithm in Python**.
* **Supported Core Languages:** Python, C++, and Java.
* **Stat Logging:** At the conclusion of a snippet run, the application calculates Words Per Minute (WPM) and Accuracy percentage.

### C. Database & Security Controls
* **Tables:** Users Profile metadata, Snippet Collection repository, and Performance Log Session histories.
* **Security Constraint:** Enable Supabase Row Level Security (RLS) policies across performance ledger tables to ensure users can exclusively execute write/update operations matching their verified user authentication UID. This prevents client-side leaderboard manipulation.

## 5. Excluded Scope (Post-MVP)
* Custom external repository ingestion via GitHub API.
* Global live multiplayer matching.