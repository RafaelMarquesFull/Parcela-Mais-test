import type { EventoConsulta } from 'shared'

export type OuvinteEventos = (evento: EventoConsulta) => void

export interface PublicadorEventos {
  publicar(consultaId: string, evento: EventoConsulta): void
  assinar(consultaId: string, ouvinte: OuvinteEventos): () => void
}
