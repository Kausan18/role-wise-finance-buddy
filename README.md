# Role-wise Finance Buddy

Smart personal finance manager that adapts to your role (student, professional, or family) and provides tailored insights.

## Quick Start

### Frontend (React + Vite)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### AI Service (Python FastAPI)

```bash
# Navigate to AI service directory
cd ai_service

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start AI service
uvicorn main:app --reload
```

### Development Setup

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS


## IBM Granite integration

This project can use IBM Granite as the backend LLM for the finance assistant. The Supabase Edge Function at `supabase/functions/finance-chat/index.ts` will prefer IBM Granite when the following environment variables are set (see `.env.example`):

- `IBM_GRANITE_API_KEY` — your IBM API key
- `IBM_GRANITE_API_URL` — the full HTTP endpoint for your Granite instance (region/tenant-specific)
- `IBM_GRANITE_MODEL` — optional model identifier (default: `granite-1`)

Behavior:
- If the IBM Granite env vars are present, the function will send the chat request to the IBM endpoint and proxy the streaming response to the frontend.
- If IBM vars are not configured, the function falls back to the existing Lovable AI gateway (`LOVABLE_API_KEY`).

Notes and next steps:
- IBM's API payload shape may vary across deployments. The function sends a chat-like payload with `model`, `messages`, and `stream: true`. If your Granite deployment expects a different body shape, update `supabase/functions/finance-chat/index.ts` accordingly.
- Make sure your IBM endpoint supports streaming if you want incremental assistant responses in the UI.
- Add the IBM keys to your deployment environment (Supabase secret/config) or local `.env` used when running the function locally.

If you'd like, I can:
- adapt the request payload to a specific IBM Granite example from your IBM cloud account,
- add validation and feature-flagging to toggle providers from the frontend,
- or implement a small test harness that exercises the function against a mock IBM endpoint.
