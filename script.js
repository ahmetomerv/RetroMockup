// Vanilla JS only (no jQuery) per user preference.

const SYSTEM_PROMPT_TEMPLATE = `Generate a customizable retro product box and CD mockup. The goal is to allow dynamic branding (logo, name, etc.) for any company or service, while keeping the nostalgic style.


Create a hyper-realistic mockup of a vintage software package and CD-ROM. The design should include the following elements:

1. Retro Software Box:
• A 1990s-style software product box with slightly worn edges and a matte cardboard texture.
• Centered on the box is an image of an old-school beige CRT computer, full-sized keyboard, and floppy disk drives.
• The screen should show a stylized interface (e.g. terminal window, dashboard, analytics UI, etc.).
• Include the following customizable details (make placeholders for dynamic input):
• Product Name (e.g. “{{companyName}} {{productNumber}}”)
• Company Logo (inserted cleanly in the top left or top right corner).
• Tagline below the image: A catchy tagline that describes the product/company.
• Add playful tech-marketing language like: “New!”, “Version 3.0”.

2. CD-ROM Design:
• Show a physical CD slightly leaning against the box.
• CD label should mirror the software box cover:
• Same logo and retro computer image.
• Title: “{{companyName}} {{productNumber}}”
• The CD may also include a whimsical disclaimer text like regarding the product/company that you can infer from the company name.

Design Aesthetic:
• Retro, slightly kitschy, nostalgic for 90s tech marketing.
• Use dark grey, light grey, and soft orange hues.
• The packaging should not look dirty and scratched.
• Vintage textures and lighting (like subtle shadows and paper reflections).
• The overall tone is professional but tongue-in-cheek.

Customization Parameters:
• companyName: the name of the service or company
• tagline: A catchy tagline that describes the product/company.
• logoImage: logo to appear on box and CD
• Optional: background color or setting (e.g. plain white, desk surface, gradient, etc.)

Additional guidance for this generation:
• Determine a suitable, concise tagline automatically if not provided, based on the company name and its likely industry.
• If a logo image URL is provided, place it cleanly on the box and CD label. If external images cannot be fetched, approximate a simple flat logo mark using the company’s initials and expected brand colors.
• Keep the overall layout balanced and realistic, with subtle shadows, texture, and reflections consistent with a studio mockup on a plain background.
• Use a four-digit number for {{productNumber}} (e.g., 4827) and apply the exact title “{{companyName}} {{productNumber}}” consistently across the box and CD.
`;

function sanitizeCompanyToDomain(companyName) {
  const base = (companyName || "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 40);
  if (!base) return null;
  return `${base}.com`;
}

function guessLogoUrl(companyName) {
  const domain = sanitizeCompanyToDomain(companyName);
  return domain ? `https://logo.clearbit.com/${domain}` : null;
}

function parseUserInputToParams(input) {
  const companyName = String(input || "").trim();
  const logoImage = guessLogoUrl(companyName) || "";
  return { companyName, tagline: "auto", logoImage };
}

function buildFinalPrompt(params) {
  const companyName = params.companyName || "Your Company";
  const logoUrl = params.logoImage || "";
  const tagline = params.tagline && params.tagline !== "auto" ? params.tagline : "a suitable category inferred from the company name";
  const productNumber = String(Math.floor(1000 + Math.random() * 9000));

  // Fill template
  let prompt = SYSTEM_PROMPT_TEMPLATE
    .replaceAll("{{companyName}}", companyName)
    .replaceAll("{{tagline}}", tagline)
    .replaceAll("{{productNumber}}", productNumber);

  // Add explicit instruction about logo usage/fallback
  if (logoUrl) {
    prompt += `\n\nLogo source suggestion (if accessible): ${logoUrl}. If not accessible, create a simple logo using the company initials in a clean, flat style.`;
  } else {
    prompt += `\n\nIf a logo cannot be sourced, create a simple logo using the company initials in a clean, flat style.`;
  }

  // Encourage consistent composition
  prompt += `\n\nUse this exact product title everywhere it appears: "${companyName} ${productNumber}".\nOutput: One photorealistic image, square aspect ratio preferred.`;

  return prompt;
}

function dataUrlFromBase64Png(b64) {
  return `data:image/png;base64,${b64}`;
}

async function generateImageWithOpenAI({ apiKey, prompt, size = "1024x1024" }) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size,
      // Note: server may return either b64_json or url; we'll handle both below.
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}: ${text}`);
  }
  const json = await res.json();
  const first = json?.data?.[0];
  if (first?.b64_json) {
    return dataUrlFromBase64Png(first.b64_json);
  }
  if (first?.url) {
    return first.url;
  }
  throw new Error("No image data returned.");
}

// (no attachment support)

function createUserBubble(text) {
  const wrapper = document.createElement("div");
  wrapper.className = "flex items-start gap-3";
  wrapper.innerHTML = `
    <div class="shrink-0 w-8 h-8 rounded-full bg-gray-200 border border-gray-300"></div>
    <div class="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm max-w-full">
      <p class="text-sm whitespace-pre-wrap break-words"></p>
    </div>
  `;
  wrapper.querySelector("p").textContent = text;
  return wrapper;
}

function createAssistantBubbleLoading() {
  const wrapper = document.createElement("div");
  wrapper.className = "flex items-start gap-3";
  wrapper.innerHTML = `
    <div class="shrink-0 w-8 h-8 rounded-full bg-orange-200 border border-orange-300"></div>
    <div class="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm max-w-full">
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <svg class="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        Crafting something nice...
      </div>
    </div>
  `;
  return wrapper;
}

function createAssistantBubbleImage(src, caption) {
  const wrapper = document.createElement("div");
  wrapper.className = "flex items-start gap-3";
  wrapper.innerHTML = `
    <div class="shrink-0 w-8 h-8 rounded-full bg-orange-200 border border-orange-300"></div>
    <div class="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm max-w-full">
      <img class="rounded-md border border-gray-200 w-full max-w-xl" alt="Generated retro mockup" />
      ${caption ? `<p class="text-xs text-gray-500 mt-2">${caption}</p>` : ""}
      <div class="mt-2 flex gap-2">
        <a download="retro-mockup.png" class="download-btn text-xs px-2 py-1 rounded border border-gray-300">Download</a>
      </div>
    </div>
  `;
  const img = wrapper.querySelector("img");
  img.src = src;
  const dl = wrapper.querySelector(".download-btn");
  dl.href = src;
  return wrapper;
}

function createAssistantBubbleError(message) {
  const wrapper = document.createElement("div");
  wrapper.className = "flex items-start gap-3";
  wrapper.innerHTML = `
    <div class="shrink-0 w-8 h-8 rounded-full bg-orange-200 border border-orange-300"></div>
    <div class="bg-white border border-red-200 rounded-2xl px-4 py-3 shadow-sm max-w-full">
      <p class="text-sm text-red-700"></p>
    </div>
  `;
  wrapper.querySelector("p").textContent = message;
  return wrapper;
}

function scrollChatToBottom() {
  const chat = document.getElementById("chat");
  requestAnimationFrame(() => chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" }));
}

function autosizeTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = Math.min(textarea.scrollHeight, 240) + "px";
}

// UI wiring
document.addEventListener("DOMContentLoaded", () => {
  const chat = document.getElementById("chat");
  const form = document.getElementById("prompt-form");
  const input = document.getElementById("prompt-input");
  const toggleKey = document.getElementById("toggle-key");
  const togglePrompt = document.getElementById("toggle-prompt");
  const keyModal = document.getElementById("key-modal");
  const keyClose = document.getElementById("key-close");
  const apiKeyInput = document.getElementById("api-key");
  const saveKeyBtn = document.getElementById("save-key");
  const clearKeyBtn = document.getElementById("clear-key");
  const keyStatus = document.getElementById("key-status");
  const promptModal = document.getElementById("prompt-modal");
  const promptClose = document.getElementById("prompt-close");
  const promptCopy = document.getElementById("prompt-copy");
  const promptText = document.getElementById("prompt-text");
  const promptStatus = document.getElementById("prompt-status");
  // no attachment elements

  // Load API key from localStorage
  const savedKey = localStorage.getItem("openai_api_key") || "";
  if (savedKey) {
    apiKeyInput.value = savedKey;
    keyStatus.textContent = "Key loaded from local storage";
  }

  function openKeyModal() {
    keyModal.classList.remove("hidden");
    setTimeout(() => apiKeyInput.focus(), 0);
  }
  function closeKeyModal() {
    keyModal.classList.add("hidden");
  }
  toggleKey.addEventListener("click", openKeyModal);
  keyClose.addEventListener("click", closeKeyModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeKeyModal();
  });

  // Prompt modal
  function openPromptModal() {
    promptText.textContent = SYSTEM_PROMPT_TEMPLATE.trim();
    promptStatus.textContent = "";
    promptModal.classList.remove("hidden");
  }
  function closePromptModal() {
    promptModal.classList.add("hidden");
  }
  togglePrompt.addEventListener("click", openPromptModal);
  promptClose.addEventListener("click", closePromptModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePromptModal();
  });
  promptCopy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(SYSTEM_PROMPT_TEMPLATE.trim());
      promptStatus.textContent = "Copied to clipboard";
      setTimeout(() => (promptStatus.textContent = ""), 1500);
    } catch (_) {
      promptStatus.textContent = "Copy failed";
      setTimeout(() => (promptStatus.textContent = ""), 1500);
    }
  });

  saveKeyBtn.addEventListener("click", () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      keyStatus.textContent = "Enter a valid key";
      return;
    }
    localStorage.setItem("openai_api_key", key);
    keyStatus.textContent = "Saved";
    setTimeout(() => (keyStatus.textContent = ""), 1500);
  });

  clearKeyBtn.addEventListener("click", () => {
    localStorage.removeItem("openai_api_key");
    apiKeyInput.value = "";
    keyStatus.textContent = "Cleared";
    setTimeout(() => (keyStatus.textContent = ""), 1500);
  });

  // (no attachment flow)

  input.addEventListener("input", () => autosizeTextarea(input));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const apiKey = (apiKeyInput.value || localStorage.getItem("openai_api_key") || "").trim();
    if (!apiKey) {
      openKeyModal();
      keyStatus.textContent = "Please enter your API key";
      return;
    }

    const userText = input.value.trim();
    if (!userText) return;

    // Reset input
    input.value = "";
    autosizeTextarea(input);

    // Show user bubble
    const userBubble = createUserBubble(userText);
    chat.appendChild(userBubble);

    // Show assistant loading
    const loadingBubble = createAssistantBubbleLoading();
    chat.appendChild(loadingBubble);
    scrollChatToBottom();

    try {
      const params = parseUserInputToParams(userText);
      let finalPrompt = buildFinalPrompt(params);
      const imageUrl = await generateImageWithOpenAI({ apiKey, prompt: finalPrompt, size: "1024x1024" });

      // Replace loading with image bubble
      chat.removeChild(loadingBubble);
      const caption = `Generated for ${params.companyName || "your company"}`;
      const imageBubble = createAssistantBubbleImage(imageUrl, caption);
      chat.appendChild(imageBubble);
      // no attachment state to reset
      scrollChatToBottom();
    } catch (err) {
      chat.removeChild(loadingBubble);
      const errorBubble = createAssistantBubbleError(err.message || "Generation failed");
      chat.appendChild(errorBubble);
      scrollChatToBottom();
    }
  });
});
