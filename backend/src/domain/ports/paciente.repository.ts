import type { NovoPaciente, Paciente } from '../entities/paciente'

export interface PacienteRepositorio {
  criar(dados: NovoPaciente): Promise<Paciente>
  buscarPorId(id: string): Promise<Paciente | null>
}
