import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTema } from '../theme/useTema'

export function AlternadorTema() {
  const { tema, alternar } = useTema()
  const escuro = tema === 'escuro'
  return (
    <Button variant="ghost" size="icon" onClick={alternar} aria-label={escuro ? 'Usar tema claro' : 'Usar tema escuro'} title={escuro ? 'Tema claro' : 'Tema escuro'}>
      {escuro ? <Sun /> : <Moon />}
    </Button>
  )
}
