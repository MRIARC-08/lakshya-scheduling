<div align="center">
  <h1>🌉 Corsair Bridge</h1>
  <p><em>The secure Express.js microservice bridging AI agents to Google Workspace.</em></p>
  
  [![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)](#)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](#)
  [![Google Workspace](https://img.shields.io/badge/Google_Workspace-4285F4?style=for-the-badge&logo=google&logoColor=white)](#)
</div>

---

## 📐 Architecture & Data Flow

The Python agent lacks direct access to the user's Google Workspace. Instead, it relies on this microservice to perform calendar lookups, event creation, and email dispatch securely. 

```mermaid
graph TD
    %% Styling for a sleek, sharp aesthetic
    classDef default fill:transparent,stroke:#888,stroke-width:1px,color:inherit,rx:0,ry:0;
    classDef external fill:#f4f4f4,stroke:#000,stroke-width:1.5px,color:#000,rx:0,ry:0;
    classDef bridge fill:#000,stroke:#fff,stroke-width:1.5px,color:#fff,rx:0,ry:0;
    classDef db fill:#333,stroke:#ccc,stroke-width:1px,color:#fff,rx:0,ry:0;
    classDef api fill:transparent,stroke:#666,stroke-width:1px,stroke-dasharray: 4 4,rx:0,ry:0;

    %% Python Agent Caller
    subgraph PythonAgent [Python AI Agent API]
        CheckAvail["check_availability()"]:::external
        ReserveSlot["reserve_slot()"]:::external
        SendEmail["send_email()"]:::external
    end
    
    %% Express Server & Corsair SDK
    subgraph CorsairBridge [Corsair Bridge Service (Express.js)]
        Router[API Router]:::bridge
        
        subgraph Routes [Express Routes]
            CalRoute[Calendar Routes]:::default
            EmailRoute[Email Routes]:::default
        end
        
        subgraph Core [Corsair Core Integration]
            CorsairSDK[Corsair SDK Context]:::bridge
            GCalPlugin[@googlecalendar]:::default
            GmailPlugin[@gmail]:::default
        end
        
        %% DB
        PG[(OAuth Tokens DB)]:::db
    end
    
    %% Google Cloud APIs
    subgraph GoogleWorkspace [Google Workspace Cloud]
        GCalAPI[Google Calendar API]:::api
        GmailAPI[Gmail API]:::api
    end
    
    %% Network Flow
    CheckAvail --> Router
    ReserveSlot --> Router
    SendEmail --> Router
    
    Router --> Routes
    CalRoute <--> GCalPlugin
    EmailRoute <--> GmailPlugin
    
    GCalPlugin <--> CorsairSDK
    GmailPlugin <--> CorsairSDK
    
    CorsairSDK <--> PG
    
    GCalPlugin <--> GCalAPI
    GmailPlugin <--> GmailAPI
```

## 🛠️ Key Components

- **`src/index.ts`**: Express server setup, CORS configuration, and route registration.
- **`src/corsair.ts`**: Initialization of the Corsair SDK. It handles the PostgreSQL connection and loads the required integration plugins (`@corsair-dev/googlecalendar`, `@corsair-dev/gmail`).
- **`src/routes/calendar.ts`**: Endpoints for parsing requested dates, querying the Google Calendar API for free/busy slots, and creating new calendar events.
- **`src/routes/email.ts`**: Endpoints for sending confirmation emails via the Gmail API.
- **`src/utils/mime.ts`**: Contains the logic to build multipart MIME HTML email templates, matching the Lakshya IAS minimalist monochrome aesthetic.

## 🔐 Why Corsair?

Managing OAuth flows (Access Tokens, Refresh Tokens, Expirations, Consent Screens) for server-to-server Google API communication is notoriously complex. The Corsair framework abstracts this into a simple CLI setup and provides an SDK that automatically handles token refresh and authentication headers, allowing us to focus solely on the business logic of scheduling.

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Configure `.env`:
   Provide your `DATABASE_URL` for Corsair to store tokens.
3. Authenticate Integrations:
   Run the Corsair CLI to authenticate your Google Account.
   ```bash
   pnpm run setup:gmail
   pnpm run setup:calendar
   ```
4. Start the server:
   ```bash
   pnpm run dev
   ```
