export function somenteDigitos(texto: string): string {
  return texto.replace(/\D/g, '')
}

function digitoVerificador(digitos: string, pesoInicial: number): number {
  const soma = [...digitos].reduce((acc, d, i) => acc + Number(d) * (pesoInicial - i), 0)
  const resto = (soma * 10) % 11
  return resto === 10 ? 0 : resto
}

export function validarCpf(cpf: string): boolean {
  const digitos = somenteDigitos(cpf)
  if (digitos.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digitos)) return false
  const primeiro = digitoVerificador(digitos.slice(0, 9), 10)
  const segundo = digitoVerificador(digitos.slice(0, 10), 11)
  return primeiro === Number(digitos[9]) && segundo === Number(digitos[10])
}
