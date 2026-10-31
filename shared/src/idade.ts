export function calcularIdade(dataNascimento: string, hoje: Date): number {
  const [ano = 0, mes = 1, dia = 1] = dataNascimento.split('-').map(Number)
  let idade = hoje.getFullYear() - ano
  const aniversarioPassou = hoje.getMonth() + 1 > mes || (hoje.getMonth() + 1 === mes && hoje.getDate() >= dia)
  if (!aniversarioPassou) idade -= 1
  return idade
}
