// src/pages/RegisterPage.jsx

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, MapPin, UserPlus, ShieldCheck, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { registerCitizen, registerAdmin, fetchCities } from '@/services/authService'

export default function RegisterPage() {
  const navigate = useNavigate()

  const [cities, setCities]       = useState([])
  const [form, setForm]           = useState({
    full_name: '', email: '', password: '', confirm_password: '',
    city_id: '', is_admin: false, secret_code: '',
  })
  const [showPassword, setShowPw]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [loadingCities, setLoadingCities] = useState(true)
  const [errors, setErrors]           = useState({})

  useEffect(() => {
    fetchCities()
      .then(setCities)
      .catch(() => toast.error('Could not load cities. Please refresh.'))
      .finally(() => setLoadingCities(false))
  }, [])

  function validate() {
    const e = {}
    if (!form.full_name.trim())         e.full_name = 'Full name is required.'
    if (!form.email.trim())             e.email     = 'Email is required.'
    if (form.password.length < 8)       e.password  = 'Password must be at least 8 characters.'
    if (form.password !== form.confirm_password)
                                        e.confirm_password = 'Passwords do not match.'
    if (!form.city_id)                  e.city_id   = 'Please select your city.'
    if (form.is_admin && !form.secret_code.trim())
                                        e.secret_code = 'Admin secret code is required.'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setErrors({})

    try {
      if (form.is_admin) {
        await registerAdmin({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          city_id: form.city_id,
          secret_code: form.secret_code,
        })
        toast.success('Admin account created! Please log in.')
        navigate('/login')
      } else {
        await registerCitizen({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          city_id: form.city_id,
        })
        toast.success('Account created! Check your email to confirm.')
        navigate('/login')
      }
    } catch (err) {
      setErrors({ submit: err.message })
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    const val = type === 'checkbox' ? checked : value
    setForm(prev => ({ ...prev, [name]: val }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6">
      <div className="max-w-md w-full mx-auto">

        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="bg-emerald-100 p-3 rounded-xl">
              <MapPin className="w-7 h-7 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Join CityServe and help improve your city</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {errors.submit}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input
                type="text" name="full_name" value={form.full_name} onChange={handleChange}
                className={`input ${errors.full_name ? 'border-red-400' : ''}`}
                placeholder="Rahul Sharma" disabled={loading}
              />
              {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email" name="email" value={form.email} onChange={handleChange}
                className={`input ${errors.email ? 'border-red-400' : ''}`}
                placeholder="you@example.com" autoComplete="email" disabled={loading}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <div className="relative">
                <select
                  name="city_id" value={form.city_id} onChange={handleChange}
                  className={`input appearance-none pr-8 ${errors.city_id ? 'border-red-400' : ''}`}
                  disabled={loading || loadingCities}
                >
                  <option value="">
                    {loadingCities ? 'Loading cities…' : 'Select your city'}
                  </option>
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.city_id && <p className="text-red-500 text-xs mt-1">{errors.city_id}</p>}
              <p className="text-xs text-gray-400 mt-1">Cannot be changed after registration.</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange}
                  className={`input pr-10 ${errors.password ? 'border-red-400' : ''}`}
                  placeholder="Min. 8 characters" autoComplete="new-password" disabled={loading}
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'} name="confirm_password"
                  value={form.confirm_password} onChange={handleChange}
                  className={`input pr-10 ${errors.confirm_password ? 'border-red-400' : ''}`}
                  placeholder="••••••••" autoComplete="new-password" disabled={loading}
                />
                <button type="button" onClick={() => setShowConfirm(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password}</p>}
            </div>

            {/* Admin checkbox */}
            <div className="pt-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox" name="is_admin" checked={form.is_admin} onChange={handleChange}
                  className="w-4 h-4 accent-emerald-600" disabled={loading}
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  Register as Admin
                </span>
              </label>
            </div>

            {/* Admin secret code — only shows when checkbox is ticked */}
            {form.is_admin && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <label className="block text-sm font-medium text-indigo-800 mb-1.5">
                  Admin Secret Code
                </label>
                <input
                  type="password" name="secret_code" value={form.secret_code} onChange={handleChange}
                  className={`input bg-white ${errors.secret_code ? 'border-red-400' : 'border-indigo-300'}`}
                  placeholder="Enter the admin secret code" disabled={loading}
                />
                {errors.secret_code && <p className="text-red-500 text-xs mt-1">{errors.secret_code}</p>}
                <p className="text-xs text-indigo-600 mt-2">
                  Contact your city administrator for this code.
                </p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading
                ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                : <UserPlus className="w-4 h-4" />}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>

          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
