import { z } from 'zod'
import { MCPTool, MCPResponse } from '../types'
import { PokemonAPIService } from '../services/pokemon-api'

const pokemonService = new PokemonAPIService()

const getPokemonSchema = z.object({
  identifier: z.string().describe('Pokemon name or ID number'),
})

const getPokemonBasicSchema = z.object({
  identifier: z.string().describe('Pokemon name or ID number'),
})

export const pokemonTools: MCPTool[] = [
  {
    name: 'get_pokemon',
    description: 'Get detailed Pokemon information including stats, abilities, types, description, and sprites',
    inputSchema: {
      type: 'object',
      properties: {
        identifier: {
          type: 'string',
          description: 'Pokemon name or ID number (e.g., "pikachu", "25", "charizard")',
        },
      },
      required: ['identifier'],
    },
  },
  {
    name: 'get_pokemon_basic',
    description: 'Get basic Pokemon information (name, ID, height, weight, base experience)',
    inputSchema: {
      type: 'object',
      properties: {
        identifier: {
          type: 'string',
          description: 'Pokemon name or ID number (e.g., "pikachu", "25", "charizard")',
        },
      },
      required: ['identifier'],
    },
  },
]

export async function executePokemonTool(
  name: string,
  args: Record<string, unknown>
): Promise<MCPResponse> {
  try {
    switch (name) {
      case 'get_pokemon': {
        const { identifier } = getPokemonSchema.parse(args)
        const pokemonData = await pokemonService.getPokemonWithSpecies(identifier)
        const formattedData = pokemonService.formatPokemonData(pokemonData)
        
        return {
          content: [
            {
              type: 'text',
              text: formattedData,
            },
          ],
        }
      }

      case 'get_pokemon_basic': {
        const { identifier } = getPokemonBasicSchema.parse(args)
        const pokemon = await pokemonService.getPokemon(identifier)
        
        const basicInfo = `🎮 **${pokemon.name.toUpperCase()}** (#${pokemon.id})

📋 **Basic Information:**
• Height: ${pokemon.height / 10}m
• Weight: ${pokemon.weight / 10}kg
• Base Experience: ${pokemon.base_experience}
• Types: ${pokemon.types.map(t => t.type.name).join(', ')}`

        return {
          content: [
            {
              type: 'text',
              text: basicInfo,
            },
          ],
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error: ${errorMessage}`,
        },
      ],
    }
  }
}
