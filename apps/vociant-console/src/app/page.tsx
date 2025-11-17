import Link from 'next/link';
import { ArrowRight, Bot, Mic, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2">
            <Mic className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold">Vociant</span>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Open Console
          </Link>
        </nav>

        {/* Hero */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            The ElevenLabs Agents Platform... but vendor-agnostic and open
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Build production-grade voice agents with your choice of TTS, STT, and LLM providers.
            No vendor lock-in. Full control over your conversational AI stack.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Vendor Agnostic</h3>
            <p className="text-gray-600">
              Mix and match providers: ElevenLabs TTS + Deepgram STT + OpenAI LLM. Your stack, your choice.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Bot className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Full Agent Control</h3>
            <p className="text-gray-600">
              Configure personality, conversation flow, tools, RAG knowledge bases—everything ElevenLabs offers, but open.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Mic className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Production Ready</h3>
            <p className="text-gray-600">
              Real-time streaming, WebSocket orchestration, tool execution, analytics—built for scale.
            </p>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-20 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Built for Developers</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h4 className="font-semibold mb-3">TypeScript Monorepo</h4>
              <p className="text-sm text-gray-600 mb-4">
                <code className="bg-gray-100 px-2 py-1 rounded">@vociant/core</code> — Provider abstractions, SessionEngine, tools
              </p>
              <p className="text-sm text-gray-600">
                <code className="bg-gray-100 px-2 py-1 rounded">vociant-console</code> — Next.js control plane with REST + WebSocket APIs
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h4 className="font-semibold mb-3">Supported Providers</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>TTS:</strong> ElevenLabs, Google, Deepgram, OpenAI, Azure</p>
                <p><strong>STT:</strong> ElevenLabs Scribe, Deepgram, Google, OpenAI Whisper</p>
                <p><strong>LLM:</strong> OpenAI, Anthropic, Google Gemini, OpenRouter</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
