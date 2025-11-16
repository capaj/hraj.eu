import React from 'react'
import { Outlet } from '@tanstack/react-router'
import { Header } from './components/layout/Header'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Outlet />
    </div>
  )
}

export default App
