import { Navigate } from 'react-router-dom'

export default function LoginPage() {
  // Redirect to customer login as default
  return <Navigate to="/login/customer" replace />
}
