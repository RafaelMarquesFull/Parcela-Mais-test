import { cadastroSchema, escolhaSchema, loginSchema } from '../src/schemas'

const hoje = new Date()
const nascidoHa = (anos: number, dias = 0) => {
  const d = new Date(hoje)
  d.setFullYear(d.getFullYear() - anos)
  d.setDate(d.getDate() - dias)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const base = { nome: 'Ana Souza', cpf: '52998224725', dataNascimento: nascidoHa(30), celular: '11912345678', rendaMensal: 1_000_000, valorTratamento: 800_000 }

describe('cadastroSchema', () => {
  it('aceita cadastro válido', () => expect(cadastroSchema.safeParse(base).success).toBe(true))
  it('normaliza CPF e celular com máscara para dígitos', () => {
    const r = cadastroSchema.parse({ ...base, cpf: '529.982.247-25', celular: '(11) 91234-5678' })
    expect(r.cpf).toBe('52998224725')
    expect(r.celular).toBe('11912345678')
  })
  it.each([17, 81])('rejeita idade %s', anos => expect(cadastroSchema.safeParse({ ...base, dataNascimento: nascidoHa(anos) }).success).toBe(false))
  it.each([18, 80])('aceita idade %s', anos => expect(cadastroSchema.safeParse({ ...base, dataNascimento: nascidoHa(anos, 1) }).success).toBe(true))
  it.each([99_999, 5_000_001, 1500.5, -1, '150000'])('rejeita valor %s', v => expect(cadastroSchema.safeParse({ ...base, valorTratamento: v }).success).toBe(false))
  it.each([100_000, 5_000_000])('aceita valor de borda %s', v => expect(cadastroSchema.safeParse({ ...base, valorTratamento: v }).success).toBe(true))
  it('rejeita campo extra', () => expect(cadastroSchema.safeParse({ ...base, valorAprovado: 1 }).success).toBe(false))
  it('rejeita CPF com dígito errado', () => expect(cadastroSchema.safeParse({ ...base, cpf: '52998224724' }).success).toBe(false))
  it.each(['2026-02-30', '31/12/1990', '1990-13-01'])('rejeita data %s', d => expect(cadastroSchema.safeParse({ ...base, dataNascimento: d }).success).toBe(false))
  it('aceita cenário válido e rejeita inválido', () => {
    expect(cadastroSchema.safeParse({ ...base, cenario: 'delta_falha' }).success).toBe(true)
    expect(cadastroSchema.safeParse({ ...base, cenario: 'outro' }).success).toBe(false)
  })
  it('mensagem de CPF é em português', () => {
    const r = cadastroSchema.safeParse({ ...base, cpf: '123' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toBe('CPF inválido')
  })
})

describe('escolhaSchema', () => {
  it('aceita escolha válida', () => expect(escolhaSchema.safeParse({ financeira: 'alfa', prazoMeses: 12 }).success).toBe(true))
  it('rejeita prazo não inteiro', () => expect(escolhaSchema.safeParse({ financeira: 'alfa', prazoMeses: 12.5 }).success).toBe(false))
  it('rejeita financeira desconhecida', () => expect(escolhaSchema.safeParse({ financeira: 'omega', prazoMeses: 12 }).success).toBe(false))
})

describe('loginSchema', () => {
  it('rejeita email inválido', () => expect(loginSchema.safeParse({ email: 'x', senha: 'a' }).success).toBe(false))
})
