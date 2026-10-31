export interface Relogio {
  agora(): number
  esperar(ms: number): Promise<void>
}
