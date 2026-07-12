<div align="center">
  <h1>🧠 Lakshya Python Agent</h1>
  <p><em>The cognitive LangGraph engine orchestrating bookings and user triage.</em></p>
  
  [![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](#)
  [![LangGraph](https://img.shields.io/badge/LangGraph-1C1C1C?style=for-the-badge&logo=langchain&logoColor=white)](#)
  [![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](#)
</div>

---

## 📐 Architecture & Data Flow

The agent utilizes LangGraph to create a deterministic, state-driven execution flow. Instead of a single LLM trying to do everything, tasks are delegated to specialized agents (nodes) which can use external tools.

```mermaid
graph TD
    %% Styling for a sleek, sharp aesthetic
    classDef default fill:transparent,stroke:#888,stroke-width:1px,color:inherit,rx:0,ry:0;
    classDef endpoint fill:#f4f4f4,stroke:#000,stroke-width:1.5px,color:#000,rx:0,ry:0;
    classDef agent fill:#000,stroke:#fff,stroke-width:1.5px,color:#fff,rx:0,ry:0;
    classDef db fill:#333,stroke:#ccc,stroke-width:1px,color:#fff,rx:0,ry:0;
    classDef llm fill:transparent,stroke:#666,stroke-width:1px,stroke-dasharray: 4 4,rx:0,ry:0;

    %% Entry points
    API(["FastAPI REST Endpoint<br/>/chat, /chat/history"]):::endpoint
    
    subgraph LangGraphEngine [LangGraph State Machine Engine]
        State[("SchedulingState TypedDict<br/>Manages Context & Variables")]:::default
        Router{"Triage Router"}:::default
        
        subgraph Agents [AI Agents]
            TriageNode["Triage Agent Node<br/>System Prompt: Categorization"]:::agent
            BookingNode["Booking Specialist Node<br/>System Prompt: Slot Booking"]:::agent
        end
        
        subgraph Tools [External Tools API]
            CheckAvailability[["Tool: check_availability<br/>Hits Corsair /calendar"]]:::default
            ReserveSlot[["Tool: reserve_slot<br/>Hits Corsair /calendar/event"]]:::default
            SendEmail[["Tool: send_email<br/>Hits Corsair /email"]]:::default
        end
    end
    
    subgraph Persistence [Neon Database Persistence]
        PG_Threads[("Checkpoints Table<br/>stores thread history")]:::db
        PG_Bookings[("Bookings Table<br/>stores confirmed appointments")]:::db
    end
    
    subgraph LLMRouting [LLM Provider Routing]
        PrimaryLLM["Cerebras gpt-oss-120b<br/>Primary Fast Inference"]:::llm
        FallbackLLM["Groq Llama 3 / Mixtral<br/>Fallback for Rate Limits"]:::llm
    end
    
    API -->|Inject HumanMessage| State
    State --> Router
    
    Router -->|Intent = General| TriageNode
    Router -->|Intent = Book/Reschedule| BookingNode
    
    TriageNode <-->|Queries for Generation| PrimaryLLM
    BookingNode <-->|Queries for Tool Call/Generation| PrimaryLLM
    PrimaryLLM -.->|429 Rate Limit| FallbackLLM
    
    BookingNode <-->|Calls if tool_calls outputted| Tools
    Tools -.->|Returns JSON Status| BookingNode
    
    Tools -->|Updates| PG_Bookings
    LangGraphEngine <-->|Auto-saves State| PG_Threads
```

## 🛠️ Key Components

- **`main.py`**: The entry point. Sets up the FastAPI server, defines API routes (`/chat`, `/chat/history`), and initializes the graph.
- **`agents/graph.py`**: The LangGraph definition. Wires up the Triage Agent, Booking Specialist, and the Conditional Router. Initializes the PostgreSQL checkpointer.
- **`agents/triage_agent.py`**: The primary classifier. Evaluates if the user is asking a general question or wants to book a session.
- **`agents/booking_specialist.py`**: A specialized agent with access to tools. Guides the user through collecting their name, email, preferred session type, and date/time.
- **`tools/*.py`**: Functions bound to the Booking Specialist that make HTTP requests to the `corsair-bridge` to perform real-world actions.

## 🤖 LLM Strategy & Fallbacks

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
