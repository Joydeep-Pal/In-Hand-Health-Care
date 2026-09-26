export default function AboutPage() {
  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-lg font-semibold">About In-Hand Health Care</h1>
      <p className="text-sm text-slate-soft leading-relaxed">
        In-Hand Health Care helps you understand your symptoms, explore possible conditions using a
        structured medical knowledge base, read detailed disease information, and locate nearby
        pharmacies that stock the medicines you need — one connected journey from symptoms to
        care.
      </p>
      <div className="bg-alert-bg border border-alert-border text-alert-text rounded-xl p-4 text-sm leading-relaxed">
        This tool provides educational information and symptom-based matching. It does not
        provide a definitive medical diagnosis. Always consult a qualified healthcare
        professional for medical advice, and seek emergency care immediately if you notice any
        severe or worsening symptoms.
      </div>
    </div>
  )
}
