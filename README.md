# Infinite Heroes: AI-Powered Comic Creator 🦸‍♂️💥📖

> **Transform your imagination into stunning comic book adventures!**

[![Live Demo](https://img.shields.io/badge/🚀_Try_It_Now-Live_Demo-blue?style=for-the-badge)](https://infinite-heroes-comic-creator.vercel.app/)
[![Powered by Gemini](https://img.shields.io/badge/Powered_by-Google_Gemini-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)

**Infinite Heroes** is your personal AI comic studio! Using Google's cutting-edge Gemini AI, create complete comic books with consistent characters, dynamic storytelling, and professional-quality art—all from your browser.

🎮 **[Try the Live Demo](https://infinite-heroes-comic-creator.vercel.app/)** — No installation required!

---

## ✨ What Makes It Special?

🎨 **AI-Generated Art** — Every panel is a unique masterpiece
🦸 **Character Consistency** — Your heroes look the same on every page
📖 **Two Story Modes** — Interactive choices OR automated full-comic generation
🌍 **Multiple Languages** — Create comics in English, Spanish, French & more
📱 **Mobile Friendly** — Create on any device
📥 **Export Ready** — Download as PDF or individual images

---

## 🖼️ See It In Action

### Create Your Hero
Upload a character portrait and watch the AI analyze it for perfect consistency across your comic!

<p align="center">
  <img src="assets/home-populated-app-screenshot.png" alt="Character Setup" width="700"/>
</p>

### Choose Your Adventure Mode

**🎭 Novel Mode** — Make choices that shape the story!
**📋 Outline Mode** — AI generates the full plot, you approve it!

<p align="center">
  <img src="assets/mode-select-app-screenshot.png" alt="Mode Selection" width="500"/>
</p>

### Watch Your Comic Come to Life

<p align="center">
  <img src="assets/novel-mode-image1-app-screenshot.png" alt="Novel Mode Reading" width="700"/>
</p>

### Interactive Decision Points
Your choices matter! Shape the narrative at key moments.

<p align="center">
  <img src="assets/novel-mode-image3-app-screenshot.png" alt="Interactive Choices" width="700"/>
</p>

### Regenerate & Perfect
Not happy with a panel? Reroll with custom instructions!

<p align="center">
  <img src="assets/reroll-app-screenshot.png" alt="Reroll Panel" width="600"/>
</p>

### Browse Your Masterpiece
Full gallery view with easy navigation.

<p align="center">
  <img src="assets/gallery-app-screenshot.png" alt="Gallery View" width="700"/>
</p>

### Export & Share
Professional PDF export with custom covers!

<p align="center">
  <img src="assets/export-comic-app-screenshot.png" alt="Export Options" width="500"/>
</p>

---

## 🎯 Comic Gallery

Check out what's possible with Infinite Heroes! Every image below was AI-generated:

### 📚 Cover Art Gallery

<p align="center">
  <img src="assets/comic-book-examples/Vile-lence-00-Cover.png" alt="Vile-lence Cover" width="220"/>
  <img src="assets/comic-book-examples/Death-Punch-00-Cover (1).png" alt="Death Punch Cover" width="220"/>
  <img src="assets/comic-book-examples/Comic-cover (1).png" alt="Comic Cover" width="220"/>
  <img src="assets/comic-book-examples/Comic-cover2.2.png" alt="Comic Cover 2" width="220"/>
</p>

### 📖 Interior Pages

<p align="center">
  <img src="assets/comic-book-examples/Blood and 'Vile'lence-Page-1.png" alt="Vile-lence Page 1" width="220"/>
  <img src="assets/comic-book-examples/Death-Punch-Page-05.png" alt="Death Punch Page 5" width="220"/>
  <img src="assets/comic-book-examples/Death-Punch-Page-09.png" alt="Death Punch Page 9" width="220"/>
  <img src="assets/comic-book-examples/Comic-page-6.png" alt="Comic Page 6" width="220"/>
</p>

<p align="center">
  <img src="assets/comic-book-examples/Comic-page-1.png" alt="Comic Page 1" width="220"/>
  <img src="assets/comic-book-examples/Comic-page-2.png" alt="Comic Page 2" width="220"/>
  <img src="assets/comic-book-examples/Comic-page-4 (2).png" alt="Comic Page 4" width="220"/>
</p>

### 🎭 Character Consistency

The same characters maintain their look across every page:

<p align="center">
  <img src="assets/comic-book-examples/Colleen-Hero-Image1.png" alt="Hero Character" width="200"/>
  <img src="assets/comic-book-examples/Gemini_Generated_Image_gws4t7gws4t7gws4.png" alt="Generated Character" width="200"/>
</p>

### 📕 Back Covers Too!

<p align="center">
  <img src="assets/comic-book-examples/Vile-lence-99-BackCover.png" alt="Back Cover Example" width="280"/>
</p>

---

## 🚀 Features at a Glance

| Feature | Description |
|---------|-------------|
| 🎨 **Genre Selection** | Superhero, Sci-Fi, Fantasy, Noir, Horror, Romance & more |
| 🖌️ **Art Styles** | Classic, Manga, Watercolor, Digital, Vintage & custom |
| 👥 **Multiple Characters** | Hero, Co-Star, and unlimited supporting cast |
| 📏 **Variable Length** | 6 to 24+ pages per issue |
| 🔄 **Smart Rerolls** | Regenerate any panel with custom instructions |
| 💾 **Auto-Save** | Never lose your work |
| 📚 **Preset Library** | Save your favorite configurations |
| 🎯 **Character Profiles** | AI-analyzed visual consistency system |

---

## 🛠️ Quick Start (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [Google Gemini API Key](https://ai.google.dev/)

### Installation

```bash
# Clone the repo
git clone https://github.com/ThiinkMG/infinite-heroes-comic-creator.git
cd infinite-heroes-comic-creator

# Install dependencies
npm install

# Create your environment file
echo "GEMINI_API_KEY=your_gemini_key_here" > .env.local
echo "ANTHROPIC_API_KEY=your_claude_key_here" >> .env.local  # Optional

# Launch!
npm run dev
```

Open `http://localhost:3000` and start creating! 🎉

---

## ☁️ Deploy Your Own

This project deploys perfectly on [Vercel](https://vercel.com):

1. Fork this repository
2. Connect to Vercel
3. Add environment variables:
   - `GEMINI_API_KEY` — Your Google AI Studio key (required)
   - `ANTHROPIC_API_KEY` — Your Claude API key (optional, enhances text quality)
   - `ADMIN_PASSWORD` — Optional admin access
4. Deploy! 🚀

> 💡 **Tip:** Claude enhances dialogue and story generation. Gemini handles all image generation.

---

## 🤖 Powered By

- **Google Gemini 2.5 Pro** — Narrative generation
- **Google Gemini 3 Pro** — Image generation (experimental)
- **Anthropic Claude** — Enhanced dialogue (optional)

---

## 👥 Credits

- **Vision & Design**: [Thiink Media Graphics](https://thiinkmedia.com)
- **Development**: Antigravity AI + Claude Code
- **Special Thanks**: The comic book community for inspiration

---

## 📜 License

Apache 2.0 — See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>🌟 Star this repo if you love comics! 🌟</strong>
  <br><br>
  <a href="https://infinite-heroes-comic-creator.vercel.app/">
    <img src="https://img.shields.io/badge/🎮_CREATE_YOUR_COMIC-Try_Now-purple?style=for-the-badge" alt="Create Your Comic"/>
  </a>
</p>

---

*Built with React, Vite, TypeScript, and ❤️ for comic book lovers everywhere.*
