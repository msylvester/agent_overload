"use client";
import React, { useState, KeyboardEvent, FormEvent, useEffect } from "react";
import Image from "next/image";
import ProfileImage from './components/ProfileImage';
import ScrollablePane from "./components/ScrollablePane";
import { useRetroChat } from "@/hooks/use-retro-chat";
import type { ChatMessage } from "@/lib/types";
import BasicResponse from "./components/responses/BasicResponse";
import ResearchResponse from "./components/responses/ResearchResponse";
import TemporalResponse from "./components/responses/TemporalResponse";

type Message = {
  id: number;
  sender: "system" | "user";
  content: string | React.ReactNode;
};

const initialMessages: Message[] = [
  {
    id: 1,
    sender: "system",
    content: "THE CRYSTAL BALL GLOWS, HOW CAN I ASSIST YOU, TRAVELER?",
  },
];

// Render workflow response as React components
function renderResponse(message: ChatMessage): {
  node: React.ReactNode;
  newType: string;
} {
  const textParts = message.parts.filter((p) => p.type === "text");
  const text = textParts.map((p: any) => p.text).join("\n");

  // Research response
  if (text.includes("**Dragon**")) {
    return {
      node: <ResearchResponse ragResponse={text} />,
      newType: "/dragon.png",
    };
  }

  // Temporal response
  if (text.includes("**Time Period:**")) {
    return {
      node: <TemporalResponse text={text} />,
      newType: "/prince.png",
    };
  }

  // Basic response
  return {
    node: <BasicResponse text={text} />,
    newType: "/dwarf.png",
  };
}


export default function KrystalBallZ() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [type, setType ] = useState("/fortune.png");
  const { sendMessage, response, error, isLoading, reset } = useRetroChat();

  // Handle responses from the API
useEffect(() => {
  if (response) {
    const { node, newType } = renderResponse(response);
    setType(newType);

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "system",
        content: node,
      },
    ]);

    reset();
  }
}, [response, reset]);

  // Handle errors
  useEffect(() => {
    if (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "system",
          content: <BasicResponse text={`THE CRYSTAL BALL GROWS DARK... ${error.message}`} />,
        },
      ]);
      reset(); // Reset the hook state for next message
    }
  }, [error, reset]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    const userText = input.trim();
    setInput("");

    // Add user message to UI immediately
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "user",
        content: userText,
      },
    ]);

    // Send to API
    try {
      await sendMessage(userText);
    } catch (err) {
      // Error will be handled by the useEffect above
      console.error("Failed to send message:", err);
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

  const handleReset = () => {
    setMessages(initialMessages);
    setInput("");
    reset();
  };

  // Show crystal ball when loading
  const waiting = isLoading;

  return (
    <div className="min-h-screen flex justify-center bg-[radial-gradient(circle_at_top,#1c2840_0%,#05040a_70%)] text-[#f0e6d2] p-4 box-border font-[var(--font-press-start),'Press_Start_2P',system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif]">
      <div className="[image-rendering:pixelated] max-w-[1120px] w-full border-4 border-[#2b2b2b] bg-[#141016] shadow-[0_0_0_4px_#4e4e4e,0_0_32px_rgba(0,0,0,0.7)] p-2">
        {/* TOP BAR */}
        <div className="flex items-center justify-between border-[3px] border-[#5c5c5c] px-2.5 py-1.5 bg-[linear-gradient(#403b3b,#262020)] [text-shadow:1px_1px_#000] mb-2">
          <div className="text-base tracking-[2px] sm:text-xs">KRYSTAL BALL Z</div>
        
          <div className="flex gap-4 items-center text-[10px] sm:gap-2.5 sm:text-[9px]">
          {/*<div className="flex items-center gap-1.5">
              <span className="text-[#f8f8f0]">ENERGY</span>
              <div className="w-[110px] h-2.5 border-2 border-[#272727] bg-[#1b2916] p-px box-border sm:w-20">
                <div className="w-[85%] h-full bg-[linear-gradient(#32ff5d,#0e8d2b)]" />
              </div>
            </div>
            */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#f8f8f0] mr-1">PROPHECIES</span>
              <span className="min-w-4 text-right">{messages.filter(m => m.sender === "system").length}</span>
            </div>
            {/*
            <div className="flex items-center gap-1.5">
              <span className="text-[#f8f8f0] mr-1">HP</span>
              <span className="min-w-4 text-right">81</span>
            </div>
            */}
          </div>
        </div>

        {/* MAIN AREA */}
        <div className="grid grid-cols-1 md:grid-cols-[1.1fr_2fr] gap-2 mb-2">
          {/* LEFT: BAR MAIDEN OR CRYSTAL BALL */}
          {waiting ? (
            <div className="flex flex-col gap-1.5">
              <div className="border-[3px] border-[#6b6b6b] bg-[#171217] shadow-[inset_0_0_0_2px_#2b2b2b] relative p-1.5 h-80 flex items-center justify-center bg-[radial-gradient(circle_at_top,#172141_0%,#050509_80%)] max-md:h-[260px]">
                <div className="relative w-full max-w-[280px] h-full flex items-center justify-center">
                  <Image
                    src="/fortune.png"
                    alt="crystal ball"
                    fill
                    sizes="(max-width: 768px) 100vw, 280px"
                    className="object-contain [filter:drop-shadow(0_0_20px_rgba(93,172,255,0.6))_drop-shadow(0_0_40px_rgba(125,205,255,0.4))] animate-crystal-pulse"
                  />
                </div>
              </div>
            </div>
          ) : 

//render a compoennt called Image
          (<ProfileImage type={type} />)}
         {/* RIGHT: CHAT / LOG */}
          <div className="flex flex-col h-80 max-md:h-[260px]">
            <div className="border-[3px] border-[#6b6b6b] bg-[#171217] shadow-[inset_0_0_0_2px_#2b2b2b] relative h-full p-1.5 bg-[#1a1516]">
              <ScrollablePane>
                {messages.map((m) => (
                  <div key={m.id} className="mb-2">
                    {m.sender === "user" ? (
                      <div className="text-xs text-[#174c7e]">&gt; {m.content}</div>
                    ) : (
                      <div>{m.content}</div>
                    )}
                  </div>
                ))}
              </ScrollablePane>
            </div>
          </div>
        </div>

        {/* INPUT BAR */}
        <form className="border-[3px] border-[#666666] bg-[#101014] px-2.5 py-1.5 pb-2 flex flex-col gap-1" onSubmit={handleSubmit}>
          <div className="text-[10px] text-[#e8dfb2] [text-shadow:1px_1px_#000] mb-0.5">
            <span>WHAT WISDOM DO YOU SEEK?</span>
          </div>
          <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-stretch">
            <div className="flex-1 flex items-center gap-1 border-2 border-[#474747] px-1.5 py-1 bg-[#050608]">
              <span className="text-[11px] text-[#f5f5dc]">&gt;</span>
              <input
                className="flex-1 bg-transparent border-none outline-none text-[#f5f5dc] text-[11px] font-[inherit] uppercase placeholder:text-[#6e6e6e]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="TYPE COMMAND..."
              />
            </div>
            <div className="flex gap-1.5 sm:justify-end">
              <button
                type="submit"
                disabled={isLoading}
              className="
    border-2 border-[#555555]
    bg-[linear-gradient(#373737,#181818)]
    text-[#f5f5dc]
    px-2.5 py-1 text-[10px] uppercase
    [text-shadow:1px_1px_#000]
    shadow-[0_2px_0_#000]

    cursor-pointer
    disabled:cursor-not-allowed
    disabled:opacity-50
    disabled:shadow-none
  "
              >
                ASK
              </button>
              <button
                type="button"
                disabled={isLoading}
             className="
    border-2 border-[#555555]
    bg-[linear-gradient(#373737,#181818)]
    text-[#f5f5dc]
    px-2.5 py-1 text-[10px] uppercase
    [text-shadow:1px_1px_#000]
    shadow-[0_2px_0_#000]

    cursor-pointer
    disabled:cursor-not-allowed
    disabled:opacity-50
    disabled:shadow-none
  "
           
                // className="border-2 border-[#555555] bg-[linear-gradient(#373737,#181818)] text-[#f5f5dc] px-2.5 py-1 text-[10px] uppercase cursor-pointer [text-shadow:1px_1px_#000] shadow-[0_2px_0_#000] active:translate-y-px active:shadow-[0_1px_0_#000]"
                onClick={handleReset}
              >
                RESET
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
