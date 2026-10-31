-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "familiaId" TEXT NOT NULL,
    "expiraEm" DATETIME NOT NULL,
    "usadoEm" DATETIME,
    "revogadoEm" DATETIME,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshToken_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Paciente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "dataNascimento" TEXT NOT NULL,
    "celular" TEXT NOT NULL,
    "rendaMensal" INTEGER NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Consulta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "valorTratamento" INTEGER NOT NULL,
    "cenario" TEXT NOT NULL,
    "chaveIdempotencia" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadaEm" DATETIME,
    CONSTRAINT "Consulta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Consulta_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResultadoFinanceira" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "consultaId" TEXT NOT NULL,
    "financeira" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "motivo" TEXT,
    "valorAprovado" INTEGER,
    "taxaMensal" INTEGER,
    "prazos" TEXT NOT NULL,
    "duracaoMs" INTEGER,
    "respondidoEm" DATETIME,
    CONSTRAINT "ResultadoFinanceira_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "Consulta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Escolha" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "consultaId" TEXT NOT NULL,
    "resultadoId" TEXT NOT NULL,
    "prazoMeses" INTEGER NOT NULL,
    "valorParcela" INTEGER NOT NULL,
    "totalPago" INTEGER NOT NULL,
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Escolha_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "Consulta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Escolha_resultadoId_fkey" FOREIGN KEY ("resultadoId") REFERENCES "ResultadoFinanceira" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_hash_key" ON "RefreshToken"("hash");

-- CreateIndex
CREATE INDEX "RefreshToken_familiaId_idx" ON "RefreshToken"("familiaId");

-- CreateIndex
CREATE UNIQUE INDEX "Consulta_chaveIdempotencia_key" ON "Consulta"("chaveIdempotencia");

-- CreateIndex
CREATE UNIQUE INDEX "ResultadoFinanceira_consultaId_financeira_key" ON "ResultadoFinanceira"("consultaId", "financeira");

-- CreateIndex
CREATE UNIQUE INDEX "Escolha_consultaId_key" ON "Escolha"("consultaId");
