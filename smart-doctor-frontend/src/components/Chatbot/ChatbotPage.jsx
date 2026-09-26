import { useEffect, useRef, useState } from 'react'
import { sendChatMessage } from '../../api.js'
import ChatBubble from './ChatBubble.jsx'
import ChatInput from './ChatInput.jsx'

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: 'bot',
      text: "Hi, I'm here to help understand your symptoms. What's been going on?",
      timestamp: new Date(),
    },
  ])
  const [pending, setPending] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function handleSend(text) {
    const userMessage = { id: Date.now(), from: 'user', text, timestamp: new Date() }
    setMessages((prev) => [...prev, userMessage])
    setPending(true)

    const history = messages.slice(1).map((message) => ({
      role: message.from === 'user' ? 'user' : 'assistant',
      content: message.text,
    }))

    try {
      const response = await sendChatMessage(text, history)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          from: 'bot',
          text: response.reply,
          timestamp: new Date(),
        },
      ])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          from: 'bot',
          text: error.message,
          timestamp: new Date(),
        },
      ])
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-teal-100 bg-white">
        <h1 className="text-sm font-semibold text-ink">Chatbot — symptom check</h1>
      </div>

      <div ref={scrollRef} className="chat-scroll flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className="space-y-3">
            <ChatBubble from={m.from} text={m.text} timestamp={m.timestamp} />
          </div>
        ))}
        {pending && (
          <div className="text-xs text-slate-soft px-1">In-Hand Health Care is typing…</div>
        )}
      </div>

      <ChatInput onSend={handleSend} disabled={pending} />

      <p className="text-[11px] text-slate-soft text-center py-2 bg-white border-t border-teal-50">
        This tool provides educational information and does not provide a medical diagnosis.
      </p>
    </div>
  )
}
