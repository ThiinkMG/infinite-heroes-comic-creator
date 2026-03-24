# Infinite Heroes: AI-Powered Comic Creator 🦸‍♂️📖

**Infinite Heroes** is a state-of-the-art interactive web application that leverages Google's Gemini Models to help users create, manage, and read their own custom comic book series. From character design to page-by-page story generation, Infinite Heroes automates the complex comic creation pipeline while keeping the user in the creative driver's seat.

![Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## 🚀 Key Features

- **Custom Cast Building**: Generate character visual profiles using AI or upload your own portraits.
- **Strict Visual Consistency**: Multi-layered prompt enforcement ensures characters and art styles remain consistent across every page.
- **Two Creative Modes**:
  - **Novel Mode**: Interactive choice-based generation. Influence the story at every turn.
  - **Outline Mode**: AI crafts a full 10-20 page plot for your review before automating the entire issue.
- **Rich Configuration**: Support for various genres (Sci-Fi, Noir, Fantasy, etc.), art styles, and multiple languages.
- **Native Comic Reader**: Read your creations directly in-app with zoom and pan controls.
- **Export & Share**: Professional PDF export with custom cover overlays and branding.

## 🛠️ Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- A [Google Gemini API Key](https://ai.google.dev/)

### Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/infinite-heroes-comic-creator.git
   cd infinite-heroes-comic-creator
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ADMIN_PASSWORD=your_admin_password_here
   ```

4. **Launch the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

## ☁️ Deployment (Vercel)

This project is optimized for [Vercel](https://vercel.com). To deploy:

1. Connect your GitHub repository to Vercel.
2. In the Vercel Project Settings, add the following **Environment Variables**:
   - `GEMINI_API_KEY`: Your Google AI Studio key.
   - `ADMIN_PASSWORD`: Your desired admin dashboard password.
3. Vercel will automatically detect the Vite project and deploy from the `dist` directory.

## 🎨 Credits & Contributors

- **Vision & Strategy**: Thiink Media Graphics ([thiinkmedia.com](https://thiinkmedia.com))
- **Lead Developer**: Antigravity AI
- **Powered By**: Google Gemini 2.5 Pro & Gemini 3 Pro (Experimental)

---
*Built with React, Vite, and ❤️ for comic book lovers everywhere.*
