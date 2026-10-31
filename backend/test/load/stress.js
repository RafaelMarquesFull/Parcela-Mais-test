import { autenticar, fluxoConsulta } from './helpers.js'

const degrau = __ENV.DEGRAU || '30s'

export const options = {
  stages: [
    { duration: degrau, target: 50 },
    { duration: degrau, target: 100 },
    { duration: degrau, target: 200 },
    { duration: degrau, target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{fase:descida}': ['p(95)<300'],
  },
}

export function setup() {
  return { auth: autenticar(), inicio: Date.now(), degrauMs: parseDuracao(degrau) }
}

export default function ({ auth, inicio, degrauMs }) {
  const decorrido = Date.now() - inicio
  const tags = decorrido > degrauMs * 3 ? { fase: 'descida' } : { fase: 'subida' }
  fluxoConsulta(auth, tags)
}

function parseDuracao(texto) {
  const valor = parseInt(texto, 10)
  return texto.endsWith('m') ? valor * 60_000 : valor * 1000
}
