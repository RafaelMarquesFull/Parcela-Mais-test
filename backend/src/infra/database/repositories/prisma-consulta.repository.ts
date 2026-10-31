import type { PrismaClient } from '@prisma/client'
import type { ConsultaResumo } from 'shared'
import type { Consulta, NovaConsulta } from '../../../domain/entities/consulta'
import type { Escolha, NovaEscolha } from '../../../domain/entities/escolha'
import type { NovoResultado, ResultadoFinanceira } from '../../../domain/entities/resultado-financeira'
import type { ConsultaRepositorio } from '../../../domain/ports/consulta.repository'
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

  async buscarPorChave(chave: string): Promise<Consulta | null> {
    const linha = await this.prisma.consulta.findUnique({ where: { chaveIdempotencia: chave } })
    return linha ? paraConsulta(linha) : null
  }

  async listar(usuarioId: string): Promise<ConsultaResumo[]> {
    const linhas = await this.prisma.consulta.findMany({
      where: { usuarioId },
      orderBy: { criadaEm: 'desc' },
      include: { paciente: { select: { nome: true } }, resultados: { select: { status: true } } },
    })
    return linhas.map(linha => ({
      id: linha.id,
      pacienteNome: linha.paciente.nome,
      valorTratamento: linha.valorTratamento,
      status: paraConsulta(linha).status,
      aprovadas: linha.resultados.filter(r => r.status === 'aprovada').length,
      criadaEm: linha.criadaEm.toISOString(),
    }))
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
