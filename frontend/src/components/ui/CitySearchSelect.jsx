import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X, MapPin } from 'lucide-react'
import { clsx } from 'clsx'

export default function CitySearchSelect({ cities, value, onChange, error, disabled }) {
  const [open, setOpen]         = useState(false)
  const [query, setQuery]       = useState('')
  const inputRef                = useRef(null)
  const containerRef            = useRef(null)

  const selectedCity = cities.find(c => c.id === value) ?? null

  // Filter cities by search query
  const filtered = query.trim()
    ? cities.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : cities

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Focus input when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  function handleSelect(city) {
    onChange(city.id)
    setOpen(false)
    setQuery('')
  }

  function handleClear(e) {
    e.stopPropagation()
    onChange('')
    setQuery('')
  }

  return (
    <div ref={containerRef} className="relative">

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className={clsx(
          'input w-full flex items-center justify-between text-left',
          error && 'border-red-400 focus:ring-red-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className={clsx(
          'flex items-center gap-2 truncate',
          !selectedCity && 'text-gray-400'
        )}>
          {selectedCity
            ? <><MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />{selectedCity.name}</>
            : 'Search your city…'
          }
        </span>
        <span className="flex items-center gap-1 shrink-0 ml-2">
          {selectedCity && (
            <span
              onClick={handleClear}
              className="p-0.5 text-gray-400 hover:text-red-500 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={clsx(
            'w-4 h-4 text-gray-400 transition-transform',
            open && 'rotate-180'
          )} />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border 
                        border-gray-200 rounded-xl shadow-lg overflow-hidden">

          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type city name…"
              className="flex-1 text-sm outline-none bg-transparent"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')}>
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* City list */}
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                No city found for "{query}"
              </div>
            ) : (
              filtered.map(city => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => handleSelect(city)}
                  className={clsx(
                    'w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2',
                    city.id === value
                      ? 'bg-emerald-50 text-emerald-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <MapPin className={clsx(
                    'w-3.5 h-3.5 shrink-0',
                    city.id === value ? 'text-emerald-500' : 'text-gray-300'
                  )} />
                  {city.name}
                </button>
              ))
            )}
          </div>

          {/* Count footer */}
          <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400">
              {filtered.length} cit{filtered.length === 1 ? 'y' : 'ies'}
              {query && ` for "${query}"`}
            </p>
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
