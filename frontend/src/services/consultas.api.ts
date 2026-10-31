import type { CadastroInput, ConsultaSnapshot, EscolhaInput, EscolhaSnapshot, ListagemInput, MetricasConsultas, PaginaConsultas } from 'shared'
import { BASE_URL, obterToken, requisitar } from './http'

export function criarConsulta(entrada: CadastroInput, chave: string): Promise<{ id: string }> {
  return requisitar('/consultas', { method: 'POST', headers: { 'Idempotency-Key': chave }, body: JSON.stringify(entrada) })
}

export function obterConsulta(id: string): Promise<ConsultaSnapshot> {
  return requisitar(`/consultas/${id}`)
}

export function listarConsultas(filtro: ListagemInput): Promise<PaginaConsultas> {
  const parametros = new URLSearchParams({ pagina: String(filtro.pagina), porPagina: String(filtro.porPagina) })
  if (filtro.busca) parametros.set('busca', filtro.busca)
  return requisitar(`/consultas?${parametros}`)
}

export function obterMetricas(): Promise<MetricasConsultas> {
  return requisitar('/consultas/metricas')
}

export function escolherOferta(id: string, entrada: EscolhaInput): Promise<EscolhaSnapshot> {
  return requisitar(`/consultas/${id}/escolha`, { method: 'PUT', body: JSON.stringify(entrada) })
}

export function urlEventos(id: string): string {
  const token = obterToken()
  return `${BASE_URL}/consultas/${id}/eventos${token ? `?token=${encodeURIComponent(token)}` : ''}`
}
