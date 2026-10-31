import type { CadastroInput, ConsultaResumo, ConsultaSnapshot, EscolhaInput, EscolhaSnapshot } from 'shared'
import { BASE_URL, obterToken, requisitar } from './http'

export function criarConsulta(entrada: CadastroInput, chave: string): Promise<{ id: string }> {
  return requisitar('/consultas', { method: 'POST', headers: { 'Idempotency-Key': chave }, body: JSON.stringify(entrada) })
}

export function obterConsulta(id: string): Promise<ConsultaSnapshot> {
  return requisitar(`/consultas/${id}`)
}

export function listarConsultas(): Promise<ConsultaResumo[]> {
  return requisitar('/consultas')
}

export function escolherOferta(id: string, entrada: EscolhaInput): Promise<EscolhaSnapshot> {
  return requisitar(`/consultas/${id}/escolha`, { method: 'PUT', body: JSON.stringify(entrada) })
}

export function urlEventos(id: string): string {
  const token = obterToken()
  return `${BASE_URL}/consultas/${id}/eventos${token ? `?token=${encodeURIComponent(token)}` : ''}`
}
