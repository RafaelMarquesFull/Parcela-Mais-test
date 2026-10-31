import { RouterProvider } from 'react-router'
import { AuthProvider } from '@/features/auth/hooks/useAuth'
import { router } from './router'

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
