import type { ConfigResposta } from 'shared'
import { requisitar } from './http'

export function obterConfig(): Promise<ConfigResposta> {
  return requisitar<ConfigResposta>('/config')
}
