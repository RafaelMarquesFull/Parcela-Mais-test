import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { obterConfig } from '@/services/config.api'
import { criarConsulta } from '@/services/consultas.api'
import { IndicadorPasso } from './components/IndicadorPasso'
import { NavegacaoPassos } from './components/NavegacaoPassos'
import { PassoDadosPessoais } from './components/PassoDadosPessoais'
import { PassoValores } from './components/PassoValores'
import { useFormulario } from './hooks/useFormulario'

export function CadastroPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const valorInicial = (location.state as { valorInicial?: number } | null)?.valorInicial
  const [simulacaoHabilitada, setSimulacaoHabilitada] = useState(false)

  useEffect(() => {
    obterConfig()
      .then(c => setSimulacaoHabilitada(c.simulacaoHabilitada))
      .catch(() => setSimulacaoHabilitada(false))
  }, [])

  const formulario = useFormulario({
    valorInicial,
    aoEnviar: async (entrada, chave) => {
      const { id } = await criarConsulta(entrada, chave)
      navigate(`/consultas/${id}`)
    },
  })
  const { estado } = formulario

  return (
    <div className="mx-auto w-full max-w-xl">
      <Card>
        <CardHeader>
          <IndicadorPasso passo={estado.passo} />
          <CardTitle className="mt-3">{estado.passo === 1 ? 'Quem é o paciente?' : 'Quanto custa o tratamento?'}</CardTitle>
          <CardDescription>
            {estado.passo === 1 ? 'Preencha uma vez; consultamos todas as financeiras com os mesmos dados.' : 'Com estes valores consultamos as quatro financeiras em paralelo.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            noValidate
            className="grid gap-6"
            onSubmit={e => {
              e.preventDefault()
              if (estado.passo === 1) formulario.avancar()
              else void formulario.enviar()
            }}
          >
            <div key={estado.passo} className="passo-entrar">
              {estado.passo === 1 ? (
                <PassoDadosPessoais valores={estado.valores} erros={estado.erros} aoAlterar={formulario.alterar} aoTocar={formulario.tocar} />
              ) : (
                <PassoValores valores={estado.valores} erros={estado.erros} simulacaoHabilitada={simulacaoHabilitada} aoAlterar={formulario.alterar} aoTocar={formulario.tocar} />
              )}
            </div>
            {estado.erroEnvio && (
              <Alert variant="destructive">
                <AlertDescription>{estado.erroEnvio}</AlertDescription>
              </Alert>
            )}
            <NavegacaoPassos
              passo={estado.passo}
              podeAvancar={formulario.passoValido}
              enviando={estado.enviando}
              aoVoltar={formulario.voltar}
              aoAvancar={formulario.avancar}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
