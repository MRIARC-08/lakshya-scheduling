<div align="center">
  <h1>🏛️ Lakshya Scheduling Platform</h1>
  <p><em>An AI-powered, multi-agent mentorship booking system for civil service aspirants.</em></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](#)
  [![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](#)
  [![LangGraph](https://img.shields.io/badge/LangGraph-1C1C1C?style=for-the-badge&logo=langchain&logoColor=white)](#)
  [![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)](#)
</div>

---

## 📐 System Architecture

The platform is divided into three distinct services working in perfect synchronization:

1. **Frontend (`/frontend`)**: A Next.js SPA providing a sharp, monochrome user interface and chat experience.
2. **AI Agent (`/python-agent`)**: A LangGraph multi-agent orchestration layer that handles complex reasoning and API routing.
3. **Corsair Bridge (`/corsair-bridge`)**: An Express.js microservice executing secure Google Workspace integrations.

### Global Data Flow

```mermaid
graph TD
    %% Styling for a sleek, sharp aesthetic
    classDef default fill:transparent,stroke:#888,stroke-width:1px,color:inherit,rx:0,ry:0;
    classDef client fill:#f4f4f4,stroke:#000,stroke-width:1.5px,color:#000,rx:0,ry:0;
    classDef agent fill:#000,stroke:#fff,stroke-width:1.5px,color:#fff,rx:0,ry:0;
    classDef bridge fill:#333,stroke:#ccc,stroke-width:1px,color:#fff,rx:0,ry:0;
    classDef external fill:transparent,stroke:#666,stroke-width:1px,stroke-dasharray: 4 4,rx:0,ry:0;

    %% User and UI Layer
    subgraph Client [Client Side]
        User((User)):::client
        Browser[Web Browser]:::client
        User --> Browser
    end
    
    subgraph FrontendApp [Frontend App]
        NextUI[React Components]:::default
        ChatHook[useChatSessions]:::default
        NextAPI[/api/chat]:::default
        
        Browser <--> NextUI
        NextUI <--> ChatHook
        ChatHook <--> NextAPI
    end
    
    %% API and Agent Layer
    subgraph AIAgent [Python AI Service]
        FastAPI[FastAPI Server]:::agent
        LangGraph[LangGraph Engine]:::agent
        State[(Agent DB)]:::agent
        
        NextAPI <--> FastAPI
        FastAPI <--> LangGraph
        LangGraph <--> State
    end
    
    %% Integration Layer
    subgraph Integration [Corsair Bridge Service]
        Express[Express.js Server]:::bridge
        CorsairSDK[Corsair Core]:::bridge
        CorsairDB[(OAuth DB)]:::bridge
        
        LangGraph -->|Tool Calling| Express
        Express <--> CorsairSDK
        CorsairSDK <--> CorsairDB
    end
    
    %% External Services
    subgraph External [Google Workspace]
        GCal[Google Calendar]:::external
        Gmail[Gmail]:::external
        
        CorsairSDK <--> GCal
        CorsairSDK <--> Gmail
    end
```

## 🏗️ Service Overview

### 1. Frontend Web App
Located in `/frontend`. A stunning, high-performance UI built with Next.js App Router.
* **Stack**: Next.js 14, React, TailwindCSS, GSAP, NextAuth.js.
* [Explore Frontend Docs](./frontend/README.md)

### 2. Python AI Agent
Located in `/python-agent`. The cognitive core ("Arjun") utilizing a multi-agent state machine.
* **Stack**: FastAPI, LangChain, LangGraph, PostgreSQL, Cerebras Llama 3.
* [Explore Agent Docs](./python-agent/README.md)

### 3. Corsair Bridge
Located in `/corsair-bridge`. The secure execution environment for Google Workspace integration.
* **Stack**: Express.js, TypeScript, Corsair SDK, Zod, PostgreSQL.
* [Explore Bridge Docs](./corsair-bridge/README.md)

---
<div align="center">
  <p><em>Engineered for seamless scale, absolute reliability, and a premium user experience.</em></p>
</div>
