import React from 'react'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gradient-primary">HealthyBites</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-neutral-700 hover:text-primary-600">Home</a>
              <a href="/menu" className="text-neutral-700 hover:text-primary-600">Menu</a>
              <a href="/dietitians" className="text-neutral-700 hover:text-primary-600">Dietitians</a>
            </nav>
            <div className="flex items-center space-x-4">
              <a href="/login" className="btn-outline btn-sm">Login</a>
              <a href="/register" className="btn-primary btn-sm">Sign Up</a>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>
      
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-bold mb-4">HealthyBites</h3>
            <p className="text-neutral-400">Delivering health, one meal at a time 🥗💚</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout