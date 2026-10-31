export interface Hasher {
  gerar(texto: string): Promise<string>
  comparar(texto: string, hash: string): Promise<boolean>
}
