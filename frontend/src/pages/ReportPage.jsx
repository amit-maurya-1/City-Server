// src/pages/ReportPage.jsx
// Full issue submission form with: image upload, GPS/map pin,
// AI analysis, duplicate detection, and rate limiting.

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImagePlus, X, Send, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { submitIssue, validateImage } from '@/services/issueService'
import LocationPicker from '@/components/issues/LocationPicker'
import DuplicateWarning from '@/components/issues/DuplicateWarning'

const STEPS = ['Details', 'Location', 'Review']

export default function ReportPage() {
  const navigate = useNavigate()
  const { user, cityId } = useAuth()
  const fileInputRef = useRef(null)

  const [step, setStep]             = useState(0)
  const [description, setDesc]      = useState('')
  const [image, setImage]           = useState(null)
  const [imagePreview, setPreview]  = useState(null)
  const [location, setLocation]     = useState(null)
  const [errors, setErrors]         = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [aiLoading, setAiLoading]   = useState(false)
  const [duplicate, setDuplicate]   = useState(null)   // pending duplicate warning
  const [pendingPayload, setPending]= useState(null)   // saved for "Report Anyway"

  // ── Image handling ──────────────────────────────────────────
  function handleImageSelect(file) {
    const err = validateImage(file)
    if (err) { setErrors(p => ({ ...p, image: err })); return }
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setErrors(p => ({ ...p, image: null }))
  }

  function handleFileDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleImageSelect(file)
  }

  function clearImage() {
    setImage(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Step validation ─────────────────────────────────────────
  function validateStep(s) {
    const e = {}
    if (s === 0) {
      if (!description.trim())         e.description = 'Please describe the issue.'
      if (description.trim().length < 20) e.description = 'Please give more detail (at least 20 characters).'
      if (!image)                      e.image = 'Please attach an image.'
    }
    if (s === 1) {
      if (!location) e.location = 'Please set your location using GPS or map pin.'
    }
    return e
  }

  function goNext() {
    const e = validateStep(step)
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setStep(s => s + 1)
  }

  // ── Submit ──────────────────────────────────────────────────
  async function doSubmit(forceSubmit = false) {
    setSubmitting(true)
    setAiLoading(true)
    try {
      const payload = pendingPayload ?? {
        description,
        image,
        lat: location.lat,
        lng: location.lng,
        cityId,
        userId: user.id,
      }

      setAiLoading(true)
      const result = await submitIssue({ ...payload, forceSubmit })
      setAiLoading(false)

      if (result.duplicate?.isDuplicate) {
        // AI found a duplicate — show warning, hold payload for "Report Anyway"
        setPending(payload)
        setDuplicate(result.duplicate)
        setSubmitting(false)
        return
      }

      toast.success('Issue reported successfully!')
      navigate(`/issues/${result.issue.id}`)
    } catch (err) {
      setAiLoading(false)
      toast.error(err.message)
      setSubmitting(false)
    }
  }

  function handleSubmitAnyway() {
    setDuplicate(null)
    doSubmit(true)
  }

  function handleDismissWarning() {
    setDuplicate(null)
    setPending(null)
    setSubmitting(false)
  }

  // ── UI helpers ──────────────────────────────────────────────
  const stepLabels = ['Details', 'Location', 'Review']

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Report a Civic Issue</h1>
          <p className="text-sm text-gray-500 mt-1">Help your city by documenting local problems.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold
                ${i < step  ? 'bg-emerald-600 text-white' :
                  i === step ? 'bg-emerald-600 text-white ring-2 ring-emerald-200' :
                               'bg-gray-200 text-gray-500'}`}>
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:inline
                ${i === step ? 'text-emerald-700' : 'text-gray-400'}`}>
                {label}
              </span>
              {i < stepLabels.length - 1 && (
                <div className={`flex-1 h-px ${i < step ? 'bg-emerald-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">

          {/* ── STEP 0: Details ── */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Describe the issue <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => { setDesc(e.target.value); setErrors(p => ({ ...p, description: null })) }}
                  rows={4}
                  className={`input resize-none ${errors.description ? 'border-red-400' : ''}`}
                  placeholder="e.g. Large pothole on the main road near the market, causing vehicles to swerve…"
                />
                <div className="flex justify-between mt-1">
                  {errors.description
                    ? <p className="text-red-500 text-xs">{errors.description}</p>
                    : <p className="text-gray-400 text-xs">Be specific — AI uses this to categorize the issue.</p>
                  }
                  <p className="text-gray-400 text-xs shrink-0">{description.length} chars</p>
                </div>
              </div>

              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Photo <span className="text-red-400">*</span>
                </label>

                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-600 
                                 hover:text-red-500 p-1.5 rounded-lg shadow transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={handleFileDrop}
                    onDragOver={e => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                      transition-colors hover:border-emerald-400 hover:bg-emerald-50
                      ${errors.image ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  >
                    <ImagePlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Click or drag to upload</p>
                    <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP — max 5MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef} type="file" className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={e => e.target.files[0] && handleImageSelect(e.target.files[0])}
                />
                {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
              </div>
            </div>
          )}

          {/* ── STEP 1: Location ── */}
          {step === 1 && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Use GPS for an accurate location, or click on the map to pin manually.
              </p>
              <LocationPicker
                value={location}
                onChange={loc => { setLocation(loc); setErrors(p => ({ ...p, location: null })) }}
                error={errors.location}
              />
            </div>
          )}

          {/* ── STEP 2: Review ── */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Review your report</h2>

              {imagePreview && (
                <img src={imagePreview} alt="Issue" className="w-full h-40 object-cover rounded-xl" />
              )}

              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide">Description</span>
                  <p className="text-gray-800 mt-0.5">{description}</p>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <span className="text-gray-400 text-xs uppercase tracking-wide">Location</span>
                  <p className="text-gray-800 mt-0.5 font-mono text-xs">
                    {location?.lat.toFixed(6)}, {location?.lng.toFixed(6)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 
                              text-blue-700 text-xs px-3 py-2.5 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>AI will auto-assign the category and severity. This usually takes a few seconds.</span>
              </div>

              {aiLoading && (
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running AI analysis…
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                disabled={submitting}
                className="btn-secondary flex-1"
              >
                Back
              </button>
            )}

            {step < 2 ? (
              <button
                type="button"
                onClick={goNext}
                className="btn-primary flex-1"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={() => doSubmit(false)}
                disabled={submitting}
                className="btn-primary flex-1"
              >
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                  : <><Send className="w-4 h-4" /> Submit Report</>
                }
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Duplicate warning modal */}
      {duplicate && (
        <DuplicateWarning
          duplicate={duplicate}
          onSubmitAnyway={handleSubmitAnyway}
          onDismiss={handleDismissWarning}
          loading={submitting}
        />
      )}
    </div>
  )
}
