import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'

// TODO: replace with GET /api/diseases
const MOCK_DISEASES = [
  { id: 'dengue', name: 'Dengue', overviewSnippet: 'A mosquito-borne viral infection common in tropical regions.' },
  { id: 'malaria', name: 'Malaria', overviewSnippet: 'A parasitic infection spread by Anopheles mosquitoes.' },
  { id: 'influenza', name: 'Influenza', overviewSnippet: 'A contagious respiratory illness caused by influenza viruses.' },
  { id: 'typhoid_fever', name: 'Typhoid Fever', overviewSnippet: 'A bacterial infection spread through contaminated food or water.' },
]

export default function DiseasesPage() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const filtered = MOCK_DISEASES.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-lg font-semibold mb-4">Disease library</h1>

      <div className="relative mb-6">
        <Search className="w-4 h-4 text-slate-soft absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search diseases..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-teal-100 text-sm outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {filtered.map((d) => (
          <button
            key={d.id}
            onClick={() => navigate(`/diseases/${d.id}`)}
            className="text-left bg-white border border-teal-100 rounded-xl p-4 hover:border-teal-400 transition-colors"
          >
            <p className="font-medium text-sm mb-1">{d.name}</p>
            <p className="text-xs text-slate-soft leading-relaxed">{d.overviewSnippet}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
