# RetroMockup.exe

Generate a retro 90s-style software box and CD-ROM mockup from a simple company name. Built with plain HTML, TailwindCSS (CDN), and vanilla JavaScript.

## Features
- Chat-like UI with a ChatGPT-style prompt box
- Type just a company name; the app composes a detailed image prompt automatically
- Random 4‑digit product number appended to the name (e.g., "Acme 4827")
- Logo hinting via `https://logo.clearbit.com/<company>.com` (best effort)
- Uses OpenAI Images API (`gpt-image-1`) to generate the mockup
- Download button for the generated image
- Local storage for your API key (only in your browser)
- Favicons and header logo from `assets/`

## Requirements
- An OpenAI API key with access to `gpt-image-1`

## Quick Start (local)
1. Clone the repo:
   ```bash
   git clone https://github.com/<your-username>/retro-product.git
   cd retro-product
   ```
2. Open the `index.html` file
3. Open the app, click “API Key”, paste your OpenAI key, Save.
4. Type a company name (e.g., `OpenAI`).
5. Press Enter or click Send. Download the result when ready.

Notes:
- Your API key is saved in `localStorage` only. It’s never committed to the repo.
- The app calls OpenAI directly from the browser for simplicity. For production, use a server-side proxy to keep your API key secret.

## Deploying to GitHub Pages
1. Push this project to a GitHub repository.
2. In the repo, go to Settings → Pages.
3. Set Source to “Deploy from a branch,” select `main` (or your default) and `/ (root)`.
4. Click Save. GitHub will publish your site at `https://<your-username>.github.io/<repo>/`.

Because this is a static site, no build step is required.

## Customization
- System prompt and behavior: edit `SYSTEM_PROMPT_TEMPLATE` and prompt assembly in `script.js`.
- Image size/model:
  - In `generateImageWithOpenAI(...)`, change `size` (e.g., `1024x1024`) or `model` (`gpt-image-1`).
- UI:
  - Tailwind via CDN in `index.html`. Tweak classes for spacing, colors, and layout.
- Favicons / app logo:
  - Located in `assets/`. The navbar uses `assets/apple-touch-icon.png`.

## Troubleshooting
- 400 Unknown parameter `response_format`:
  - We do not send `response_format` anymore. The app handles both base64 and URL responses automatically.
- CORS or network errors:
  - Serve over `http://localhost` (not `file://`). Use the local server instructions above.
- Access errors (403/insufficient quota):
  - Ensure your key has access to `gpt-image-1` and your account has available quota.
- Logo not applied:
  - If the Clearbit logo isn’t available, the prompt instructs the model to synthesize a simple logo using initials.

## Project Structure
```
retro-product/
├─ assets/
│  ├─ apple-touch-icon.png
│  ├─ android-chrome-192x192.png
│  ├─ android-chrome-512x512.png
│  ├─ favicon-16x16.png
│  ├─ favicon-32x32.png
│  ├─ favicon.ico
│  └─ site.webmanifest
├─ index.html
├─ script.js
└─ README.md
```

## Security Considerations
- This demo sends requests directly from the browser to OpenAI. Your API key is present on the client and is stored in `localStorage`.
- For any shared or production deployment, proxy the request through a minimal server that injects the API key on the server side. Do not expose your key in public.

## Contributing
Issues and PRs are welcome. Please keep contributions framework-free (vanilla JS + Tailwind CDN) unless discussed.

## License
You may choose a license that fits your needs (e.g., MIT). If you add a license file, mention it here.
