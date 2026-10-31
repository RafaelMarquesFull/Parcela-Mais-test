import http from 'k6/http'
import { check } from 'k6'
import { BASE_URL, autenticar, fluxoConsulta } from './helpers.js'

export const options = {
  scenarios: {
    pico: {
      executor: 'ramping-vus',
      stages: [
        { duration: '5s', target: 300 },
        { duration: '20s', target: 300 },
        { duration: '5s', target: 0 },
      ],
    },
    saude: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      exec: 'saude',
    },
  },
  thresholds: {
    'http_req_failed{scenario:pico}': ['rate<0.01'],
    'checks{scenario:saude}': ['rate==1'],
  },
}

export function setup() {
  return autenticar()
}

export default function (auth) {
  fluxoConsulta(auth)
}

export function saude() {
  const res = http.get(`${BASE_URL}/config`)
  check(res, { '/config responde durante o pico': r => r.status === 200 })
}
