# Lamatic Grammar Assistant Chrome Extension

<p align="center">
  <img src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExanloejVyMDhnOXV3cWxsbjRpczRxbzFsdG43bnBucW9yc3k5dTJyMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/nSErxnM2ua4hZYwwKJ/giphy.gif"/>
</p>

**Lamatic Grammar Assistant** is an AI-powered Chrome extension that helps you check and improve your grammar instantly. Built with [Lamatic.ai](https://lamatic.ai), it allows you to select any text on any webpage and get real-time grammar corrections and suggestions through an elegant side panel interface.

---

## Lamatic Setup (Pre and Post)

Before running this project, you must build and deploy the flow in Lamatic, then wire its config into this codebase.

Pre: Build in Lamatic
1. Sign in or sign up at https://lamatic.ai  
2. Create a project (if you don’t have one yet)  
3. Click “+ New Flow” and select "Templates" 
4. Select the 'Grammar Assistant' agent kit
5. Configure providers/tools/inputs as prompted  
6. Deploy the kit in Lamatic and obtain your .env keys
7. Copy the keys from your studio

Post: Wire into this repo
1. Place lamatic-config.json in the path this repo expects (commonly ./lamatic-config.json; if different, follow this README’s instructions)  
2. Zip and upload to your chrome browser

Notes
- If this repo contains a lamatic-config.json, it’s a placeholder. Replace it with your exported config.  
- Coming soon: single-click export and “Connect Git” in Lamatic to push config directly to your repo.

---

## 🔑 Setup

### Required Keys and Config

You'll need two things to run this extension:

1. **lamatic-config.json payload** → copy it from your Lamatic Studio project (this defines your grammar check workflow).  
   ⚠️ Note: The `lamatic-config.json` in this repo is just a **dummy example**.  
   Replace it with your own exported config from Lamatic Studio.

| Item                    | Purpose                                      | Where to Get It                                 |
| ----------------------- | -------------------------------------------- | ----------------------------------------------- |
| Lamatic Config          | Defines your grammar check workflow          | From your Lamatic Studio Agent Kit Project      |

### 1. Config File

Copy your project payload into [`lamatic-config.json`](./lamatic-config.json) in the extension root directory.

### 2. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the extension directory containing `manifest.json`
5. The extension should now appear in your extensions list

---

## 📂 Extension Structure

```
/
├── manifest.json              # Chrome extension configuration
├── background.js              # Service worker for message handling
├── content.js                 # Content script for text selection
├── sidepanel.html            # Side panel UI
├── sidepanel.js              # Side panel logic & Lamatic integration
├── styles.css                # Side panel styling
├── lamatic-config.json       # Lamatic workflow configuration
└── images/
    ├── lamatic-logo.png      # Extension icon
    ├── favicon-16x16.png     # Favicon 16x16
    ├── favicon-32x32.png     # Favicon 32x32
    └── apple-touch-icon.png  # Apple touch icon
```

---

## 🤝 Contributing

We welcome contributions! Open an issue or PR in this repo.

---

## 📜 License

MIT License – see [LICENSE](./LICENSE).

---
