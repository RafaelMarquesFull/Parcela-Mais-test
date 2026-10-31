import type { PrismaClient } from '@prisma/client'
import type { MetricasConsultas, NomeFinanceira } from 'shared'
import type { Consulta, NovaConsulta } from '../../../domain/entities/consulta'
import type { Escolha, NovaEscolha } from '../../../domain/entities/escolha'
import type { NovoResultado, ResultadoFinanceira } from '../../../domain/entities/resultado-financeira'
import type { NovoPaciente } from '../../../domain/entities/paciente'
import type { ConsultaCriada, ConsultaRepositorio, FiltroListagem, JanelaMetricas, ListaPaginada } from '../../../domain/ports/consulta.repository'
import { paraPaciente } from '../mappers/paciente.mapper'
import { paraConsulta } from '../mappers/consulta.mapper'
import { paraEscolha } from '../mappers/escolha.mapper'
import { paraResultado } from '../mappers/resultado.mapper'

export class PrismaConsultaRepositorio implements ConsultaRepositorio {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: NovaConsulta): Promise<Consulta> {
    const linha = await this.prisma.consulta.create({ data: { ...dados, status: 'em_andamento' } })
    return paraConsulta(linha)
  }

  async buscarPorId(id: string): Promise<Consulta | null> {
    const linha = await this.prisma.consulta.findUnique({ where: { id } })
    return linha ? paraConsulta(linha) : null
  }

  async criarCompleta(paciente: NovoPaciente, consulta: Omit<NovaConsulta, 'pacienteId'>, financeiras: NomeFinanceira[]): Promise<ConsultaCriada> {
    return this.prisma.$transaction(async tx => {
      const pacienteCriado = await tx.paciente.create({ data: paciente })
      const consultaCriada = await tx.consulta.create({ data: { ...consulta, pacienteId: pacienteCriado.id, status: 'em_andamento' } })
      await tx.resultadoFinanceira.createMany({
        data: financeiras.map(financeira => ({ consultaId: consultaCriada.id, financeira, status: 'consultando', prazos: '[]' })),
      })
      return { consulta: paraConsulta(consultaCriada), paciente: paraPaciente(pacienteCriado) }
    })
  }

  async buscarPorChave(usuarioId: string, chave: string): Promise<Consulta | null> {
    const linha = await this.prisma.consulta.findUnique({ where: { usuarioId_chaveIdempotencia: { usuarioId, chaveIdempotencia: chave } } })
    return linha ? paraConsulta(linha) : null
  }

  async listarEmAndamentoAntesDe(limite: Date): Promise<Consulta[]> {
    const linhas = await this.prisma.consulta.findMany({ where: { status: 'em_andamento', criadaEm: { lt: limite } } })
    return linhas.map(paraConsulta)
  }

  async listar(usuarioId: string, filtro: FiltroListagem): Promise<ListaPaginada> {
    const where = { usuarioId, ...(filtro.busca ? { paciente: { nome: { contains: filtro.busca } } } : {}) }
    const [linhas, total] = await Promise.all([
      this.prisma.consulta.findMany({
        where,
        orderBy: { criadaEm: 'desc' },
        skip: (filtro.pagina - 1) * filtro.porPagina,
        take: filtro.porPagina,
        include: { paciente: { select: { nome: true } }, resultados: { select: { status: true } } },
      }),
      this.prisma.consulta.count({ where }),
    ])
    const itens = linhas.map(linha => ({
      id: linha.id,
      pacienteNome: linha.paciente.nome,
      valorTratamento: linha.valorTratamento,
      status: paraConsulta(linha).status,
      aprovadas: linha.resultados.filter(r => r.status === 'aprovada').length,
      criadaEm: linha.criadaEm.toISOString(),
    }))
    return { itens, total }
  }

  async metricas(usuarioId: string, janela: JanelaMetricas): Promise<MetricasConsultas> {
    const [consultasHoje, consultasOntem, finalizadas, comCredito, volume] = await Promise.all([
      this.prisma.consulta.count({ where: { usuarioId, criadaEm: { gte: janela.inicioHoje } } }),
      this.prisma.consulta.count({ where: { usuarioId, criadaEm: { gte: janela.inicioOntem, lt: janela.inicioHoje } } }),
      this.prisma.consulta.count({ where: { usuarioId, status: 'finalizada' } }),
      this.prisma.consulta.count({ where: { usuarioId, status: 'finalizada', resultados: { some: { status: 'aprovada' } } } }),
      this.prisma.consulta.aggregate({ where: { usuarioId }, _sum: { valorTratamento: true } }),
    ])
    return { consultasHoje, consultasOntem, finalizadas, comCredito, volumeSolicitado: volume._sum.valorTratamento ?? 0 }
  }

  async resultados(consultaId: string): Promise<ResultadoFinanceira[]> {
    const linhas = await this.prisma.resultadoFinanceira.findMany({ where: { consultaId } })
    return linhas.map(paraResultado)
  }

  async gravarResultado(dados: NovoResultado): Promise<ResultadoFinanceira> {
    const { consultaId, financeira, ...resto } = dados
    const valores = { ...resto, prazos: JSON.stringify(dados.prazos) }
    const linha = await this.prisma.resultadoFinanceira.upsert({
      where: { consultaId_financeira: { consultaId, financeira } },
      create: { consultaId, financeira, ...valores },
      update: valores,
    })
    return paraResultado(linha)
  }

  async gravarResultados(lista: NovoResultado[]): Promise<void> {
    await this.prisma.resultadoFinanceira.createMany({ data: lista.map(r => ({ ...r, prazos: JSON.stringify(r.prazos) })) })
  }

  async concluirResultado(dados: NovoResultado): Promise<ResultadoFinanceira | null> {
    const { consultaId, financeira, ...resto } = dados
    const { count } = await this.prisma.resultadoFinanceira.updateMany({
      where: { consultaId, financeira, status: 'consultando' },
      data: { ...resto, prazos: JSON.stringify(dados.prazos) },
    })
    if (count === 0) return null
    const linha = await this.prisma.resultadoFinanceira.findUnique({ where: { consultaId_financeira: { consultaId, financeira } } })
    return linha ? paraResultado(linha) : null
  }

  async finalizar(id: string, finalizadaEm: Date): Promise<void> {
    await this.prisma.consulta.update({ where: { id }, data: { status: 'finalizada', finalizadaEm } })
  }

  async escolha(consultaId: string): Promise<Escolha | null> {
    const linha = await this.prisma.escolha.findUnique({ where: { consultaId } })
    return linha ? paraEscolha(linha) : null
  }

  async gravarEscolha(dados: NovaEscolha): Promise<Escolha> {
    const linha = await this.prisma.escolha.create({ data: dados })
    return paraEscolha(linha)
  }
}
