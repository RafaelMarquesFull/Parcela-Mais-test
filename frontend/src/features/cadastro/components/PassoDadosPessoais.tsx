import { CalendarDays, IdCard, Phone, User } from 'lucide-react'
import { formatarCelular, formatarCpf, somenteDigitos } from 'shared'
import type { Campo, Valores } from '../state/reducer'
import type { Erros } from '../state/validacao'
import { CampoTexto } from './CampoTexto'

type Props = {
  valores: Valores
  erros: Erros
  aoAlterar<C extends Campo>(campo: C, valor: Valores[C]): void
  aoTocar(campo: Campo): void
}

export function PassoDadosPessoais({ valores, erros, aoAlterar, aoTocar }: Props) {
  return (
    <div className="grid gap-5">
      <CampoTexto
        id="nome"
        rotulo="Nome completo"
        icone={<User />}
        valor={valores.nome}
        erro={erros.nome}
        autoComplete="name"
        autoFocus
        aoAlterar={v => aoAlterar('nome', v)}
        aoSair={() => aoTocar('nome')}
      />
      <CampoTexto
        id="cpf"
        rotulo="CPF"
        icone={<IdCard />}
        valor={formatarCpf(valores.cpf)}
        erro={erros.cpf}
        inputMode="numeric"
        placeholder="000.000.000-00"
        aoAlterar={v => aoAlterar('cpf', somenteDigitos(v).slice(0, 11))}
        aoSair={() => aoTocar('cpf')}
      />
      <CampoTexto
        id="dataNascimento"
        rotulo="Data de nascimento"
        icone={<CalendarDays />}
        valor={valores.dataNascimento}
        erro={erros.dataNascimento}
        type="date"
        dica="Entre 18 e 80 anos"
        aoAlterar={v => aoAlterar('dataNascimento', v)}
        aoSair={() => aoTocar('dataNascimento')}
      />
      <CampoTexto
        id="celular"
        rotulo="Celular"
        icone={<Phone />}
        valor={formatarCelular(valores.celular)}
        erro={erros.celular}
        inputMode="tel"
        placeholder="(11) 91234-5678"
        aoAlterar={v => aoAlterar('celular', somenteDigitos(v).slice(0, 11))}
        aoSair={() => aoTocar('celular')}
      />
    </div>
  )
}
