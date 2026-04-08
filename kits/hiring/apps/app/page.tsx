"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Sparkles, Mail, Briefcase, MapPin, Clock, ChevronRight } from "lucide-react"
import { jobsData, type Job } from "@/lib/jobs-data"
import Image from "next/image"
import { executeHiringAnalysis } from "@/actions/orchestrate"

export default function HomePage() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  })
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file")
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB")
        return
      }
      setResumeFile(file)
      setError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name || !formData.email || !resumeFile || !selectedJob) {
      setError("Please fill in all fields and upload a resume")
      return
    }

    setIsSubmitting(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", resumeFile)

      const uploadResponse = await fetch("/api/upload-resume", {
        method: "POST",
        body: uploadFormData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload resume")
      }

      const { url: resume_url } = await uploadResponse.json()

      const formattedJobDescription = `title: ${selectedJob.title}

category: ${selectedJob.category}

description: ${selectedJob.description}

requirements:
${selectedJob.requirements.map((req) => `- ${req}`).join("\n")}

location: ${selectedJob.location}

type: ${selectedJob.type}`

      const analysisResult = await executeHiringAnalysis({
        name: formData.name,
        email: formData.email,
        job_description: formattedJobDescription,
        resume_url,
      })

      if (!analysisResult.success) {
        throw new Error(analysisResult.error || "Analysis failed")
      }

      setResult(analysisResult.result)
      setIsSubmitting(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsSubmitting(false)
    }
  }

  if (result) {
    const getScoreColor = (score: number) => {
      if (score >= 8) return "text-green-400"
      if (score >= 6) return "text-yellow-400"
      return "text-red-400"
    }

    const getScoreBgColor = (score: number) => {
      if (score >= 8) return "bg-green-950/30 border-green-800/50"
      if (score >= 6) return "bg-yellow-950/30 border-yellow-800/50"
      return "bg-red-950/30 border-red-800/50"
    }

    const isRecommended = result.recommendation?.toLowerCase() !== "rejected"

    return (
      <div className="min-h-screen bg-black">
        <header className="border-b border-purple-900/30 backdrop-blur-sm bg-black/80 px-6 py-4 sticky top-0 z-50">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <Image src="/images/lamatic-logo.png" alt="Lamatic" width={32} height={32} className="w-8 h-8" />
              <h1 className="text-2xl font-bold tracking-tight select-none">
                <span className="text-white">Hiring Automation</span>
                <span className="text-purple-400"> Kit</span>
              </h1>
            </div>
            <div className="flex gap-4">
              <a
                href="https://lamatic.ai/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Docs
              </a>
              <a
                href="https://github.com/Lamatic/AgentKit"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                GitHub
              </a>
            </div>
          </div>
        </header>

        <div className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-950/30 text-green-400 rounded-full text-sm font-medium mb-4 border border-green-800/50">
                <Sparkles className="w-4 h-4" />
                Evaluation Complete
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">Application Assessment Results</h1>
              <p className="text-lg text-gray-400">for {result.input.name}</p>
              {selectedJob && <p className="text-purple-400 mt-2">{selectedJob.title}</p>}
            </div>

            {/* Email Notification Banner */}
            <div className="mb-8 p-4 bg-cyan-950/30 border border-cyan-800/50 rounded-lg flex items-center gap-3">
              <Mail className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <p className="text-sm text-cyan-100">
                <strong>Email Sent!</strong> The evaluation results have been automatically sent to{" "}
                <span className="font-medium">{result.input.email}</span>
              </p>
            </div>

            {/* Score Card */}
            <Card className={`mb-6 border-2 ${getScoreBgColor(result.score)} bg-gray-900/50`}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-6xl font-bold mb-2">
                    <span className={getScoreColor(result.score)}>{result.score}</span>
                    <span className="text-gray-600">/10</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-300">Overall Match Score</p>
                </div>
              </CardContent>
            </Card>

            {/* Recommendation */}
            <Card className="mb-6 bg-gray-900/50 border-purple-900/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isRecommended ? (
                    <>
                      <Sparkles className="w-6 h-6 text-green-400" />
                      <span className="text-green-400">Recommended for Selection</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6 text-red-400" />
                      <span className="text-red-400">Not Recommended</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Based on the AI analysis, this candidate is{" "}
                  <strong className="text-white">{isRecommended ? "recommended" : "not recommended"}</strong> for the
                  position.
                </p>
              </CardContent>
            </Card>

            {/* Strengths */}
            <Card className="mb-6 bg-gray-900/50 border-purple-900/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-400">
                  <ChevronRight className="w-6 h-6" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-invert max-w-none text-white [&_ul]:text-gray-200 [&_li]:text-gray-200 [&_p]:text-gray-200"
                  dangerouslySetInnerHTML={{ __html: result.strength }}
                />
              </CardContent>
            </Card>

            {/* Weaknesses */}
            <Card className="mb-8 bg-gray-900/50 border-purple-900/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-400">
                  <ChevronRight className="w-6 h-6" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-invert max-w-none text-white [&_ul]:text-gray-200 [&_li]:text-gray-200 [&_p]:text-gray-200"
                  dangerouslySetInnerHTML={{ __html: result.weakness }}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  setResult(null)
                  setSelectedJob(null)
                  setFormData({ name: "", email: "" })
                  setResumeFile(null)
                }}
                variant="outline"
                className="w-full bg-transparent border-purple-700 text-purple-400 hover:bg-purple-950/30"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Evaluate Another Candidate
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-purple-900/30 backdrop-blur-sm bg-black/80 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Image src="/images/lamatic-logo.png" alt="Lamatic" width={32} height={32} className="w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-tight select-none">
              <span className="text-white">Hiring Automation</span>
              <span className="text-purple-400"> Kit</span>
            </h1>
          </div>
          <div className="flex gap-4">
            <a
              href="https://lamatic.ai/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              Docs
            </a>
            <a
              href="https://github.com/Lamatic/AgentKit"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-73px)]">
        <div
          className={`w-80 border-r border-purple-900/30 bg-gradient-to-b from-purple-950/20 to-black overflow-y-auto ${
            selectedJob && isSubmitting ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-2">Open Positions</h2>
              <p className="text-sm text-gray-400">Select a role to apply</p>
            </div>

            <div className="space-y-6">
              {jobsData.map((category) => (
                <div key={category.name}>
                  <h3 className="text-sm font-semibold text-purple-400 mb-3 uppercase tracking-wider">
                    {category.name}
                  </h3>
                  <div className="space-y-2">
                    {category.jobs.map((job) => (
                      <button
                        key={job.id}
                        onClick={() => setSelectedJob(job)}
                        disabled={isSubmitting}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          selectedJob?.id === job.id
                            ? "bg-purple-600/20 border-purple-500 shadow-lg shadow-purple-500/20"
                            : "bg-gray-900/50 border-gray-800 hover:border-purple-700 hover:bg-gray-900"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white text-sm mb-1 truncate">{job.title}</h4>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {job.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {job.type}
                              </span>
                            </div>
                          </div>
                          {selectedJob?.id === job.id && (
                            <ChevronRight className="w-5 h-5 text-purple-400 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!selectedJob ? (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Select a Position</h2>
                <p className="text-gray-400">
                  Choose a role from the left sidebar to view details and submit your application
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 max-w-4xl mx-auto">
              {/* Job Details */}
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-sm font-medium mb-4 border border-purple-500/30">
                  <Sparkles className="w-4 h-4" />
                  {selectedJob.category}
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">{selectedJob.title}</h2>
                <div className="flex flex-wrap gap-4 text-gray-400 mb-6">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {selectedJob.location}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {selectedJob.type}
                  </span>
                </div>
                <div className="prose prose-invert max-w-none">
                  <div className="text-gray-300 whitespace-pre-line mb-6">{selectedJob.description}</div>
                  <h3 className="text-xl font-semibold text-white mb-3">Requirements</h3>
                  <ul className="space-y-2">
                    {selectedJob.requirements.map((req, idx) => (
                      <li key={idx} className="text-gray-300">
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Application Form */}
              <Card className="bg-gray-900/50 border-purple-900/30 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Apply for this Position</CardTitle>
                  <CardDescription className="text-gray-400">
                    Fill in your details and upload your resume for AI-powered evaluation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-200">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={isSubmitting}
                        className="bg-black/50 border-gray-700 text-white placeholder:text-gray-500"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-200">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        disabled={isSubmitting}
                        className="bg-black/50 border-gray-700 text-white placeholder:text-gray-500"
                      />
                    </div>

                    {/* Resume Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="resume" className="text-gray-200">
                        Resume (PDF)
                      </Label>
                      <div className="relative">
                        <Input
                          id="resume"
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          required
                          disabled={isSubmitting}
                          className="cursor-pointer bg-black/50 border-gray-700 text-white file:text-white"
                        />
                        {resumeFile && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-cyan-400">
                            <Upload className="w-4 h-4" />
                            <span>{resumeFile.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="p-4 bg-red-950/50 border border-red-800 rounded-lg text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white h-12 text-base font-medium"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Submit Application
                        </>
                      )}
                    </Button>

                    {/* Email Notice */}
                    <div className="flex items-start gap-3 p-4 bg-cyan-950/30 border border-cyan-800/50 rounded-lg">
                      <Mail className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-cyan-100">
                        <strong>Instant Updates:</strong> You'll receive evaluation results via email as soon as the AI
                        analysis is complete.
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
