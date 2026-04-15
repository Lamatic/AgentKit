"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2, Sparkles, Presentation, CheckCircle2, ChevronRight, RefreshCw, Briefcase, ThumbsUp, ThumbsDown, Target, Mic, MicOff, Activity } from "lucide-react"
import { generateQuestions, evaluateAnswers } from "@/actions/orchestrate"
import { Header } from "@/components/header"

type Step = "setup" | "interview" | "feedback"

const MAX_CHARS = 1500

export default function InterviewPrepPage() {
  const [step, setStep] = useState<Step>("setup")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Form State
  const [jobTitle, setJobTitle] = useState("")
  const [jobDesc, setJobDesc] = useState("")
  const [yearsOfExp, setYearsOfExp] = useState("")

  // Interview State
  const [questions, setQuestions] = useState<string[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [candidateResponses, setCandidateResponses] = useState<{ question: string; answers: string }[]>([])

  // Feedback State
  const [feedback, setFeedback] = useState<{ positives: string[]; negatives: string[]; rating: number } | null>(null)

  // Mic & Audio Analyzer State
  const [isRecording, setIsRecording] = useState(false)
  const [interimResult, setInterimResult] = useState("")
  const [volume, setVolume] = useState(0)

  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<any>(null)
  const analyserRef = useRef<any>(null)
  const mediaStreamRef = useRef<any>(null)
  const animationRef = useRef<any>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording()
    }
  }, [])

  const startRecording = async () => {
    setError("")

    try {
      // 1. Setup Audio Visualizer
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      const audioCtx = new AudioContext()
      audioContextRef.current = audioCtx

      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser

      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const updateVolume = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i]
        }
        const avg = sum / dataArray.length
        setVolume(avg) // 0 to ~100
        animationRef.current = requestAnimationFrame(updateVolume)
      }
      updateVolume()

      // 2. Setup Native Web Speech API
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true // Crucial for real-time updates!
        recognition.lang = "en-US"

        recognition.onstart = () => {
          setIsRecording(true)
        }

        recognition.onresult = (event: any) => {
          let interim = ""
          let finalTr = ""

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTr += event.results[i][0].transcript
            } else {
              interim += event.results[i][0].transcript
            }
          }

          if (finalTr) {
            setCurrentAnswer((prev) => {
              const newAns = prev + (prev.length > 0 && !prev.endsWith(" ") ? " " : "") + finalTr
              return newAns.slice(0, MAX_CHARS)
            })
          }
          setInterimResult(interim) // Pushes interim results instantly
        }

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error payload:", event.error)
          if (event.error === 'no-speech') {
            // Ignore silent periods
            return;
          }
          
          if (event.error === 'not-allowed') {
            setError("Mic blocked: Must use localhost or HTTPS, and allow permissions.")
          } else if (event.error === 'network') {
            setError("Network error: Try using localhost instead of your IP address.")
          } else if (event.error !== 'aborted') {
            setError(`Speech API error: ${event.error}`)
          }
          
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
             stopRecording()
          }
        }

        recognition.onend = () => {
          stopRecording()
        }

        recognitionRef.current = recognition
        recognition.start()
      } else {
        stopRecording()
        setError("Your browser does not support native Speech Recognition. Please try Google Chrome.")
      }
    } catch (err) {
      console.error(err)
      setError("Failed to access your microphone.")
      stopRecording()
    }
  }

  const stopRecording = () => {
    setIsRecording(false)
    setInterimResult("")

    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track: any) => track.stop())
      mediaStreamRef.current = null
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(console.error)
      audioContextRef.current = null
    }

    setVolume(0)
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault()

    // ✨ Job Description is now optional
    if (!jobTitle.trim() || !yearsOfExp.trim()) {
      setError("Please fill in Job Title and Years of Experience.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const exp = parseInt(yearsOfExp) || 0
      const response = await generateQuestions(jobTitle, exp, jobDesc)

      if (response.success && response.questions) {
        setQuestions(response.questions)
        setStep("interview")
      } else {
        setError(response.error || "Failed to generate questions. Check Lamatic configuration.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNextQuestion = async () => {
    const finalAnswer = currentAnswer + (interimResult ? (currentAnswer.endsWith(" ") ? "" : " ") + interimResult : "")
    
    if (!finalAnswer.trim()) {
      setError("Please provide an answer before moving on.")
      return
    }
    setError("")

    if (isRecording) {
      stopRecording()
    }

    const newResponses = [...candidateResponses, { question: questions[currentQuestionIndex], answers: finalAnswer }]

    if (currentQuestionIndex < questions.length - 1) {
      setCandidateResponses(newResponses)
      setCurrentAnswer("")
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      setCandidateResponses(newResponses)
      setIsLoading(true)

      try {
        const response = await evaluateAnswers(newResponses)
        if (response.success && response.feedback) {
          setFeedback(response.feedback)
          setStep("feedback")
        } else {
          setError(response.error || "Failed to evaluate answers.")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleReset = () => {
    setStep("setup")
    setJobTitle("")
    setJobDesc("")
    setYearsOfExp("")
    setQuestions([])
    setCurrentQuestionIndex(0)
    setCurrentAnswer("")
    setCandidateResponses([])
    setFeedback(null)
    setError("")
    if (isRecording) {
      stopRecording()
    }
  }

  const renderSetup = () => (
    <div className="flex flex-col items-center pt-8 md:pt-16 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="text-center mb-10 max-w-2xl">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-full mb-6">
          <Presentation className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-800">
          Ace Your Next Interview
        </h1>
        <p className="text-lg text-slate-500 leading-relaxed font-medium">
          Tell us about the role. Our AI agent will dynamically generate customized questions, guide you through a mock interview, and provide actionable feedback.
        </p>
      </div>

      <Card className="p-8 w-full max-w-xl mx-auto backdrop-blur-xl bg-white/90 border-slate-200 shadow-xl shadow-indigo-100/50 rounded-2xl">
        <form onSubmit={handleStartInterview} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="jobTitle" className="text-sm font-bold text-slate-700">
              Job Title <span className="text-rose-500">*</span>
            </label>
            <Input
              id="jobTitle"
              placeholder="e.g. Senior Frontend Engineer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="h-12 border-slate-300 focus-visible:ring-indigo-500 rounded-xl"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="yearsOfExp" className="text-sm font-bold text-slate-700">
              Years of Experience Required <span className="text-rose-500">*</span>
            </label>
            <Input
              id="yearsOfExp"
              type="number"
              min="0"
              placeholder="e.g. 3"
              value={yearsOfExp}
              onChange={(e) => setYearsOfExp(e.target.value)}
              className="h-12 border-slate-300 focus-visible:ring-indigo-500 rounded-xl"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="jobDesc" className="text-sm font-bold text-slate-700">
                Job Description
              </label>
              <span className="text-xs font-medium text-slate-400">Optional</span>
            </div>
            <Textarea
              id="jobDesc"
              placeholder="Paste the job description here. If left empty, generic role questions will be asked."
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              className="min-h-[140px] resize-none border-slate-300 focus-visible:ring-indigo-500 rounded-xl py-3"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-lg font-semibold shadow-md shadow-indigo-200 transition-all active:scale-[0.98]"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-3" />
                Setting up interview...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-3" />
                Start Mock Interview
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  )

  const renderInterview = () => {
    const progress = Math.round((currentQuestionIndex / questions.length) * 100)
    const isLastQuestion = currentQuestionIndex === questions.length - 1

    const displayAnswer = currentAnswer + (interimResult ? (currentAnswer.endsWith(" ") ? "" : " ") + interimResult : "")

    // Calculate a dynamic scale for the visualizer pulse (1 to 1.5 roughly)
    const visualizerScale = 1 + Math.min(volume / 50, 0.5)

    return (
      <div className="flex flex-col items-center pt-8 md:pt-12 animate-in fade-in zoom-in-95 duration-500 w-full max-w-3xl mx-auto">
        <div className="w-full mb-8">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-bold text-transparent select-none">&nbsp;</span>
            <span className="text-xs font-bold text-slate-400">{progress}% Complete</span>
          </div>
          <div className="h-2.5 w-full bg-indigo-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Card className="w-full bg-white shadow-2xl shadow-indigo-100/40 border-0 rounded-3xl overflow-hidden ring-1 ring-slate-100 p-8 md:p-10 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>

          <div className="flex gap-4 mb-6">
            <div className="flex-shrink-0 mt-1">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight">
                {questions[currentQuestionIndex]}
              </h2>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between pl-1 pr-1">
              <label htmlFor="answer" className="text-sm font-bold text-slate-600 uppercase tracking-widest">
                Your Answer
              </label>

            </div>

            <div className="relative">
              <Textarea
                id="answer"
                placeholder="Type your answer here..."
                value={displayAnswer}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARS) {
                    setCurrentAnswer(e.target.value)
                  }
                }}
                className={`min-h-[240px] text-base resize-none border-slate-200 focus-visible:bg-white focus-visible:ring-2 rounded-2xl p-5 leading-relaxed shadow-inner transition-colors duration-300 pb-10 ${
                  isRecording ? 'bg-indigo-50/20 focus-visible:ring-rose-400 border-indigo-100' : 'bg-slate-50 focus-visible:ring-indigo-500'
                }`}
                disabled={isLoading}
              />
              <div className={`absolute bottom-3 right-4 text-xs font-semibold ${displayAnswer.length >= MAX_CHARS ? 'text-rose-500' : 'text-slate-400'}`}>
                {displayAnswer.length} / {MAX_CHARS}
              </div>
              {isRecording && (
                <div className="absolute bottom-3 left-4 flex items-center gap-2 text-xs font-semibold text-rose-500 animate-pulse">
                  <Activity className="w-3 h-3" />
                  Listening actively...
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleNextQuestion}
              className="h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-base font-semibold transition-all active:scale-95 flex items-center gap-2 group"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Evaluating...
                </>
              ) : (
                <>
                  {isLastQuestion ? "Finish & Get Feedback" : "Next Question"}
                  {isLastQuestion ? <CheckCircle2 className="w-5 h-5" /> : <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const renderFeedback = () => {
    if (!feedback) return null

    const getScoreColor = (score: number) => {
      if (score >= 8) return "text-emerald-500"
      if (score >= 5) return "text-amber-500"
      return "text-red-500"
    }

    return (
      <div className="flex flex-col items-center pt-8 md:pt-12 animate-in fade-in slide-in-from-bottom-8 duration-700 w-full max-w-4xl mx-auto pb-12">
        <div className="text-center mb-10 w-full">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-800">
            Interview Feedback
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
            Here is a detailed breakdown of your performance from our AI evaluator.
          </p>
        </div>

        <Card className="p-8 md:p-12 w-full bg-white shadow-2xl shadow-indigo-100/50 border-slate-200 rounded-3xl mb-8 flex flex-col md:flex-row items-center justify-between gap-8 sm:-ml-4 sm:-mr-4">
          <div className="space-y-4 max-w-sm text-center md:text-left">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center md:justify-start gap-3">
              <Target className="w-7 h-7 text-indigo-500" />
              Global Assessment
            </h2>
            <p className="text-slate-500 leading-relaxed">
              Your answers have been analyzed based on technical accuracy, clarity, and professionalism. Review your key strengths and areas for improvement below.
            </p>
          </div>
          <div className="flex-shrink-0 relative flex items-center justify-center p-8 bg-slate-50 rounded-full ring-1 ring-slate-100">
            <div className="absolute inset-0 bg-indigo-50 rounded-full scale-110 -z-10 animate-pulse"></div>
            <div className="flex flex-col items-center text-center">
              <span className={`text-6xl font-black ${getScoreColor(feedback.rating)}`}>
                {feedback.rating}
              </span>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">out of 10</span>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-8 w-full mb-12">
          {/* Positives */}
          <Card className="p-6 md:p-8 bg-emerald-50/50 border-emerald-100 rounded-3xl shadow-lg shadow-emerald-100/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                <ThumbsUp className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-emerald-900">What You Did Well</h3>
            </div>
            <ul className="space-y-4">
              {feedback.positives.map((item, idx) => (
                <li key={idx} className="flex gap-3 text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{item}</span>
                </li>
              ))}
              {feedback.positives.length === 0 && (
                <div className="text-emerald-700/60 italic font-medium">No particular strengths mentioned.</div>
              )}
            </ul>
          </Card>

          {/* Negatives */}
          <Card className="p-6 md:p-8 bg-rose-50/50 border-rose-100 rounded-3xl shadow-lg shadow-rose-100/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-rose-100 rounded-full text-rose-600">
                <ThumbsDown className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-rose-900">Areas for Improvement</h3>
            </div>
            <ul className="space-y-4">
              {feedback.negatives.map((item, idx) => (
                <li key={idx} className="flex gap-3 text-rose-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0 mt-2.5 ml-1.5 mr-1" />
                  <span className="leading-relaxed font-medium">{item}</span>
                </li>
              ))}
              {feedback.negatives.length === 0 && (
                <div className="text-rose-700/60 italic font-medium">No particular areas for improvement mentioned.</div>
              )}
            </ul>
          </Card>
        </div>

        <Button
          onClick={handleReset}
          className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-lg font-semibold shadow-xl shadow-indigo-200/50 transition-all active:scale-95 flex items-center gap-3"
        >
          <RefreshCw className="w-5 h-5" />
          Practice For Another Topic
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Header />
      <main className="px-6 pb-20 max-w-7xl mx-auto">
        {step === "setup" && renderSetup()}
        {step === "interview" && renderInterview()}
        {step === "feedback" && renderFeedback()}
      </main>
    </div>
  )
}
