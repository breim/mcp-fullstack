import express from 'express'
import cors from 'cors'
import { pokemonTools, executePokemonTool } from './tools/pokemon-tools'
import { MCPToolCall } from './types'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Pokemon MCP Server'
  })
})

app.get('/tools', (req, res) => {
  try {
    console.log('Returning available tools:', pokemonTools.length)
    res.json(pokemonTools)
  } catch (error) {
    console.error('Error getting tools:', error)
    res.status(500).json({ 
      error: 'Failed to get tools',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

app.post('/tools/call', async (req, res) => {
  try {
    const { name, arguments: args } = req.body as MCPToolCall
    
    console.log(`Calling tool: ${name} with args:`, args)
    
    if (!name) {
      return res.status(400).json({ 
        error: 'Tool name is required' 
      })
    }

    const toolExists = pokemonTools.some(tool => tool.name === name)
    if (!toolExists) {
      return res.status(404).json({ 
        error: `Tool '${name}' not found`,
        availableTools: pokemonTools.map(t => t.name)
      })
    }

    const result = await executePokemonTool(name, args || {})
    console.log(`Tool ${name} executed successfully`)
    
    return res.json(result)
  } catch (error) {
    console.error('Error calling tool:', error)
    return res.status(500).json({ 
      error: 'Failed to execute tool',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'GET /tools', 
      'POST /tools/call'
    ]
  })
})

app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error)
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Pokemon MCP Server running on port ${PORT}`)
  console.log(`📡 Health check: http://localhost:${PORT}/health`)
  console.log(`🛠️  Tools endpoint: http://localhost:${PORT}/tools`)
  console.log(`📞 Call endpoint: http://localhost:${PORT}/tools/call`)
  console.log(`📋 Available tools: ${pokemonTools.length}`)
  pokemonTools.forEach(tool => {
    console.log(`   • ${tool.name}: ${tool.description}`)
  })
})

export default app
