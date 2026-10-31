import type { Paciente as PacienteLinha } from '@prisma/client'
import type { Paciente } from '../../../domain/entities/paciente'

export function paraPaciente(linha: PacienteLinha): Paciente {
  return {
    id: linha.id,
    nome: linha.nome,
    cpf: linha.cpf,
    dataNascimento: linha.dataNascimento,
    celular: linha.celular,
    rendaMensal: linha.rendaMensal,
    criadoEm: linha.criadoEm,
  }
}
