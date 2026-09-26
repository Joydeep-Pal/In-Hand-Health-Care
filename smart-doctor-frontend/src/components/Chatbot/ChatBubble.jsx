function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatBubble({ from, text, timestamp }) {
  const isUser = from === 'user'
  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-chat text-sm leading-relaxed ${
          isUser
            ? 'bg-teal-500 text-white rounded-br-sm'
            : 'bg-teal-50 text-ink rounded-bl-sm'
        }`}
      >
        {text}
      </div>
      <span className="text-[11px] text-slate-soft mt-1 px-1">
        {formatTime(timestamp)}
      </span>
    </div>
  )
}
