# EigenCrush: Harmonic ODE Arena

> **Real-Time Multiplayer Classroom Physics Game for Mechanical Resonance & Differential Equations**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![WebSockets](https://img.shields.io/badge/WebSockets-Real--Time-blue)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![Web Audio API](https://img.shields.io/badge/Web_Audio_API-Synthesizer-orange)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

EigenCrush is an interactive, full-stack STEM educational web application designed for engineering, physics, and calculus classrooms. It transforms complex 2nd-order Ordinary Differential Equations (ODEs) into a synchronized 2-minute competitive game where students calculate and pulse resonant eigenfrequencies to shatter structures.

---

## 🌟 Key Features

### 1. Dual-Screen Classroom Architecture
- **Host Projector Dashboard**: Displayed at the front of the classroom. Features a synchronized 2-minute match countdown timer, real-time structural deformation canvas, live podium leaderboard, audio synthesis, and an on-screen QR code for instant student onboarding.
- **Student Mobile Controller**: Optimized for smartphones (iOS Safari, Android Chrome). No account creation required—students simply select a callsign and avatar, adjust precision frequency sliders, trigger harmonic pulses with haptic feedback, and view differential equation hints.

### 2. Physics & ODE Simulation Engine
- **Governing Differential Equation**:
  $$m \frac{d^2x}{dt^2} + c \frac{dx}{dt} + k x = F_0 \cos(\omega t)$$
- **Natural Resonant Frequency**:
  $$f_n = \frac{1}{2\pi} \sqrt{\frac{k}{m}}$$
- **10 Scaled Engineering Challenges**: Spans three difficulty tiers (Easy, Moderate, Difficult) covering cantilever beams, tuned-mass dampers, suspension bridges, seismic foundations, and aircraft flutter.
- **Multi-Pulse Mechanics**: Models physical damping ratios—requiring consecutive coherent pulses to crack and shatter structures.

### 3. Gamification & Pedagogical Feedback
- **Live Classroom Leaderboard**: Real-time scoring balancing speed, accuracy, and stage completion.
- **Interactive Post-Match Review**: Complete 10-stage solution key with formulas, derivations, and step-by-step physical parameters.
- **Historical Persona Badges**: Assigns personalized mathematician/physicist profiles (e.g., Fourier, Euler, Rayleigh, Chladni) based on student calculation habits.

### 4. Resilient Real-Time Infrastructure
- Low-latency bi-directional WebSocket state broadcasting with automatic HTTP fallback synchronization.
- Cross-platform iOS Safari storage optimization bypassing third-party cookie restrictions for seamless camera QR scanning.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Motion (Framer Motion)
- **Visualization & Audio**: HTML5 Canvas (Dynamic Standing Wave & Eigenmode Rendering), Web Audio API (Frequency Synthesizer)
- **Backend & Real-Time**: Node.js, Express, WebSocket (`ws`)
- **Build Tooling**: Vite, esbuild

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/eigencrush-resonance.git

# Navigate into the project directory
cd eigencrush-resonance

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 📱 Accessing Roles

- **Host (Projector) Screen**: `http://localhost:3000/?host=true`
- **Student Mobile View**: `http://localhost:3000/?student=true`
- **Side-by-Side Testing Mode**: `http://localhost:3000/?split=true`

---

## 📄 License

MIT License. Open-source educational software.
