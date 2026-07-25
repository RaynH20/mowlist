import { Navigate } from 'react-router-dom'

export default function SignupPage() {
  // Redirect to customer signup as default
  return <Navigate to="/signup/customer" replace />
}
