import { PlusCircle } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function AcaoNovaConsulta() {
  return (
    <Card className="border-primary/30 bg-accent/40">
      <CardHeader>
        <CardTitle className="text-xl">Pré-aprovar um paciente</CardTitle>
        <CardDescription className="max-w-prose">
          Preencha os dados uma vez. Consultamos Alfa, Beta, Gama e Delta ao mesmo tempo e mostramos as ofertas em até 10 segundos, mesmo que alguma
          financeira não responda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button size="lg" render={<Link to="/consultas/nova" />}>
          <PlusCircle /> Nova consulta
        </Button>
      </CardContent>
    </Card>
  )
}
