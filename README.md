# Clinic OS — Advanced Clinic Management System

[![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Bavly-Hamdy/Clinic_OS/blob/main/LICENSE)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-v9+-FFCA28?logo=firebase)](https://firebase.google.com/)

**Clinic OS** is a high-performance, bilingual clinical management solution designed to streamline medical practices. It provides a seamless, professional experience for doctors, receptionists, and patients through a modern, glassmorphic UI and real-time data synchronization.

---

## 🌟 Key Features

### 🩺 Professional Doctor's Workspace
*   **Prescription Builder**: Intelligent drug entry with localized dosage, frequency, and timing options.
*   **Clinical Sessions**: Dedicated space for chief complaints, diagnosis, and clinical notes.
*   **Vital Signs Tracking**: Real-time recording and history tracking of patient vitals.
*   **Drug Allergy Alerts**: Automatic cross-referencing of prescribed drugs against known patient allergies.

### 📋 Intelligent Queue Management
*   **Live Tracking**: Real-time patient queue with "Call Next" functionality.
*   **Dual-Role Support**: Specialized interfaces for Doctors and Receptionists to manage patient flow efficiently.
*   **Patient Status**: Visual indicators for Waiting, In-Clinic, and Completed sessions.

### 🤖 AI-Powered Drug Autocomplete
*   **Gemini AI Integration**: Leverages Google's Gemini Pro to provide instant suggestions for medicine names and standard concentrations.
*   **Hybrid Search**: Combines a local drug dictionary with AI fallback for rare medications.

### 🌍 Professional Bilingual Support
*   **Full Localization**: Complete Arabic and English interfaces with professional medical terminology.
*   **RTL Optimization**: Pixel-perfect layout for Arabic users, including date formatting and directionality.

### 📊 Advanced Analytics & Finance
*   **Revenue Tracking**: Visual dashboard for monitoring clinic income and expenses.
*   **Financial Reports**: Detailed "Shift Close" reports with PDF export capabilities.

### 🖨️ Customizable Prescription Printing
*   **Stationery Ready**: Designed to print on official clinic stationery with reserved header/footer space.
*   **Clean Layout**: Professional formatting with clear instructions for patients.

---

## 🚀 Tech Stack

*   **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Shadcn UI.
*   **State Management**: React Query (TanStack Query).
*   **Backend**: Firebase (Firestore, Authentication, Hosting).
*   **AI Engine**: Google Gemini API.
*   **Language & RTL**: i18next, date-fns/locale.
*   **Animations**: Framer Motion, Tailwind Animate.

---

## 🛠️ Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Bavly-Hamdy/Clinic_OS.git
    cd Clinic_OS
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env.local` file and add your Firebase and Gemini API credentials:
    ```env
    VITE_FIREBASE_API_KEY=your_key
    VITE_FIREBASE_AUTH_DOMAIN=your_domain
    VITE_FIREBASE_PROJECT_ID=your_id
    VITE_FIREBASE_STORAGE_BUCKET=your_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    VITE_GEMINI_API_KEY=your_gemini_key
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

---

## 👨‍💻 Author

**Bavly Hamdy**
*   [GitHub](https://github.com/Bavly-Hamdy)
*   [LinkedIn](https://www.linkedin.com/in/bavly-hamdy/)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
