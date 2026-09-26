import { useState } from 'react'
import { Send } from 'lucide-react'

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('')

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex items-end gap-2 border-t border-teal-100 bg-white p-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        placeholder="Describe your symptoms..."
        className="flex-1 resize-none rounded-lg border border-teal-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
      />
      <button
        onClick={handleSend}
        disabled={disabled}
        className="flex items-center gap-1.5 rounded-lg bg-teal-500 text-white text-sm font-medium px-4 py-2.5 hover:bg-teal-600 transition-colors disabled:opacity-50"
      >
        Send
        <Send className="w-4 h-4" />
      </button>
    </div>
  )
}
