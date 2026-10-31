import type { PrismaClient } from '@prisma/client'
import type { NovoPaciente, Paciente } from '../../../domain/entities/paciente'
import type { PacienteRepositorio } from '../../../domain/ports/paciente.repository'
import { paraPaciente } from '../mappers/paciente.mapper'

export class PrismaPacienteRepositorio implements PacienteRepositorio {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: NovoPaciente): Promise<Paciente> {
    return paraPaciente(await this.prisma.paciente.create({ data: dados }))
  }

  async buscarPorId(id: string): Promise<Paciente | null> {
    const linha = await this.prisma.paciente.findUnique({ where: { id } })
    return linha ? paraPaciente(linha) : null
  }
}
