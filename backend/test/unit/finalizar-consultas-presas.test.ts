import type { EventoConsulta } from 'shared'
import { FinalizarConsultasPresas } from '../../src/application/consultas/finalizar-consultas-presas'
import { CanalConsultas } from '../../src/infra/events/canal-consultas'
import { ConsultaRepositorioMemoria } from '../helpers/repositorio-memoria'

const PRAZO = 10_000

it('fecha consultas em andamento mais antigas que o prazo e marca pendentes como timeout', async () => {
  const consultas = new ConsultaRepositorioMemoria()
  const eventos = new CanalConsultas()
  const agora = Date.parse('2026-10-30T12:00:00Z')
  const relogio = { agora: () => agora, esperar: async () => {} }

  const presa = await consultas.criar({ usuarioId: 'u', pacienteId: 'p', valorTratamento: 1, cenario: 'aleatorio', chaveIdempotencia: 'a' })
  consultas.consultas.set(presa.id, { ...presa, criadaEm: new Date(agora - PRAZO - 1) })
  await consultas.gravarResultado({ consultaId: presa.id, financeira: 'alfa', status: 'aprovada', motivo: null, valorAprovado: 1, taxaMensal: 1, prazos: [6], duracaoMs: 1, respondidoEm: new Date() })
  await consultas.gravarResultado({ consultaId: presa.id, financeira: 'delta', status: 'consultando', motivo: null, valorAprovado: null, taxaMensal: null, prazos: [], duracaoMs: null, respondidoEm: null })

  const recente = await consultas.criar({ usuarioId: 'u', pacienteId: 'p', valorTratamento: 1, cenario: 'aleatorio', chaveIdempotencia: 'b' })
  consultas.consultas.set(recente.id, { ...recente, criadaEm: new Date(agora - 1000) })

  const recebidos: EventoConsulta[] = []
  eventos.assinar(presa.id, e => recebidos.push(e))

  const fechadas = await new FinalizarConsultasPresas({ consultas, eventos, relogio, prazoMs: PRAZO }).executar()

  expect(fechadas).toBe(1)
  expect((await consultas.buscarPorId(presa.id))?.status).toBe('finalizada')
  const resultados = await consultas.resultados(presa.id)
  expect(resultados.find(r => r.financeira === 'delta')).toMatchObject({ status: 'indisponivel', motivo: 'timeout' })
  expect(resultados.find(r => r.financeira === 'alfa')?.status).toBe('aprovada')
  expect(recebidos.at(-1)?.tipo).toBe('consulta-finalizada')
  expect((await consultas.buscarPorId(recente.id))?.status).toBe('em_andamento')
})
