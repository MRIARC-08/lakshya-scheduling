<div align="center">
  <h1>✨ Lakshya Frontend</h1>
  <p><em>The polished, conversational user interface for the scheduling platform.</em></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](#)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)
  [![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge&logo=greensock&logoColor=white)](#)
</div>

---

## 📐 Architecture & Data Flow

The frontend is a strictly typed SPA (Single Page Application) built with Next.js App Router. It acts as the presentation layer, handling state management, animations, and secure proxying to the AI agent.

```mermaid
graph TD
    %% Styling for a sleek, sharp aesthetic
    classDef default fill:transparent,stroke:#888,stroke-width:1px,color:inherit,rx:0,ry:0;
    classDef client fill:#f4f4f4,stroke:#000,stroke-width:1.5px,color:#000,rx:0,ry:0;
    classDef proxy fill:#222,stroke:#fff,stroke-width:1.5px,color:#fff,rx:0,ry:0;
    classDef external fill:transparent,stroke:#666,stroke-width:1px,stroke-dasharray: 4 4,rx:0,ry:0;

    %% User and UI Layer
    User(["User"]):::client
    
    subgraph BrowserEnvironment [Browser Environment]
        subgraph ReactApp [React Application]
            Hero["Landing Page UI"]:::default
            ChatUI["Chat Interface UI"]:::default
            Dash["Dashboard UI"]:::default
        end
        
        subgraph StateManagement [State & Storage]
            SessionAuth["NextAuth Session State"]:::default
            ChatHook["useChatSessions Hook"]:::default
            LocalStorage[("Browser Local Storage")]:::default
        end
    end
    
    subgraph NextServer [Next.js Server Proxy]
        AuthRoute["Auth Callbacks"]:::proxy
        APIRoutes["Next.js API /api/chat"]:::proxy
    end
    
    subgraph ExternalBackend [Python Agent Backend]
        AgentChat["/chat endpoint/"]:::external
        AgentHistory["/history endpoint/"]:::external
    end
    
    User <--> Hero
    User <--> ChatUI
    User <--> Dash
    
    ChatUI <--> ChatHook
    Dash <--> SessionAuth
    
    ChatHook <--> LocalStorage
    ChatHook <--> APIRoutes
    SessionAuth <--> AuthRoute
    
    APIRoutes --> AgentChat
    APIRoutes --> AgentHistory
```

## 🛠️ Key Components

- **`Hero.tsx` & `SessionTypes.tsx`**: Landing page components featuring GSAP animations and a minimalist monochrome aesthetic.
- **`ChatWindow.tsx` & `MessageBubble.tsx`**: The core conversational interface. Handles optimistic message updates, typing indicators, and parses Markdown from the AI responses.
- **`useChatSessions.ts`**: A custom React hook that manages chat threads using browser local storage, explicitly preventing the storage of abandoned, empty chat threads.
- **Next.js API Routes (`/api/chat/route.ts`)**: Acts as a proxy to the Python backend to prevent exposing the agent's internal URL to the public browser.

## 🎨 Theming & Styling

The application adheres to a strict **Corsair Monochrome** design system:
- **Colors**: Primarily `#1c1c1c` (Black/Dark Gray), `#f4f4f4` (Light Gray), `#fafafa` (Off-white), and `#ebebeb` (Borders).
- **Typography**: Inter font with tight tracking for headings.
- **Animations**: Subtle, hardware-accelerated animations using GSAP (GreenSock) for entrance, hover states, and smooth scrolling.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up environment variables (`.env.local`):
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXTAUTH_SECRET=your_secret
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.
