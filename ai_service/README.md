# Finance Buddy AI Service

This is the Python-based AI service that powers the Finance Buddy chatbot. It uses FastAPI and the Phi-2 model to provide financial advice and insights.

## Quick Start

1. Create a Python virtual environment and activate it:

```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and adjust settings if needed:
```bash
cp .env.example .env
```

4. Run the service:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The service will be available at `http://localhost:8000`. The API documentation is available at `http://localhost:8000/docs`.

## API Endpoints

### POST /v1/chat/completions

Main chat endpoint that accepts:

```json
{
  "messages": [
    {"role": "system", "content": "You are a helpful assistant..."},
    {"role": "user", "content": "How much did I spend..."}
  ],
  "stream": true
}
```

Returns a streaming response compatible with the frontend's expectations.

## Environment Variables

- `PORT` - Server port (default: 8000)
- `HOST` - Server host (default: 0.0.0.0)
- `MODEL_NAME` - Hugging Face model to use (default: microsoft/phi-2)
- `DEVICE` - Device to run model on (cuda/cpu)
- `MAX_NEW_TOKENS` - Maximum tokens to generate (default: 1000)
- `TEMPERATURE` - Generation temperature (default: 0.7)

## Deployment

### Local Development

Run with auto-reload:
```bash
uvicorn main:app --reload
```

### Production

For production, use multiple workers:
```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

### Docker

Build and run with Docker:
```bash
docker build -t finance-buddy-ai .
docker run -p 8000:8000 finance-buddy-ai
```

## Integration with Supabase Function

The Supabase Edge Function is configured to call this service. Make sure to:

1. Set the `AI_SERVICE_URL` environment variable in your Supabase project settings
2. Ensure the service is accessible from your Supabase Edge Function
3. Consider adding authentication between the Edge Function and this service in production