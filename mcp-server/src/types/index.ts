export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: string
    properties: Record<string, unknown>
    required?: string[]
  }
}

export interface MCPToolCall {
  name: string
  arguments: Record<string, unknown>
}

export interface MCPResponse {
  content: Array<{
    type: 'text'
    text: string
  }>
}

export interface PokemonBasicInfo {
  id: number
  name: string
  height: number
  weight: number
  base_experience: number
}

export interface PokemonType {
  slot: number
  type: {
    name: string
    url: string
  }
}

export interface PokemonAbility {
  ability: {
    name: string
    url: string
  }
  is_hidden: boolean
  slot: number
}

export interface PokemonStat {
  base_stat: number
  effort: number
  stat: {
    name: string
    url: string
  }
}

export interface PokemonSprite {
  front_default: string | null
  front_shiny: string | null
  back_default: string | null
  back_shiny: string | null
}

export interface Pokemon {
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

export interface PokemonSpecies {
  id: number
  name: string
  color: {
    name: string
  }
  habitat: {
    name: string
  } | null
  flavor_text_entries: Array<{
    flavor_text: string
    language: {
      name: string
    }
  }>
  generation: {
    name: string
  }
}
