"use client";
import React, { useState, KeyboardEvent, FormEvent, useEffect, useRef } from "react";
import { useRetroChat } from "@/hooks/use-retro-chat";
import { useProphecyLimit } from "@/hooks/use-prophecy-limit";
import type { ChatMessage } from "@/lib/types";
import BasicResponse from "./components/responses/BasicResponse";
import ResearchResponse from "./components/responses/ResearchResponse";
import TemporalResponse from "./components/responses/TemporalResponse";
import ClarificationResponse from "./components/responses/ClarificationResponse";
import { logger } from "@/lib/logger";

type Message = {
  id: number;
  sender: "system" | "user";
  content: string | React.ReactNode;
};

// Render workflow response as React components
function renderResponse(
  message: ChatMessage,
  onClarificationSelect: (data: { query: string; start: string; end: string }) => void
): {
  node: React.ReactNode;
} {
  const clarificationPart = message.parts.find(
    (p) => p.type === "data-temporalClarification"
  );
  if (clarificationPart && clarificationPart.type === "data-temporalClarification") {
    return {
      node: (
        <ClarificationResponse
          data={clarificationPart.data}
          onSelect={onClarificationSelect}
        />
      ),
    };
  }

  const textParts = message.parts.filter((p) => p.type === "text");
  const text = textParts.map((p: any) => p.text).join("\n");

  if (text.includes("**Dragon**")) {
    const result = text.replace("**Dragon**", "");
    return { node: <ResearchResponse ragResponse={result} /> };
  }

  if (text.includes("**Time Period:**")) {
    return { node: <TemporalResponse text={text} /> };
  }

  return { node: <BasicResponse text={text} /> };
}

const SUGGESTED_PROMPTS = [
  "Tell me about Mike's projects",
  "Show me his GitHub work",
  "What is Krystal Ballz?",
  "How can I collaborate?",
];

const MEDIA_ITEMS = [
  {
    title: "AI Layoffs & Rent-A-Human",
    thumbnail: "/images/demo-thumbnail.png",
    url: "https://www.youtube.com/@MikeEss323",
  },
  {
    title: "Startup Funding News",
    thumbnail: "/images/fortune.png",
    url: "https://www.youtube.com/@MikeEss323",
  },
  {
    title: "Building AI Agents",
    thumbnail: "/images/clock_maker.png",
    url: "https://www.youtube.com/@MikeEss323",
  },
];

const PROJECTS = [
  {
    name: "Krystal Ballz",
    emoji: "🔮",
    description: "Startup Funding AI Agent",
    url: "https://github.com/msylvester/agent_overload",
  },
  {
    name: "Ora",
    emoji: "🌍",
    description: "AI Meditation Platform",
    url: "https://github.com/msylvester",
  },
  {
    name: "Claudette",
    emoji: "🌊",
    description: "Developer Workflow Tools",
    url: "https://github.com/msylvester",
  },
];

const GOALS = [
  "Building AI-native products",
  "Exploring human + AI collaboration",
  "Developing agent workflows",
];

const CONNECT_LINKS = [
  { label: "Collaboration", icon: "👤", href: "mailto:msylvester@example.com" },
  { label: "Investors", icon: "👤", href: "mailto:msylvester@example.com" },
  { label: "Podcasts & Talks", icon: "🎙️", href: "https://www.youtube.com/@MikeEss323" },
  { label: "Dev Communities", icon: "💬", href: "https://github.com/msylvester" },
];

const SOCIAL_LINKS = [
  { label: "Email Me", icon: "✉️", href: "mailto:msylvester@example.com" },
  { label: "GitHub", icon: "🐙", href: "https://github.com/msylvester" },
  { label: "YouTube", icon: "▶️", href: "https://www.youtube.com/@MikeEss323" },
  { label: "Twitter", icon: "🐦", href: "https://x.com/MikeS47896459" },
];

export default function MikeEssPortfolio() {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const { sendMessage, response, error, isLoading, reset } = useRetroChat();
  const { incrementProphecy, isLimitReached } = useProphecyLimit();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [mediaIndex, setMediaIndex] = useState(0);

  // Scroll to bottom of chat on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleClarificationSelect = async (data: { query: string; start: string; end: string }) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "user", content: data.query },
    ]);
    try {
      await sendMessage(data.query, {
        skipClarification: true,
        dateRange: { start: data.start, end: data.end },
      });
    } catch (err) {
      logger.error("Failed to send clarification:", err);
    }
  };

  useEffect(() => {
    if (response) {
      const { node } = renderResponse(response, handleClarificationSelect);
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: "system", content: node },
      ]);
      reset();
    }
  }, [response, reset]);

  useEffect(() => {
    if (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "system",
          content: <BasicResponse text={`Something went wrong: ${error.message}`} />,
        },
      ]);
      reset();
    }
  }, [error, reset]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (isLimitReached) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "system",
          content: <BasicResponse text="You've reached your daily limit of 10 questions. Come back tomorrow!" />,
        },
      ]);
      return;
    }

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "user", content: userText },
    ]);

    try {
      await sendMessage(userText);
      incrementProphecy();
    } catch (err) {
      logger.error("Failed to send message:", err);
    }
  };

  const handleSuggestion = async (prompt: string) => {
    if (!chatOpen) setChatOpen(true);
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "user", content: prompt },
    ]);
    try {
      await sendMessage(prompt);
      incrementProphecy();
    } catch (err) {
      logger.error("Failed to send message:", err);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      (e.currentTarget.form as HTMLFormElement | null)?.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true })
      );
    }
  };

  return (
    <div className="mike-portfolio min-h-screen bg-[#0a0e1a] text-white">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#1a1040]/80 via-[#0d1530]/60 to-[#0a0e1a] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,80,200,0.15),transparent_60%)] pointer-events-none" />

      <div className="relative z-10 max-w-[860px] mx-auto px-4 py-12 space-y-10">
        {/* ===== HERO ===== */}
        <section className="text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tight sm:text-4xl">Mike Ess</h1>
          <p className="text-lg text-gray-400 tracking-wide">
            AI Builder &bull; Systems Thinker &bull; Internet Projects
          </p>
          <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
            I build AI systems, experimental products, and media about the future of software.
          </p>
        </section>

        {/* ===== ASK MIKE'S AI ===== */}
        <section className="space-y-4">
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="mx-auto flex items-center gap-3 px-8 py-3.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300 shadow-[0_0_30px_rgba(100,140,255,0.08)]"
          >
            <span className="text-lg">💬</span>
            <span className="text-base font-semibold tracking-wide">Ask Mike&apos;s AI</span>
            <span className="text-gray-500 ml-1">{chatOpen ? "▼" : "▶"}</span>
          </button>

          {/* Suggested prompts */}
          <div className="flex flex-wrap justify-center gap-1.5 text-xs text-gray-500">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSuggestion(prompt)}
                className="hover:text-gray-300 transition-colors cursor-pointer"
              >
                &bull; {prompt}
              </button>
            ))}
          </div>

          {/* Chat panel */}
          {chatOpen && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-[0_4px_40px_rgba(0,0,0,0.4)]">
              {/* Messages area */}
              <div className="max-h-80 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-6">
                    Ask me anything about Mike&apos;s work, projects, or how to collaborate.
                  </p>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`${m.sender === "user" ? "text-right" : "text-left"}`}>
                    {m.sender === "user" ? (
                      <div className="inline-block bg-blue-600/30 border border-blue-500/20 rounded-xl px-4 py-2 text-sm text-blue-100 max-w-[80%]">
                        {m.content}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-200">{m.content}</div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    Thinking...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="border-t border-white/10 flex">
                <input
                  className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a question..."
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="px-5 text-sm font-medium text-blue-400 hover:text-blue-300 disabled:text-gray-600 transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </section>

        {/* ===== MEDIA I'VE CREATED ===== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Media I&apos;ve Created</h2>
          <div className="relative">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-1">
              {MEDIA_ITEMS.map((item, i) => (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-white/5"
                >
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-xs font-semibold text-white drop-shadow-lg leading-snug">
                      {item.title}
                    </p>
                  </div>
                </a>
              ))}
            </div>
            {/* Carousel dots */}
            <div className="flex justify-center gap-2 mt-3">
              {MEDIA_ITEMS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setMediaIndex(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === mediaIndex ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ===== GITHUB PROJECTS ===== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">GitHub Projects</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-1">
            {PROJECTS.map((project) => (
              <a
                key={project.name}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{project.emoji}</span>
                  <span className="font-semibold text-sm">{project.name}</span>
                </div>
                <p className="text-xs text-gray-500">&bull; {project.description}</p>
              </a>
            ))}
          </div>
        </section>

        {/* ===== WHAT I'M WORKING TOWARD ===== */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold">What I&apos;m Working Toward</h2>
          <ul className="space-y-2 text-sm text-gray-400">
            {GOALS.map((goal) => (
              <li key={goal} className="flex items-start gap-2">
                <span className="text-gray-600 mt-0.5">&bull;</span>
                {goal}
              </li>
            ))}
          </ul>
        </section>

        {/* ===== CONNECT & COLLABORATE ===== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Connect &amp; Collaborate</h2>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-2">
            {CONNECT_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10 transition-all duration-300"
              >
                <span>{link.icon}</span>
                <span className="text-xs font-medium">{link.label}</span>
              </a>
            ))}
          </div>
        </section>

        {/* ===== GET IN TOUCH ===== */}
        <section className="space-y-4 pb-8">
          <h2 className="text-xl font-bold">Get in Touch</h2>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-2">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10 transition-all duration-300"
              >
                <span>{link.icon}</span>
                <span className="text-xs font-medium">{link.label}</span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
