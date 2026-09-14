# HydroReminder 💧

> **HydroReminder** is a modern, offline-first personal water tracker and smart reminder Android mobile application built with React Native and Expo.

---

## 🌟 Key Features

- **Circular Hydration Dial**: Real-time visualization of daily intake against your custom hydration goal.
- **Quick Logging**: Single-tap volume presets (+100 ml, +200 ml, +250 ml, +500 ml) or custom amounts.
- **Dual Reminder Engine**:
  - **Fixed Interval Mode**: Automatically generates chronological reminders from wake time to bedtime with configurable intervals (15m, 30m, 45m, 60m, 90m, 120m).
  - **Custom Times Mode**: Add, edit, toggle, and delete independent reminders with customized volumes.
- **100% Offline & Private**: Powered by local SQLite database storage (`expo-sqlite`). No user accounts, cloud dependencies, or internet required.
- **Hydration History**: 7-day visual progress chart and detailed drink logs.
- **Customizable**: Set daily water goal, switch measurement units (`ml` / `L`), configure dark/light theme, and adjust sound and notification preferences.

---

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (file-based tab routing)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Local Database**: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Target Platform**: Android Phone

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo Go on your Android phone or Android Studio emulator

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/KAVIRAJ-27/Water-Remainder.git
   cd Water-Remainder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

4. Scan the QR code using the **Expo Go** app on your Android smartphone.

---

## 📱 Project Structure

```text
src/
├── app/                  # Expo Router tab routes & layouts
│   ├── (tabs)/           # Bottom navigation tabs (Home, Reminders, History, Settings)
│   ├── onboarding.tsx    # First-time user setup
│   └── _layout.tsx       # Root layout & theme provider
├── components/           # Reusable UI components & dashboard cards
├── database/             # SQLite schema, tables & repository operations
├── services/             # Notification service interfaces
├── store/                # Zustand stores (user, water, reminders)
├── types/                # TypeScript interfaces & types
└── utils/                # Date, time & scheduling utility functions
```

---

## 📄 License

MIT License
