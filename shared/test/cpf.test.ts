import { somenteDigitos, validarCpf } from '../src/cpf'

describe('validarCpf', () => {
  it.each(['52998224725', '529.982.247-25', ' 529.982.247-25 '])('aceita %s', cpf => {
    expect(validarCpf(cpf)).toBe(true)
  })

  it.each(['52998224724', '11111111111', '00000000000', '5299822472', '529982247255', 'abc', ''])('rejeita %s', cpf => {
    expect(validarCpf(cpf)).toBe(false)
  })
})

describe('somenteDigitos', () => {
  it('remove tudo que não é dígito', () => {
    expect(somenteDigitos(' (11) 9123-4567 ')).toBe('1191234567')
  })
})
