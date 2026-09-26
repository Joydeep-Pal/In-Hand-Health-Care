import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronDown, AlertTriangle } from 'lucide-react'

// TODO: replace with GET /api/diseases/:id
const MOCK_DETAIL = {
  name: 'Dengue',
  overview: 'Dengue is a mosquito-borne viral infection common in tropical and subtropical regions, transmitted primarily by Aedes mosquitoes.',
  commonSymptoms: ['High fever', 'Severe headache', 'Pain behind the eyes', 'Muscle and joint pain', 'Rash'],
  lessCommonSymptoms: ['Nausea', 'Vomiting', 'Mild bleeding (nose or gums)'],
  warningSigns: ['Severe abdominal pain', 'Persistent vomiting', 'Bleeding gums', 'Difficulty breathing', 'Extreme fatigue or restlessness'],
  treatment: 'There is no specific antiviral treatment. Management focuses on rest, fluids, and fever control.',
  prevention: 'Avoid mosquito bites: use repellent, wear long sleeves, and eliminate standing water near living spaces.',
}

const SECTIONS = [
  { key: 'overview', label: 'Overview', openByDefault: true },
  { key: 'commonSymptoms', label: 'Common Symptoms', openByDefault: true },
  { key: 'lessCommonSymptoms', label: 'Less Common Symptoms', openByDefault: false },
  { key: 'treatment', label: 'Treatment', openByDefault: false },
  { key: 'prevention', label: 'Prevention', openByDefault: false },
]

function Accordion({ label, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-teal-100 rounded-xl bg-white overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
      >
        {label}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 text-sm text-slate-soft leading-relaxed">{children}</div>}
    </div>
  )
}

export default function DiseaseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const data = MOCK_DETAIL // TODO: fetch by `id`

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-lg font-semibold">{data.name}</h1>

      <div className="flex items-start gap-2 bg-alert-bg border border-alert-border text-alert-text rounded-xl p-3 text-sm">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium mb-1">Seek care immediately if you notice:</p>
          <p>{data.warningSigns.join(', ')}.</p>
        </div>
      </div>

      {SECTIONS.map((s) => (
        <Accordion key={s.key} label={s.label} defaultOpen={s.openByDefault}>
          {Array.isArray(data[s.key]) ? (
            <ul className="list-disc pl-4 space-y-1">
              {data[s.key].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>{data[s.key]}</p>
          )}
        </Accordion>
      ))}

      <button
        onClick={() => navigate('/medicine-finder')}
        className="w-full rounded-lg bg-teal-500 text-white text-sm font-medium py-2.5 hover:bg-teal-600 transition-colors"
      >
        Need medicine for this?
      </button>
    </div>
  )
}
