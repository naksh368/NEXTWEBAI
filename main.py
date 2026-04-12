from fastapi import FastAPI, HTTPException  
from fastapi.middleware.cors import CORSMiddleware  
from pydantic import BaseModel  
from typing import List, Dict, Any  
import openai  
import os  
import logging  

# Configure logging  
logging.basicConfig(level=logging.INFO)  

# Initialize the FastAPI app  
app = FastAPI()  

# CORS settings  
app.add_middleware(  
    CORSMiddleware,  
    allow_origins=['*'],  
    allow_credentials=True,  
    allow_methods=['*'],  
    allow_headers=['*'],  
)  

# Environment variables  
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')  
if OPENAI_API_KEY is None:  
    raise Exception("OPENAI_API_KEY not set")  

class Message(BaseModel):  
    role: str  
    content: str  

class ChatRequest(BaseModel):  
    messages: List[Message]  

class ChatResponse(BaseModel):  
    responses: List[Dict[str, Any]]  

# In-memory conversation history  
conversation_history = []  

@app.post('/chat', response_model=ChatResponse)  
async def chat(request: ChatRequest):  
    try:  
        conversation_history.extend(request.messages)  
        response = openai.ChatCompletion.create(  
            model='gpt-3.5-turbo',  
            messages=conversation_history,  
        )  
        conversation_history.append(response.choices[0].message)  
        return ChatResponse(responses=[response.choices[0].message])  
    except Exception as e:  
        logging.error(f'Error during API call: {e}')  
        raise HTTPException(status_code=500, detail="Internal Server Error")  

@app.get('/history', response_model=List[Message])  
async def get_history():  
    return conversation_history  

if __name__ == '__main__':  
    import uvicorn  
    uvicorn.run(app, host='0.0.0.0', port=8000)  
