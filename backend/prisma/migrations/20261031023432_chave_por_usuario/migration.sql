-- DropIndex
DROP INDEX "Consulta_chaveIdempotencia_key";

-- CreateIndex
CREATE UNIQUE INDEX "Consulta_usuarioId_chaveIdempotencia_key" ON "Consulta"("usuarioId", "chaveIdempotencia");

