# Pokemon MCP Server

A Model Context Protocol (MCP) server that provides tools to access Pokemon information through the [PokeAPI](https://pokeapi.co/). This server was developed to integrate seamlessly with the langchain-nextjs-boilerplate system.

## Table of Contents

- [Features](#-features)
- [Installation](#️-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Reference](#-api-reference)
- [LangChain Integration](#-langchain-integration)
- [Development](#-development)
- [Project Structure](#-project-structure)
- [Types and Interfaces](#-types-and-interfaces)

## Features

### Available Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_pokemon` | Complete Pokemon information | `identifier` (string) |
| `get_pokemon_basic` | Basic Pokemon information | `identifier` (string) |

### Included Features

- **Complete Information**: Stats, abilities, types, description
- **Sprites**: Normal and shiny images
- **Species Data**: Color, habitat, generation
- **Validation**: Zod schemas for input and output
- **Error Handling**: Robust error handling
- **TypeScript**: Fully typed
- **Hot Reload**: Development with automatic reloading

## Installation

### Prerequisites

- Node.js 22.13.1 (recommended)
- npm or yarn

### Setup

```bash
# Navigate to MCP server directory
cd mcp-server

# Install dependencies
npm install

# Development (with hot reload)
npm run dev

# Build for production
npm run build

# Run production version
npm start
```

## Configuration

### Environment Variables

```bash
# .env (optional)
PORT=3001                    # Server port (default: 3001)
NODE_ENV=development         # Runtime environment
```

### Available Scripts

```bash
npm run dev          # Development with hot reload
npm run build        # TypeScript build for production
npm start            # Run compiled version
npm run lint         # Check code with ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run format:check # Check formatting
```

## Usage


### List Tools

```bash
curl http://localhost:3001/tools
```

### Call Tool

```bash
curl -X POST http://localhost:3001/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_pokemon",
    "arguments": {
      "identifier": "charizard"
    }
  }'
```

## API Reference

### GET /health

**Description:** Server health check

**Response:**
```typescript
{
  status: 'healthy',
  timestamp: string,
  service: string
}
```

### GET /tools

**Description:** List all available tools

**Response:**
```typescript
Array<{
  name: string,
  description: string,
  inputSchema: {
    type: string,
    properties: Record<string, unknown>,
    required?: string[]
  }
}>
```

### POST /tools/call

**Description:** Execute a specific tool

**Body:**
```typescript
{
  name: string,
  arguments: Record<string, unknown>
}
```

**Response:**
```typescript
{
  content: Array<{
    type: 'text',
    text: string
  }>
}
```

## LangChain Integration

### Integration Architecture

```
┌─────────────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│ langchain-nextjs-       │    │ MCP Service          │    │ Pokemon MCP     │
│ boilerplate             │    │ (Frontend)           │    │ Server          │
├─────────────────────────┤    ├──────────────────────┤    ├─────────────────┤
│ • Chat Interface        │◄──►│ • Tool Loader        │◄──►│ • Pokemon Tools │
│ • Message Management    │    │ • API Client         │    │ • PokeAPI       │
│ • Conversation History  │    │ • Error Handling     │    │ • Data Format   │
└─────────────────────────┘    └──────────────────────┘    └─────────────────┘
```

### Communication Flow

1. **User Input**: User asks a question about Pokemon in the chat
2. **Agent Processing**: LangChain agent identifies the need to fetch data
3. **Tool Loading**: `mcp-service.ts` loads tools from MCP server
4. **Tool Execution**: `mcp-tool-loader.ts` executes specific tool
5. **Data Retrieval**: MCP server queries PokeAPI
6. **Response Formatting**: Formatted data is returned
7. **Agent Response**: LangChain agent processes and responds to user

### Frontend Configuration

The `mcp-service.ts` is already configured to connect with the MCP server:

```typescript
// langchain-nextjs-boilerplate/src/services/mcp-service.ts
const DEFAULT_BASE_URL = 'http://localhost:3001'

export const getTools = async (): Promise<MCPTool[]> => {
  const response = await fetch(`${baseUrl}/tools`)
  return await response.json()
}

export const callTool = async (
  name: string,
  arguments_: Record<string, unknown>
): Promise<MCPResponse> => {
  const response = await fetch(`${baseUrl}/tools/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, arguments: arguments_ })
  })
  return await response.json()
}
```

### How Tools Are Loaded

```typescript
// langchain-nextjs-boilerplate/src/tools/mcp-tool-loader.ts
export const loadMCPTools = async (): Promise<StructuredTool[]> => {
  const mcpToolsData = await getTools()
  const tools = mcpToolsData.map(tool => createMCPStructuredTool(tool))
  return tools
}
```

### Chat Usage Example

```typescript
// User asks: "Tell me about Charizard"
// 1. Agent identifies it needs Pokemon data
// 2. Calls get_pokemon tool with identifier: "charizard"  
// 3. MCP server fetches data from PokeAPI
// 4. Returns formatted information
// 5. Agent uses the data to respond to user
```

## Development

### Folder Structure

```
mcp-server/
├── src/
│   ├── index.ts              # Main Express server
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   ├── services/
│   │   └── pokemon-api.ts    # Service to consume PokeAPI
│   └── tools/
│       └── pokemon-tools.ts  # MCP tools for Pokemon
├── dist/                     # Compiled code (generated)
├── package.json              # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── .eslintrc.js             # ESLint configuration
├── .prettierrc              # Prettier configuration
```

### Adding New Tools

1. **Define Types** in `src/types/index.ts`
2. **Create Tool** in `src/tools/`
3. **Register** in `src/index.ts`
4. **Test** endpoints

Example:
```typescript
// src/tools/new-tool.ts
export const newTool: MCPTool = {
  name: 'new_tool',
  description: 'Description of the new tool',
  inputSchema: {
    type: 'object',
    properties: {
      param: { type: 'string', description: 'Parameter description' }
    },
    required: ['param']
  }
}
```

### Testing

```bash
# Test health check
curl http://localhost:3001/health

# Test tool listing  
curl http://localhost:3001/tools

# Test tool execution
curl -X POST http://localhost:3001/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name": "get_pokemon_basic", "arguments": {"identifier": "pikachu"}}'
```

## Project Structure

### Main Dependencies

```json
{
  "dependencies": {
    "cors": "^2.8.5",           // CORS middleware
    "express": "^4.19.2",       // Web server
    "zod": "^3.23.8"           // Schema validation
  },
  "devDependencies": {
    "@types/express": "^4.17.21",        // TypeScript types
    "@typescript-eslint/*": "^7.1.1",    // ESLint for TypeScript
    "eslint": "^8.57.0",                 // Linter
    "prettier": "^3.2.5",                // Code formatter
    "tsx": "^4.7.1",                     // TypeScript executor
    "typescript": "^5.4.2"               // TypeScript compiler
  }
}
```

### Configurations

#### TypeScript (`tsconfig.json`)
- Target: ES2022
- Module: CommonJS
- Strict mode enabled
- Source maps and declarations

#### ESLint (`.eslintrc.js`)
- TypeScript configuration
- Prettier integration
- Custom rules

#### Prettier (`.prettierrc`)
- Single quotes
- No semicolons
- 2 spaces indentation

## Types and Interfaces

### MCPTool
```typescript
interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: string
    properties: Record<string, unknown>
    required?: string[]
  }
}
```

### Pokemon
```typescript
interface Pokemon {
  id: number
  name: string
  height: number
  weight: number
  base_experience: number
  types: PokemonType[]
  abilities: PokemonAbility[]
  stats: PokemonStat[]
  sprites: PokemonSprite
}
```

### MCPResponse
```typescript
interface MCPResponse {
  content: Array<{
    type: 'text'
    text: string
  }>
}
```

## Deployment

### Development
```bash
npm run dev  # Runs on port 3001
```

### Production
```bash
npm run build
npm start
```

### Docker (optional)
```dockerfile
FROM node:22.13.1-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

1. **Port in use**: `lsof -ti:3001 | xargs kill -9`
2. **Modules not found**: `npm install`
3. **Build error**: Check relative imports
4. **PokeAPI down**: Check status at https://pokeapi.co

### Logs

The server includes detailed logs:
- HTTP requests
- Tool execution
- Errors with stack trace

### Debug

```bash
NODE_ENV=development npm run dev  # Verbose logs
```

---
