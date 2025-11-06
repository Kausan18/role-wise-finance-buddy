from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import json
from dotenv import load_dotenv
import openai
import asyncio
import aiohttp
from openai import AsyncOpenAI

load_dotenv()

app = FastAPI(title="Finance Buddy AI Service")

# IBM Granite Model configuration
openai.base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
openai.api_key = os.getenv("OPENROUTER_API_KEY")
MODEL_NAME = os.getenv("OPENROUTER_MODEL", "mistral-7b-instruct")

# Create async client
async_client = AsyncOpenAI(
    base_url=openai.base_url,
    api_key=openai.api_key,
)

@app.get("/health")
async def health_check():
    """Health check endpoint for the AI service."""
    return {"status": "healthy", "model": MODEL_NAME}

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Using IBM Granite Model (via OpenAI-compatible client) — no local model download required.
# The async_client created above will call the IBM Granite endpoint using the
# API key set in the .env file. No additional initialization is necessary here.

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    system_prompt: Optional[str] = None
    stream: bool = True

def format_prompt(messages: List[Message], system_prompt: Optional[str] = None) -> str:
    """Format messages into a prompt the Granite model can understand."""
    formatted = ""
    if system_prompt:
        formatted += f"System: {system_prompt}\n\n"
    
    for msg in messages:
        role_prefix = "Assistant: " if msg.role == "assistant" else "Human: "
        formatted += f"{role_prefix}{msg.content}\n"
    
    formatted += "Assistant: "
    return formatted

async def generate_stream(prompt: str):
    """Stream response from OpenRouter API."""
    try:
        messages = [{"role": "user", "content": prompt}]
        stream = await async_client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            stream=True,
            temperature=0.7,
            max_tokens=1000,
            top_p=0.95,
            headers={
                "HTTP-Referer": "https://github.com/Kausan18/role-wise-finance-buddy",
                "X-Title": "Finance Buddy AI Service"
            }
        )
        
        async for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                yield f"data: {json.dumps({'choices': [{'delta': {'content': chunk.choices[0].delta.content}}]})}\n\n"
                
        yield "data: [DONE]\n\n"
                
    except Exception as e:
        print(f"Error in generate_stream: {str(e)}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"

@app.post("/v1/chat/completions")
async def chat_completion(request: ChatRequest):
    try:
        # Format the conversation history into a prompt
        prompt = format_prompt(request.messages, request.system_prompt)
        
        # If streaming is requested, return a StreamingResponse
        if request.stream:
            return StreamingResponse(
                generate_stream(prompt),
                media_type="text/event-stream"
            )
        
        # For non-streaming, generate the full response at once
        messages = [{"role": "user", "content": prompt}]
        response = await async_client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            temperature=0.7,
            max_tokens=1000,
            top_p=0.95,
            headers={
                "HTTP-Referer": "https://github.com/Kausan18/role-wise-finance-buddy",
                "X-Title": "Finance Buddy AI Service"
            }
        )
        
        response_text = response.choices[0].message.content
        
        return {
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": response_text
                }
            }]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)