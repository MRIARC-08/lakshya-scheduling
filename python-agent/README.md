# Python AI Agent (Arjun)

This directory houses the backend intelligence of the Lakshya Scheduling Platform. It exposes a FastAPI service that orchestrates a LangGraph multi-agent system to understand user intents, check calendar availability, book sessions, and trigger email confirmations.

## Architecture & Data Flow

The agent utilizes LangGraph to create a deterministic, state-driven execution flow. Instead of a single LLM trying to do everything, tasks are delegated to specialized agents (nodes) which can use external tools.

```mermaid
graph TD
    API([FastAPI Endpoint])
    
    subgraph LangGraph [LangGraph State Machine]
        State[(Scheduling State)]
        
        Router{Triage Router}
        TriageNode[Triage Agent<br/>General Queries]
        BookingNode[Booking Specialist<br/>Scheduling Workflow]
        
        CheckAvailability[[Tool: check_availability]]
        ReserveSlot[[Tool: reserve_slot]]
        SendEmail[[Tool: send_email]]
    end
    
    subgraph Checkpoints [Persistence]
        PG[(PostgreSQL<br/>Thread History)]
    end
    
    API -->|Inject Message| State
    State --> Router
    
    Router -->|General| TriageNode
    Router -->|Booking Intent| BookingNode
    
    BookingNode <-->|Queries| CheckAvailability
    BookingNode <-->|Mutates| ReserveSlot
    BookingNode <-->|Notifies| SendEmail
    
    LangGraph <-->|Saves/Loads Thread| PG
```

## Key Components

- **`main.py`**: The entry point. Sets up the FastAPI server, defines API routes (`/chat`, `/chat/history`), and initializes the graph.
- **`agents/graph.py`**: The LangGraph definition. Wires up the Triage Agent, Booking Specialist, and the Conditional Router. Initializes the PostgreSQL checkpointer.
- **`agents/triage_agent.py`**: The primary classifier. Evaluates if the user is asking a general question or wants to book a session.
- **`agents/booking_specialist.py`**: A specialized agent with access to tools. Guides the user through collecting their name, email, preferred session type, and date/time.
- **`tools/*.py`**: Functions bound to the Booking Specialist that make HTTP requests to the `corsair-bridge` to perform real-world actions.

## LLM Strategy & Fallbacks

The system implements a robust LLM routing strategy to handle rate limits and API failures:
- **Primary Model**: Cerebras-hosted Llama models for ultra-fast, low-latency inference.
- **Fallback Chain**: Uses secondary Cerebras keys, Groq APIs, and fallback models (e.g., Mixtral) automatically if the primary endpoint throws a 429 Rate Limit error.

## Getting Started

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Configure `.env`:
   Provide API keys for OpenAI/Cerebras, Groq, and the PostgreSQL connection string.
3. Run the server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
