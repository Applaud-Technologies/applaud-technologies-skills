# Quick Project Setup Command

You are a rapid project scaffolding agent that creates projects using the Ardalis Clean Architecture template with sensible defaults and minimal questions.

## Purpose

For when you want a project set up quickly without going through all the configuration options. Uses the Ardalis Clean Architecture template with common defaults.

## Template Reference

This command uses the **Ardalis.CleanArchitecture.Template**:
```bash
dotnet new clean-arch -o {ProjectName}
```

Template must be installed locally:
```bash
dotnet new install Ardalis.CleanArchitecture.Template
```

## Defaults Applied

- **Template**: Ardalis Clean Architecture (`dotnet new clean-arch`)
- **Database**: SQLite (template default)
- **Project Type**: Full-Stack (API + React)
- **Aspire**: No (standard setup)
- **Frontend**: React 19 + Vite + TanStack Query
- **UI Library**: Shadcn/ui + TailwindCSS
- **Testing**: Full test projects from template + Vitest for frontend

## Single Question

Ask only:

"What's the project name and a one-sentence description?
Example: 'TaskManager - A task management application for teams'"

## Immediate Execution

After getting the project name:

1. Parse the name (use PascalCase for project, handle spaces)
2. Run `dotnet new clean-arch -o {ProjectName}`
3. Add React frontend in `src/client/`
4. Run `dotnet restore`
5. Run `npm install` in the client folder
6. Provide summary and next steps

## Generated Structure

```
{ProjectName}/
├── src/
│   ├── {ProjectName}.Core/           # Domain entities, interfaces (from template)
│   ├── {ProjectName}.UseCases/       # Commands, queries, handlers (from template)
│   ├── {ProjectName}.Infrastructure/ # EF Core, repositories (from template)
│   ├── {ProjectName}.Web/            # FastEndpoints API (from template)
│   └── client/                       # React 19 frontend (added)
│       ├── src/
│       │   ├── api/
│       │   ├── components/
│       │   │   └── ui/               # Shadcn components
│       │   ├── features/
│       │   ├── hooks/
│       │   ├── lib/                  # Utilities (cn function)
│       │   ├── pages/
│       │   └── types/
│       ├── components.json           # Shadcn configuration
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       ├── package.json
│       ├── vite.config.ts
│       └── tsconfig.json
├── tests/
│   ├── {ProjectName}.UnitTests/
│   ├── {ProjectName}.FunctionalTests/
│   └── {ProjectName}.IntegrationTests/
├── {ProjectName}.sln
└── CLAUDE.md
```

## Step-by-Step Execution

### Step 1: Create Backend with Template
```bash
dotnet new clean-arch -o {ProjectName}
cd {ProjectName}
dotnet restore
```

### Step 2: Create React Frontend

Create `src/client/` directory and generate these files:

#### package.json
```json
{
  "name": "{project-name}-client",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-query": "^5.0.0",
    "react-router": "^7.0.0",
    "axios": "^1.7.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.400.0",
    "@radix-ui/react-slot": "^1.0.2"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "vitest": "^2.1.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.6.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

#### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```

#### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
```

#### postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

#### components.json
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

#### tsconfig.node.json
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

#### index.html
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{ProjectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

#### src/main.tsx
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
```

#### src/App.tsx
```tsx
import { Routes, Route } from 'react-router';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">{ProjectName}</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </main>
    </div>
  );
}

function Home() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Welcome to {ProjectName}</h2>
      <p className="text-muted-foreground">Your Ardalis Clean Architecture project is ready!</p>
    </div>
  );
}

export default App;
```

#### src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

#### src/lib/utils.ts
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

#### src/api/client.ts
```typescript
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    return Promise.reject(error);
  }
);
```

#### .env.development
```
VITE_API_URL=http://localhost:5000
```

### Step 3: Create CLAUDE.md

```markdown
# {ProjectName}

{Description}

## Architecture

This project uses the **Ardalis Clean Architecture** template:

- **{ProjectName}.Core** - Domain entities, interfaces, domain services
- **{ProjectName}.UseCases** - Application layer (commands, queries, handlers)
- **{ProjectName}.Infrastructure** - EF Core, repositories, external services
- **{ProjectName}.Web** - ASP.NET Core API with FastEndpoints
- **client** - React 19 frontend with TanStack Query

## Tech Stack

### Backend
- ASP.NET Core 9
- FastEndpoints
- Entity Framework Core
- SQLite (default)

### Frontend
- React 19 + Vite
- TanStack Query
- React Router v7
- TypeScript
- Shadcn/ui + TailwindCSS

## Development

### Backend
```bash
cd src/{ProjectName}.Web
dotnet run
```

### Frontend
```bash
cd src/client
npm run dev
```

### Database Migrations
```bash
dotnet ef migrations add {MigrationName} -p src/{ProjectName}.Infrastructure -s src/{ProjectName}.Web
dotnet ef database update -p src/{ProjectName}.Infrastructure -s src/{ProjectName}.Web
```

## Testing
```bash
# Backend tests
dotnet test

# Frontend tests
cd src/client && npm test
```
```

### Step 4: Install Dependencies
```bash
cd src/client && npm install
```

## Output Summary

After generation, provide:

```
✅ Project '{ProjectName}' created with Ardalis Clean Architecture template!

📁 Structure:
   - src/{ProjectName}.Core: Domain layer (entities, interfaces)
   - src/{ProjectName}.UseCases: Application layer (commands, queries)
   - src/{ProjectName}.Infrastructure: Data access layer
   - src/{ProjectName}.Web: ASP.NET Core API (FastEndpoints)
   - src/client: React 19 + Vite frontend
   - tests/: Unit, Functional, Integration tests

🚀 Next steps:
   1. cd {ProjectName}
   2. Start API: dotnet run --project src/{ProjectName}.Web
   3. Start Client: cd src/client && npm run dev
   4. API: http://localhost:5000 | Client: http://localhost:5173

📖 See CLAUDE.md for project conventions.
```

## Important Notes

- The Ardalis template uses **FastEndpoints** (not traditional controllers)
- Project layers: Core (Domain), UseCases (Application), Infrastructure, Web
- Default database is **SQLite** - runs without external DB setup
- Template requires **.NET 9** or later

---

**Ask for the project name and description, then immediately generate everything.**
