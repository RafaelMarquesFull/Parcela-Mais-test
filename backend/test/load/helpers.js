import http from 'k6/http'
import { check, sleep } from 'k6'

http.setResponseCallback(http.expectedStatuses(200, 202, 429))

export const BASE_URL = __ENV.BASE_URL || 'http://host.docker.internal:3000'

function digitoVerificador(digitos, pesoInicial) {
  let soma = 0
  for (let i = 0; i < digitos.length; i += 1) soma += Number(digitos[i]) * (pesoInicial - i)
  const resto = (soma * 10) % 11
  return resto === 10 ? 0 : resto
}

export function cpfAleatorio() {
  let base = ''
  for (let i = 0; i < 9; i += 1) base += Math.floor(Math.random() * 10)
  const d1 = digitoVerificador(base, 10)
  const d2 = digitoVerificador(base + d1, 11)
  return `${base}${d1}${d2}`
}

export function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export function novoPaciente() {
  return {
    nome: 'Paciente de Carga',
    cpf: cpfAleatorio(),
    dataNascimento: '1996-05-10',
    celular: '11912345678',
    rendaMensal: 1_000_000,
    valorTratamento: 800_000,
    cenario: 'todas_aprovam',
  }
}

export function cabecalhos(extras = {}) {
  return { headers: { 'Content-Type': 'application/json', 'Idempotency-Key': uuid(), ...extras } }
}

export function autenticar() {
  const res = http.post(`${BASE_URL}/auth/login`, JSON.stringify({ email: 'clinica@parcelamais.com', senha: 'parcela123' }), {
    headers: { 'Content-Type': 'application/json' },
  })
  if (res.status !== 200) return {}
  return { Authorization: `Bearer ${res.json('accessToken')}` }
}

export function fluxoConsulta(auth, tags = {}) {
  const criada = http.post(`${BASE_URL}/consultas`, JSON.stringify(novoPaciente()), { ...cabecalhos(auth), tags })
  const aceita = check(criada, { 'POST /consultas aceita ou limitada': r => r.status === 202 || r.status === 429 })
  if (!aceita || criada.status !== 202) return
  const snapshot = http.get(`${BASE_URL}/consultas/${criada.json('id')}`, { headers: auth, tags })
  check(snapshot, { 'GET /consultas/:id responde': r => r.status === 200 || r.status === 429 })
  sleep(1)
}
