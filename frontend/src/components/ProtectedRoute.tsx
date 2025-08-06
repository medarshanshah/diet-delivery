import React from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // TODO: Implement actual authentication check
  // For now, just render children
  return <>{children}</>
}

export default ProtectedRoute