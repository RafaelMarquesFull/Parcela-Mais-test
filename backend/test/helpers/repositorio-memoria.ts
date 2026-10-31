import { randomUUID } from 'node:crypto'
import type { ConsultaResumo } from 'shared'
import type { Consulta, NovaConsulta } from '../../src/domain/entities/consulta'
import type { Escolha, NovaEscolha } from '../../src/domain/entities/escolha'
import type { NovoPaciente, Paciente } from '../../src/domain/entities/paciente'
import type { NovoResultado, ResultadoFinanceira } from '../../src/domain/entities/resultado-financeira'
import type { ConsultaRepositorio } from '../../src/domain/ports/consulta.repository'
import type { PacienteRepositorio } from '../../src/domain/ports/paciente.repository'
import type { NovoRefreshToken, RefreshToken } from '../../src/domain/entities/refresh-token'
import type { Usuario } from '../../src/domain/entities/usuario'
import type { RefreshTokenRepositorio } from '../../src/domain/ports/refresh-token.repository'
import type { UsuarioRepositorio } from '../../src/domain/ports/usuario.repository'

export class ConsultaRepositorioMemoria implements ConsultaRepositorio {
  readonly consultas = new Map<string, Consulta>()
  readonly resultadosPorConsulta = new Map<string, ResultadoFinanceira[]>()
  readonly escolhas = new Map<string, Escolha>()
  nomesPacientes = new Map<string, string>()

  async criar(dados: NovaConsulta): Promise<Consulta> {
    const existente = [...this.consultas.values()].find(c => c.chaveIdempotencia === dados.chaveIdempotencia)
    if (existente) throw new Error('chave duplicada')
    const consulta: Consulta = { ...dados, id: randomUUID(), status: 'em_andamento', criadaEm: new Date(), finalizadaEm: null }
    this.consultas.set(consulta.id, consulta)
    return consulta
  }

  async buscarPorId(id: string) {
    return this.consultas.get(id) ?? null
  }

  async buscarPorChave(chave: string) {
    return [...this.consultas.values()].find(c => c.chaveIdempotencia === chave) ?? null
  }

  async listar(usuarioId: string): Promise<ConsultaResumo[]> {
    return [...this.consultas.values()]
      .filter(c => c.usuarioId === usuarioId)
      .map(c => ({
        id: c.id,
        pacienteNome: this.nomesPacientes.get(c.pacienteId) ?? '',
        valorTratamento: c.valorTratamento,
        status: c.status,
        aprovadas: (this.resultadosPorConsulta.get(c.id) ?? []).filter(r => r.status === 'aprovada').length,
        criadaEm: c.criadaEm.toISOString(),
      }))
  }

  async resultados(consultaId: string) {
    return [...(this.resultadosPorConsulta.get(consultaId) ?? [])]
  }

  async gravarResultado(dados: NovoResultado): Promise<ResultadoFinanceira> {
    const lista = this.resultadosPorConsulta.get(dados.consultaId) ?? []
    const indice = lista.findIndex(r => r.financeira === dados.financeira)
    const registro: ResultadoFinanceira = { ...dados, id: indice >= 0 ? lista[indice]!.id : randomUUID() }
    if (indice >= 0) lista[indice] = registro
    else lista.push(registro)
    this.resultadosPorConsulta.set(dados.consultaId, lista)
    return registro
  }

  async gravarResultados(lista: NovoResultado[]) {
    for (const dados of lista) await this.gravarResultado(dados)
  }

  async finalizar(id: string, finalizadaEm: Date) {
    const consulta = this.consultas.get(id)
    if (consulta) this.consultas.set(id, { ...consulta, status: 'finalizada', finalizadaEm })
  }

  async escolha(consultaId: string) {
    return this.escolhas.get(consultaId) ?? null
  }

  async gravarEscolha(dados: NovaEscolha): Promise<Escolha> {
    if (this.escolhas.has(dados.consultaId)) throw new Error('escolha duplicada')
    const escolha: Escolha = { ...dados, id: randomUUID(), criadaEm: new Date() }
    this.escolhas.set(dados.consultaId, escolha)
    return escolha
  }
}

export class PacienteRepositorioMemoria implements PacienteRepositorio {
  readonly pacientes = new Map<string, Paciente>()

  async criar(dados: NovoPaciente): Promise<Paciente> {
    const paciente: Paciente = { ...dados, id: randomUUID(), criadoEm: new Date() }
    this.pacientes.set(paciente.id, paciente)
    return paciente
  }

  async buscarPorId(id: string) {
    return this.pacientes.get(id) ?? null
  }
}

export class UsuarioRepositorioMemoria implements UsuarioRepositorio {
  constructor(private readonly usuarios: Usuario[] = []) {}

  async buscarPorEmail(email: string) {
    return this.usuarios.find(u => u.email === email) ?? null
  }

  async buscarPorId(id: string) {
    return this.usuarios.find(u => u.id === id) ?? null
  }
}

export class RefreshTokenRepositorioMemoria implements RefreshTokenRepositorio {
  readonly tokens = new Map<string, RefreshToken>()

  async criar(dados: NovoRefreshToken): Promise<RefreshToken> {
    const token: RefreshToken = { ...dados, id: randomUUID() }
    this.tokens.set(token.id, token)
    return token
  }

  async buscarPorHash(hash: string) {
    return [...this.tokens.values()].find(t => t.hash === hash) ?? null
  }

  async marcarUsado(id: string, quando: Date) {
    const token = this.tokens.get(id)
    if (token) this.tokens.set(id, { ...token, usadoEm: quando })
  }

  async revogarFamilia(familiaId: string, quando: Date) {
    for (const [id, token] of this.tokens) {
      if (token.familiaId === familiaId && !token.revogadoEm) this.tokens.set(id, { ...token, revogadoEm: quando })
    }
  }
}
