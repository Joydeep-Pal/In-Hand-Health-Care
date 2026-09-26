import { useEffect, useRef, useState } from 'react'
import { AudioLines, ImagePlus, LoaderCircle, Mic, Pause, Play, Square, Upload } from 'lucide-react'
import { recognizeDisease } from '../../api.js'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024

export default function DiseaseRecognizerPage() {
  const [image, setImage] = useState(null)
  const [audio, setAudio] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingPaused, setRecordingPaused] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [audioInputs, setAudioInputs] = useState([])
  const [microphoneId, setMicrophoneId] = useState('')
  const imageInputRef = useRef(null)
  const audioInputRef = useRef(null)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const audioChunksRef = useRef([])

  useEffect(() => {
    if (!image) {
      setPreviewUrl('')
      return
    }

    const objectUrl = URL.createObjectURL(image)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [image])

  useEffect(() => {
    if (!audio) {
      setAudioUrl('')
      return
    }

    const objectUrl = URL.createObjectURL(audio)
    setAudioUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [audio])

  useEffect(() => () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  useEffect(() => {
    if (!recording || recordingPaused) return undefined
    const timer = window.setInterval(() => setRecordingSeconds((seconds) => seconds + 1), 1000)
    return () => window.clearInterval(timer)
  }, [recording, recordingPaused])

  function selectImage(selectedImage) {
    setError('')
    setResult(null)

    if (!selectedImage) return
    setImage(null)
    if (selectedImage.type !== 'image/jpeg') {
      setError('Choose a JPEG image.')
      if (imageInputRef.current) imageInputRef.current.value = ''
      return
    }
    if (selectedImage.size > MAX_IMAGE_SIZE) {
      setError('The image must be 10 MB or smaller.')
      if (imageInputRef.current) imageInputRef.current.value = ''
      return
    }

    setImage(selectedImage)
  }

  function handleImageChange(event) {
    selectImage(event.target.files?.[0])
  }

  function handleDrop(event) {
    event.preventDefault()
    selectImage(event.dataTransfer.files?.[0])
  }

  function handleAudioChange(event) {
    const selectedAudio = event.target.files?.[0]
    setError('')

    if (!selectedAudio) return
    setAudio(null)
    if (!selectedAudio.type.startsWith('audio/')) {
      setError('Choose a valid audio file.')
      event.target.value = ''
      return
    }
    if (selectedAudio.size > MAX_IMAGE_SIZE) {
      setError('The audio must be 10 MB or smaller.')
      event.target.value = ''
      return
    }

    setAudio(selectedAudio)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!image || pending) return

    setPending(true)
    setError('')
    try {
      setResult(await recognizeDisease(image, audio))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setPending(false)
    }
  }

  async function startRecording() {
    setError('')
    try {
      const audioConstraints = microphoneId ? { deviceId: { exact: microphoneId } } : true
      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
      const availableInputs = (await navigator.mediaDevices.enumerateDevices())
        .filter((device) => device.kind === 'audioinput')
      setAudioInputs(availableInputs)
      const activeDeviceId = stream.getAudioTracks()[0]?.getSettings().deviceId
      if (!microphoneId && activeDeviceId) setMicrophoneId(activeDeviceId)

      const recorder = new MediaRecorder(stream)
      streamRef.current = stream
      recorderRef.current = recorder
      audioChunksRef.current = []
      setAudio(null)
      setRecordingSeconds(0)
      setRecordingPaused(false)
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (blob.size > 0) setAudio(new File([blob], 'voice-question.webm', { type: blob.type }))
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        setRecording(false)
        setRecordingPaused(false)
      }
      recorder.start()
      setRecording(true)
    } catch {
      setError('Microphone access is unavailable. Allow microphone access or upload an audio file.')
    }
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop()
  }

  function toggleRecordingPause() {
    const recorder = recorderRef.current
    if (!recorder) return
    if (recorder.state === 'recording') {
      recorder.pause()
      setRecordingPaused(true)
    } else if (recorder.state === 'paused') {
      recorder.resume()
      setRecordingPaused(false)
    }
  }

  function formatRecordingTime(seconds) {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
    const remainder = (seconds % 60).toString().padStart(2, '0')
    return `${minutes}:${remainder}`
  }

  function handleReset() {
    stopRecording()
    setImage(null)
    setAudio(null)
    setResult(null)
    setError('')
    if (imageInputRef.current) imageInputRef.current.value = ''
    if (audioInputRef.current) audioInputRef.current.value = ''
  }

  return (
    <div className="min-h-full bg-paper px-4 py-5 text-ink sm:px-6">
      <header className="mx-auto mb-6 max-w-6xl text-center">
        <h1 className="text-xl font-semibold sm:text-2xl">AI Doctor with Vision and Voice</h1>
      </header>

      <form onSubmit={handleSubmit} className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <section className="rounded border border-teal-100 bg-white p-3">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
              <Mic className="h-4 w-4 text-teal-500" />
              Audio Input
            </div>
            <div className="flex min-h-12 flex-wrap items-center gap-3">
              <label className="sr-only" htmlFor="microphone-select">Microphone</label>
              <select
                id="microphone-select"
                value={microphoneId}
                disabled={recording}
                onChange={(event) => setMicrophoneId(event.target.value)}
                className="min-w-36 max-w-full rounded border border-teal-100 bg-paper px-3 py-2 text-sm text-ink disabled:opacity-60"
              >
                <option value="">Default microphone</option>
                {audioInputs.map((device, index) => (
                  <option key={device.deviceId || index} value={device.deviceId}>
                    {device.label || `Microphone ${index + 1}`}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                className={`inline-flex items-center gap-2 rounded border px-4 py-2 text-sm font-medium ${recording ? 'border-alert-border bg-alert-bg text-alert-text' : 'border-teal-100 bg-paper text-ink hover:bg-teal-50'}`}
              >
                {recording ? <Square className="h-4 w-4 fill-current" /> : <span className="h-3 w-3 rounded-full bg-teal-500" />}
                {recording ? 'Stop recording' : 'Record'}
              </button>
              {recording && (
                <>
                  <button
                    type="button"
                    onClick={toggleRecordingPause}
                    aria-label={recordingPaused ? 'Resume recording' : 'Pause recording'}
                    className="inline-flex items-center gap-2 rounded border border-teal-100 bg-paper px-3 py-2 text-sm text-ink hover:bg-teal-50"
                  >
                    {recordingPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    {recordingPaused ? 'Resume' : 'Pause'}
                  </button>
                  <span aria-live="polite" className="min-w-12 font-mono text-sm text-slate-soft">
                    {formatRecordingTime(recordingSeconds)}
                  </span>
                </>
              )}
              <input
                ref={audioInputRef}
                id="recognizer-audio"
                type="file"
                accept="audio/*"
                onChange={handleAudioChange}
                className="sr-only"
              />
              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded border border-teal-100 bg-paper px-4 py-2 text-sm text-ink hover:bg-teal-50"
              >
                <Upload className="h-4 w-4" />
                Upload audio
              </button>
              {audio && <span className="min-w-0 truncate text-xs text-slate-soft">{audio.name}</span>}
            </div>
            {audioUrl && <audio controls preload="none" src={audioUrl} className="mt-3 w-full" />}
          </section>

          <section
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            className="flex min-h-[300px] flex-col overflow-hidden rounded border border-dashed border-teal-100 bg-white sm:min-h-[350px]"
          >
            <div className="flex items-center gap-2 border-b border-teal-100 px-3 py-2 text-sm text-ink">
              <ImagePlus className="h-4 w-4 text-teal-500" />
              Image Input
            </div>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex flex-1 flex-col items-center justify-center gap-3 p-5 text-center text-slate-soft hover:bg-teal-50"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Selected image for analysis" className="max-h-64 max-w-full object-contain" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-teal-500" />
                  <span className="text-base">Drop image here</span>
                  <span className="text-sm text-slate-soft">or click to upload a JPEG</span>
                </>
              )}
              {image && <span className="max-w-full truncate text-xs text-slate-soft">{image.name}</span>}
            </button>
            <input
              ref={imageInputRef}
              id="recognizer-image"
              type="file"
              accept="image/jpeg,.jpg,.jpeg"
              onChange={handleImageChange}
              className="sr-only"
            />
          </section>

          {error && <p role="alert" className="text-sm text-alert-text">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={pending}
              className="rounded border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-semibold text-ink hover:bg-teal-100 disabled:opacity-50"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={!image || pending}
              className="inline-flex items-center justify-center gap-2 rounded bg-teal-500 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {pending ? 'Analyzing…' : 'Submit'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <section className="space-y-4 rounded border border-teal-100 bg-white p-4">
            <label className="block text-sm font-medium text-ink">
              Speech to Text
              <textarea
                readOnly
                rows={2}
                value={result?.transcript || ''}
                className="mt-2 w-full resize-y rounded border border-teal-100 bg-paper px-3 py-2 text-sm text-ink outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-ink">
              Doctor&apos;s Response
              <textarea
                readOnly
                rows={3}
                value={result?.reply || ''}
                className="mt-2 min-h-64 w-full resize-y rounded border border-teal-100 bg-paper px-3 py-2 text-sm leading-6 text-ink outline-none"
              />
            </label>
            {result?.disclaimer && <p className="text-xs text-slate-soft">{result.disclaimer}</p>}
          </section>

          <section className="rounded border border-teal-100 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
              <AudioLines className="h-4 w-4 text-teal-500" />
              Doctor&apos;s Voice
            </div>
            {result?.audio_base64 ? (
              <audio
                controls
                preload="none"
                className="w-full"
                src={`data:${result.audio_content_type || 'audio/wav'};base64,${result.audio_base64}`}
              />
            ) : (
              <div className="flex h-20 items-center justify-center text-slate-soft">
                <AudioLines className="h-6 w-6" />
              </div>
            )}
          </section>

          <p className="text-center text-xs text-slate-soft">
            Informational only. This tool does not provide a medical diagnosis.
          </p>
        </div>
      </form>
    </div>
  )
}
