// src/pages/NotFoundPage.jsx
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <MapPin className="w-12 h-12 text-gray-300 mb-4" />
      <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
      <p className="text-gray-500 mb-6">This page doesn't exist on the map.</p>
      <Link to="/" className="btn-primary">Back to Map</Link>
    </div>
  )
}
