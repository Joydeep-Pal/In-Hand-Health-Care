import { useNavigate } from 'react-router-dom'

// results: [{ diseaseId, name, matchPercent }]
export default function SymptomMatchResults({ results }) {
  const navigate = useNavigate()

  return (
    <div className="max-w-[85%] bg-white border border-teal-100 rounded-chat p-4 space-y-3">
      <p className="text-sm font-semibold text-ink">Possible conditions</p>

      {results.map((r) => (
        <div key={r.diseaseId} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{r.name}</span>
            <span className="text-slate-soft">{r.matchPercent}% symptom match</span>
          </div>
          <div className="h-2 w-full bg-teal-50 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-400 rounded-full"
              style={{ width: `${r.matchPercent}%` }}
            />
          </div>
          <button
            onClick={() => navigate(`/diseases/${r.diseaseId}`)}
            className="text-xs text-teal-600 font-medium hover:underline"
          >
            View details →
          </button>
        </div>
      ))}

      <p className="text-[11px] text-slate-soft pt-1 border-t border-teal-50">
        This is a symptom-match estimate, not a medical diagnosis.
      </p>
    </div>
  )
}
