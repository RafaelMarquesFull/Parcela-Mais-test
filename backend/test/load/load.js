import { autenticar, fluxoConsulta } from './helpers.js'

export const options = {
  vus: 20,
  duration: __ENV.DURACAO || '1m',
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate==0'],
  },
}

export function setup() {
  return autenticar()
}

export default function (auth) {
  fluxoConsulta(auth)
}
