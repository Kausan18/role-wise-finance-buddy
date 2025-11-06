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

This project uses IBM Granite as the backend LLM for the finance assistant. The Supabase Edge Function at `supabase/functions/finance-chat/index.ts` will prefer IBM Granite when the following environment variables are set (see `.env.example`):

- `IBM_GRANITE_API_KEY` — your IBM API key
- `IBM_GRANITE_API_URL` — the full HTTP endpoint for your Granite instance (region/tenant-specific)
- `IBM_GRANITE_MODEL` — optional model identifier (default: `granite-1`)

Behavior:
- If the IBM Granite env vars are present, the function will send the chat request to the IBM endpoint and proxy the streaming response to the frontend.
- If IBM vars are not configured, the function falls back to the existing Lovable AI gateway (`LOVABLE_API_KEY`).

