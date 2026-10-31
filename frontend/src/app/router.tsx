import { createBrowserRouter } from 'react-router'
import { CadastroPage } from '@/features/cadastro/CadastroPage'
import { ConsultaPage } from '@/features/consulta/ConsultaPage'

export const router = createBrowserRouter([
  { path: '/', element: <CadastroPage /> },
  { path: '/consultas/:id', element: <ConsultaPage /> },
])
