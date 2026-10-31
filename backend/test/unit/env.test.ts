import { carregarEnv } from '../../src/config/env'

const base = { DATABASE_URL: 'file:x.db', JWT_SECRET: 'troque-este-segredo' }

it('aceita o segredo padrão fora de produção', () => {
  expect(carregarEnv({ ...base, NODE_ENV: 'development' }).JWT_SECRET).toBe('troque-este-segredo')
})

it('recusa o segredo padrão em produção', () => {
  expect(() => carregarEnv({ ...base, NODE_ENV: 'production' })).toThrow()
})

it('aceita segredo próprio em produção', () => {
  expect(carregarEnv({ ...base, NODE_ENV: 'production', JWT_SECRET: 'abc' }).JWT_SECRET).toBe('abc')
})
