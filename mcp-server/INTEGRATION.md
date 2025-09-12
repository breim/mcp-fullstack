# LangChain Next.js Boilerplate Integration Guide

This document provides a detailed explanation of how the Pokemon MCP Server integrates with the langchain-nextjs-boilerplate system.

## 🏗️ Architecture Overview

The integration follows a clean architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        langchain-nextjs-boilerplate                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │ Chat Interface  │    │ Conversation    │    │ Message Management      │  │
│  │ (React/Next.js) │◄──►│ Actions         │◄──►│ (Prisma Database)       │  │
│  │                 │    │ (Server Actions)│    │                         │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘  │
│           │                       │                           │              │
│           │                       │                           │              │
│           ▼                       ▼                           ▼              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │ LangChain       │    │ Memory          │    │ Agent Execution         │  │
│  │ Service         │◄──►│ Manager         │◄──►│ (ConversationAgent)     │  │
│  │                 │    │                 │    │                         │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘  │
│           │                       │                           │              │
│           │                       │                           │              │
│           ▼                       ▼                           ▼              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │ Tool Manager    │    │ Tool Aggregator │    │ MCP Tool Loader         │  │
│  │                 │◄──►│                 │◄──►│                         │  │
│  │                 │    │                 │    │                         │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘  │
│           │                       │                           │              │
│           │                       │                           │              │
│           ▼                       ▼                           ▼              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │ MCP Service     │    │ HTTP Client     │    │ Schema Conversion       │  │
│  │ (API Client)    │◄──►│ (fetch)         │◄──►│ (MCP → LangChain)       │  │
│  │                 │    │                 │    │                         │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘  │
│                                   │                                          │
└───────────────────────────────────┼──────────────────────────────────────────┘
                                    │ HTTP Requests (Port 3001)
                                    │
┌───────────────────────────────────┼──────────────────────────────────────────┐
│                                   ▼                                          │
│                          Pokemon MCP Server                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │ Express Server  │    │ Tool Registry   │    │ Request Handler         │  │
│  │ (Port 3001)     │◄──►│ (Pokemon Tools) │◄──►│ (Validation & Routing)  │  │
│  │                 │    │                 │    │                         │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘  │
│           │                       │                           │              │
│           │                       │                           │              │
│           ▼                       ▼                           ▼              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │ Pokemon API     │    │ Data Formatting │    │ Error Handling          │  │
│  │ Service         │◄──►│ & Validation    │◄──►│ & Logging               │  │
│  │                 │    │                 │    │                         │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘  │
│           │                                                                 │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        PokeAPI Integration                          │  │
│  │                    (https://pokeapi.co/api/v2)                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

### 1. User Interaction Flow

```typescript
// User types: "Tell me about Charizard"
// File: src/app/chat/[conversationId]/page.tsx

1. User Input → Message Input Component
2. Component → sendMessage Server Action
3. Server Action → LangChain Service
4. LangChain Service → Conversation Manager
5. Conversation Manager → Agent Execution
```

### 2. Tool Loading Flow

```typescript
// File: src/managers/tool-manager.ts
export const getToolsForConversation = async (conversationId: string) => {
  const toolsResult = await loadAllToolsForConversation(conversationId)
  // Returns: { mcpTools, allTools, totalCount }
}

// File: src/tools/tool-aggregator.ts
export async function loadAllToolsForConversation(conversationId?: string) {
  const mcpTools = await loadMCPTools() // Loads Pokemon tools
  return {
    mcpTools,
    allTools: [...mcpTools], // Can include other tool types
    totalCount: mcpTools.length
  }
}
```

### 3. MCP Tool Loading Flow

```typescript
// File: src/tools/mcp-tool-loader.ts
export const loadMCPTools = async (): Promise<StructuredTool[]> => {
  try {
    console.log('[MCP_LOADER] Loading MCP tools...')
    
    // 1. Fetch available tools from MCP server
    const mcpToolsData = await getTools() // HTTP GET to localhost:3001/tools
    
    // 2. Convert MCP tools to LangChain StructuredTool format
    const tools = mcpToolsData.map(tool => createMCPStructuredTool(tool))
    
    console.log(`[MCP_LOADER] Loaded ${tools.length} MCP tools:`, 
      tools.map(t => t.name).join(', '))
    
    return tools
  } catch (error) {
    console.error('[MCP_LOADER] Error loading MCP tools:', error)
    return []
  }
}
```

### 4. Tool Execution Flow

```typescript
// When LangChain agent decides to use a Pokemon tool:

1. Agent → calls tool._call(args)
2. StructuredTool → callTool(name, args) // MCP Service
3. MCP Service → HTTP POST to localhost:3001/tools/call
4. MCP Server → executePokemonTool(name, args)
5. Pokemon Tools → PokemonAPIService
6. Pokemon API Service → fetch from PokeAPI
7. Response flows back through the chain
```

## 🔧 Integration Components

### 1. MCP Service (`src/services/mcp-service.ts`)

**Purpose**: HTTP client for communicating with MCP server

```typescript
export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: string
    properties: Record<string, unknown>
    required?: string[]
  }
}

export interface MCPResponse {
  content: Array<{
    type: 'text'
    text: string
  }>
}

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

### 2. MCP Tool Loader (`src/tools/mcp-tool-loader.ts`)

**Purpose**: Convert MCP tools to LangChain StructuredTool format

```typescript
const createMCPStructuredTool = (mcpTool: MCPTool): StructuredTool => {
  return new (class extends StructuredTool {
    name = mcpTool.name
    description = mcpTool.description
    schema = convertMCPSchemaToZod(mcpTool.inputSchema)

    async _call(args: unknown): Promise<string> {
      try {
        const result = await callTool(
          this.name,
          (args ?? {}) as Record<string, unknown>
        )
        return result.content.map(c => c.text).join('\n')
      } catch (error) {
        throw new Error(`Error calling MCP tool ${this.name}: ${error}`)
      }
    }
  })()
}
```

### 3. Tool Aggregator (`src/tools/tool-aggregator.ts`)

**Purpose**: Combine tools from different sources

```typescript
export interface ToolLoadResult {
  mcpTools: StructuredTool[]
  allTools: StructuredTool[]
  totalCount: number
}

export async function loadAllToolsForConversation(
  conversationId?: string
): Promise<ToolLoadResult> {
  const allTools: StructuredTool[] = []

  // Load MCP Tools
  const mcpTools = await loadMCPTools()
  allTools.push(...mcpTools)

  // Future: Load other tool types
  // const dbTools = await loadDatabaseTools()
  // const apiTools = await loadAPITools()
  // allTools.push(...dbTools, ...apiTools)

  return {
    mcpTools,
    allTools,
    totalCount: allTools.length
  }
}
```

### 4. Tool Manager (`src/managers/tool-manager.ts`)

**Purpose**: Manage tool lifecycle and caching

```typescript
const toolsCache = new Map<string, ToolLoadResult>()

export const getToolsForConversation = async (
  conversationId: string
): Promise<ToolLoadResult> => {
  if (!toolsCache.has(conversationId)) {
    const toolsResult = await loadAllToolsForConversation(conversationId)
    toolsCache.set(conversationId, toolsResult)
  }
  return toolsCache.get(conversationId)!
}

export const refreshToolsForConversation = async (
  conversationId: string
): Promise<ToolLoadResult> => {
  const toolsResult = await loadAllToolsForConversation(conversationId)
  toolsCache.set(conversationId, toolsResult)
  return toolsResult
}
```

### 5. Conversation Manager (`src/managers/conversation-manager.ts`)

**Purpose**: Orchestrate agent creation and execution

```typescript
export const getOrCreateAgent = async (
  conversationId: string
): Promise<ConversationAgent> => {
  if (!conversationAgents.has(conversationId)) {
    const toolsResult = await toolManager.getToolsForConversation(conversationId)
    const memory = memoryManager.getOrCreateMemory(conversationId)

    const config: ConversationAgentConfig = {
      conversationId,
      tools: toolsResult.allTools, // Includes Pokemon tools
      memory: memory as ConversationSummaryBufferMemory,
      verbose: process.env.NODE_ENV === 'development'
    }

    const agent = new ConversationAgent(config)
    conversationAgents.set(conversationId, agent)
  }
  return conversationAgents.get(conversationId)!
}
```

## 🎯 Usage Examples

### Example 1: Basic Pokemon Query

**User Input**: "What's Pikachu's height and weight?"

**Flow**:
1. User sends message through chat interface
2. `sendMessage` server action receives request
3. LangChain service processes message
4. Agent identifies need for Pokemon data
5. Agent calls `get_pokemon_basic` tool with `identifier: "pikachu"`
6. MCP tool loader converts to HTTP request
7. MCP server queries PokeAPI
8. Formatted response returns through chain
9. Agent provides natural language response to user

### Example 2: Detailed Pokemon Information

**User Input**: "Tell me everything about Charizard"

**Response Flow**:
```typescript
// Agent decides to use get_pokemon tool
{
  "name": "get_pokemon",
  "arguments": {
    "identifier": "charizard"
  }
}

// MCP Server Response
{
  "content": [
    {
      "type": "text",
      "text": "🎮 **CHARIZARD** (#6)\n\n📋 **Basic Info:**\n• Height: 1.7m\n• Weight: 90.5kg\n• Base Experience: 240\n\n📝 **Description:**\nSpits fire that is hot enough to melt boulders. Known to cause forest fires unintentionally.\n\n🏷️ **Types:** fire, flying\n\n⚡ **Abilities:**\n• blaze\n• solar-power (Hidden)\n\n📊 **Stats:**\n• hp: 78\n• attack: 84\n• defense: 78\n• special-attack: 109\n• special-defense: 85\n• speed: 100"
    }
  ]
}
```

## 🔍 Debugging Integration

### Enable Debug Logging

```bash
# In langchain-nextjs-boilerplate
NODE_ENV=development npm run dev

# In mcp-server
NODE_ENV=development npm run dev
```

### Debug Endpoints

```bash
# Check if MCP server is running
curl http://localhost:3001/health

# List available tools
curl http://localhost:3001/tools

# Test tool execution
curl -X POST http://localhost:3001/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name": "get_pokemon_basic", "arguments": {"identifier": "pikachu"}}'
```

### Common Debug Commands

```typescript
// In browser console or server logs:

// Check if tools are loaded
console.log(await langchainService.getToolsInfo('conversation-id'))

// Debug conversation state
console.log(await langchainService.debugConversation('conversation-id'))

// Check tool count
console.log(await langchainService.getAvailableTools('conversation-id').length)
```

## 🚨 Error Handling

### MCP Server Unavailable

```typescript
// mcp-service.ts handles server downtime gracefully
export const getTools = async (): Promise<MCPTool[]> => {
  try {
    const response = await fetch(`${baseUrl}/tools`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching MCP tools:', error)
    return [] // Returns empty array, agent continues without Pokemon tools
  }
}
```

### Tool Execution Errors

```typescript
// mcp-tool-loader.ts handles individual tool errors
async _call(args: unknown): Promise<string> {
  try {
    const result = await callTool(this.name, args ?? {})
    return result.content.map(c => c.text).join('\n')
  } catch (error) {
    throw new Error(`Error calling MCP tool ${this.name}: ${error}`)
  }
}
```

### Agent Fallback

```typescript
// langchain-service.ts provides fallback when tools fail
export const sendMessage = async (conversationId: string, message: string) => {
  try {
    const response = await conversationManager.executeMessage(conversationId, message)
    return response
  } catch (error) {
    console.error('❌ [LANGCHAIN_SERVICE] Error processing message:', error)
    
    // Fallback: Use LLM directly without tools
    try {
      const summary = await memoryManager.getMemoryHistory(conversationId)
      const response = await llm.invoke([
        new HumanMessage(`Previous context: ${summary}\n\nUser: ${message}`)
      ])
      return response.content as string
    } catch (fallbackError) {
      throw new Error('Failed to process message with both agent and fallback')
    }
  }
}
```

## 🔐 Configuration

### Environment Variables

```bash
# langchain-nextjs-boilerplate/.env
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=your_database_url_here

# mcp-server/.env (optional)
PORT=3001
NODE_ENV=development
```

### MCP Server URL Configuration

```typescript
// Change MCP server URL if needed
import { setBaseUrl } from '@/services/mcp-service'

// During app initialization
setBaseUrl('http://your-mcp-server:3001')
```

## 🚀 Deployment Considerations

### Development
- Run both servers simultaneously
- MCP server on port 3001
- Next.js app on port 3000

### Production
- Deploy MCP server to separate service
- Update MCP service base URL
- Ensure network connectivity between services
- Consider adding authentication/rate limiting

### Docker Deployment

```dockerfile
# MCP Server Dockerfile
FROM node:22.13.1-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

This integration provides a robust, scalable foundation for adding external API capabilities to the LangChain Next.js boilerplate through the Model Context Protocol.
