import { formatarCelular, formatarCpf, formatarMoeda, mascararCpf, moedaParaCentavos } from '../src/formatadores'
import { calcularIdade } from '../src/idade'

describe('formatadores', () => {
  it('formata CPF', () => expect(formatarCpf('52998224725')).toBe('529.982.247-25'))
  it('formata CPF parcial enquanto digita', () => expect(formatarCpf('5299')).toBe('529.9'))
  it('mascara CPF', () => expect(mascararCpf('52998224725')).toBe('***.982.247-**'))
  it('formata celular com 11 dígitos', () => expect(formatarCelular('11912345678')).toBe('(11) 91234-5678'))
  it('formata telefone com 10 dígitos', () => expect(formatarCelular('1133334444')).toBe('(11) 3333-4444'))
  it('formata moeda', () => expect(formatarMoeda(150_000).replace(/ /g, ' ')).toBe('R$ 1.500,00'))
  it.each(['1.500,00', '1500', 'R$ 1.500,00', '1500,5'])('converte %s para centavos', texto => {
    expect(moedaParaCentavos(texto)).toBe(texto === '1500,5' ? 150_050 : 150_000)
  })
  it('converte texto sem número para 0', () => expect(moedaParaCentavos('abc')).toBe(0))
})

describe('calcularIdade', () => {
  it('conta anos completos', () => expect(calcularIdade('2000-10-30', new Date(2026, 9, 30))).toBe(26))
  it('não conta o ano se o aniversário ainda não chegou', () => expect(calcularIdade('2000-10-31', new Date(2026, 9, 30))).toBe(25))
})
