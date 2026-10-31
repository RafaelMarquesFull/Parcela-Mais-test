export type Paciente = {
  id: string
  nome: string
  cpf: string
  dataNascimento: string
  celular: string
  rendaMensal: number
  criadoEm: Date
}

export type NovoPaciente = Omit<Paciente, 'id' | 'criadoEm'>

export type DadosPaciente = NovoPaciente & { valorTratamento: number }
