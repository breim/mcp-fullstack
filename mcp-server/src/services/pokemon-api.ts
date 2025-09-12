import { Pokemon, PokemonSpecies } from '../types'

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2'

export class PokemonAPIService {
  private async fetchFromAPI<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${POKEAPI_BASE_URL}${endpoint}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data as T
    } catch (error) {
      console.error(`Error fetching from PokeAPI: ${endpoint}`, error)
      throw new Error(`Failed to fetch data from PokeAPI: ${error}`)
    }
  }

  async getPokemon(identifier: string | number): Promise<Pokemon> {
    const endpoint = `/pokemon/${identifier}`
    return this.fetchFromAPI<Pokemon>(endpoint)
  }

  async getPokemonSpecies(identifier: string | number): Promise<PokemonSpecies> {
    const endpoint = `/pokemon-species/${identifier}`
    return this.fetchFromAPI<PokemonSpecies>(endpoint)
  }

  async getPokemonWithSpecies(identifier: string | number) {
    try {
      const [pokemon, species] = await Promise.all([
        this.getPokemon(identifier),
        this.getPokemonSpecies(identifier),
      ])

      const englishFlavorText = species.flavor_text_entries.find(
        entry => entry.language.name === 'en'
      )?.flavor_text.replace(/\f/g, ' ').replace(/\n/g, ' ') || 'No description available.'

      return {
        basic: {
          id: pokemon.id,
          name: pokemon.name,
          height: pokemon.height,
          weight: pokemon.weight,
          base_experience: pokemon.base_experience,
        },
        description: englishFlavorText,
        types: pokemon.types.map(t => t.type.name),
        abilities: pokemon.abilities.map(a => ({
          name: a.ability.name,
          is_hidden: a.is_hidden,
        })),
        stats: pokemon.stats.map(s => ({
          name: s.stat.name,
          base_stat: s.base_stat,
        })),
        sprites: {
          front_default: pokemon.sprites.front_default,
          front_shiny: pokemon.sprites.front_shiny,
        },
        species_info: {
          color: species.color.name,
          habitat: species.habitat?.name || 'unknown',
          generation: species.generation.name,
        },
      }
    } catch (error) {
      throw new Error(`Failed to get complete Pokemon data: ${error}`)
    }
  }

  formatPokemonData(data: ReturnType<typeof this.getPokemonWithSpecies> extends Promise<infer T> ? T : never): string {
    return `🎮 **${data.basic.name.toUpperCase()}** (#${data.basic.id})

📋 **Basic Info:**
• Height: ${data.basic.height / 10}m
• Weight: ${data.basic.weight / 10}kg
• Base Experience: ${data.basic.base_experience}

📝 **Description:**
${data.description}

🏷️ **Types:** ${data.types.join(', ')}

⚡ **Abilities:**
${data.abilities.map(a => `• ${a.name}${a.is_hidden ? ' (Hidden)' : ''}`).join('\n')}

📊 **Stats:**
${data.stats.map(s => `• ${s.name}: ${s.base_stat}`).join('\n')}

🎨 **Species Info:**
• Color: ${data.species_info.color}
• Habitat: ${data.species_info.habitat}
• Generation: ${data.species_info.generation}

🖼️ **Sprites:**
• Default: ${data.sprites.front_default || 'Not available'}
• Shiny: ${data.sprites.front_shiny || 'Not available'}`
  }
}
