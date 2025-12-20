"use client";
import Image from "next/image";
import type React from "react";
import { type FormEvent, type KeyboardEvent, useEffect, useState } from "react";
import { useProphecyLimit } from "@/hooks/use-prophecy-limit";
import { useRetroChat } from "@/hooks/use-retro-chat";
import type { ChatMessage } from "@/lib/types";
import ProfileImage from "./components/ProfileImage";
import BasicResponse from "./components/responses/BasicResponse";
import ResearchResponse from "./components/responses/ResearchResponse";
import TemporalResponse from "./components/responses/TemporalResponse";
import ScrollablePane from "./components/ScrollablePane";
import SidePanel from "./components/SidePanel";

type Message = {
  id: number;
  sender: "system" | "user";
  content: string | React.ReactNode;
};

const initialMessages: Message[] = [
  {
    id: 1,
    sender: "system",
    content:
      "THE CRYSTAL BALL GLOWS... FIRST, SPEAK A TIME PERIOD. THEN, NAME YOUR QUARRY.",
  },
  {
    id: 2,
    sender: "system",
    content: '"WHO WAS FUNDED THIS PAST WEEK?"',
  },
  {
    id: 3,
    sender: "system",
    content: '"WAIT, WHAT, WHO IS SUNO?"',
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
    //substring the dragonian
    const result = text.replace("**Dragon**", "");

    return {
      node: <ResearchResponse ragResponse={result} />,
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
  const [type, setType] = useState("/fortune.png");
  const { sendMessage, response, error, isLoading, reset } = useRetroChat();
  const {
    prophecyCount,
    incrementProphecy,
    isLimitReached,
    remainingProphecies,
  } = useProphecyLimit();

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
          content: (
            <BasicResponse
              text={`THE CRYSTAL BALL GROWS DARK... ${error.message}`}
            />
          ),
        },
      ]);
      reset(); // Reset the hook state for next message
    }
  }, [error, reset]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Check rate limit before sending
    if (isLimitReached) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "system",
          content: (
            <BasicResponse text="THE FATES HAVE SPOKEN... YOU HAVE REACHED YOUR DAILY LIMIT OF 5 PROPHECIES. RETURN WHEN THE SUN RISES ANEW." />
          ),
        },
      ]);
      return;
    }

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
      // Increment prophecy count on successful send
      incrementProphecy();
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
    <div className="box-border flex min-h-screen justify-center bg-[radial-gradient(circle_at_top,#1c2840_0%,#05040a_70%)] p-4 font-[var(--font-press-start),'Press_Start_2P',system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif] text-[#f0e6d2]">
      <div className="w-full max-w-[1120px] border-4 border-[#2b2b2b] bg-[#141016] p-2 shadow-[0_0_0_4px_#4e4e4e,0_0_32px_rgba(0,0,0,0.7)] [image-rendering:pixelated]">
        {/* TOP BAR */}
        <div className="mb-2 flex items-center justify-between border-[#5c5c5c] border-[3px] bg-[linear-gradient(#403b3b,#262020)] px-2.5 py-1.5 [text-shadow:1px_1px_#000]">
          <div className="text-base tracking-[2px] sm:text-xs">
            KRYSTAL BALL Z
          </div>

          <div className="flex items-center gap-4 text-[10px] sm:gap-2.5 sm:text-[9px]">
            {/*<div className="flex items-center gap-1.5">
              <span className="text-[#f8f8f0]">ENERGY</span>
              <div className="w-[110px] h-2.5 border-2 border-[#272727] bg-[#1b2916] p-px box-border sm:w-20">
                <div className="w-[85%] h-full bg-[linear-gradient(#32ff5d,#0e8d2b)]" />
              </div>
            </div>
            */}
            <div className="flex items-center gap-1.5">
              <span className="mr-1 text-[#f8f8f0]">PROPHECIES</span>
              <span className="min-w-4 text-right">
                {remainingProphecies}/5
              </span>
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
        <div className="mb-2 grid grid-cols-1 gap-2 md:grid-cols-[1.1fr_2fr]">
          {/* LEFT: BAR MAIDEN OR CRYSTAL BALL */}
          {waiting ? (
            <div className="flex flex-col gap-1.5">
              <div className="relative flex h-80 items-center justify-center border-[#6b6b6b] border-[3px] bg-[#171217] bg-[radial-gradient(circle_at_top,#172141_0%,#050509_80%)] p-1.5 shadow-[inset_0_0_0_2px_#2b2b2b] max-md:h-[260px]">
                <div className="relative flex h-full w-full max-w-[280px] items-center justify-center">
                  <Image
                    alt="crystal ball"
                    className="animate-crystal-pulse object-contain [filter:drop-shadow(0_0_20px_rgba(93,172,255,0.6))_drop-shadow(0_0_40px_rgba(125,205,255,0.4))]"
                    fill
                    sizes="(max-width: 768px) 100vw, 280px"
                    src="/fortune.png"
                  />
                </div>
              </div>
            </div>
          ) : (
            //render a compoennt called Image
            <ProfileImage type={type} />
          )}
          {/* RIGHT: CHAT / LOG */}
          <div className="flex h-80 flex-col max-md:h-[260px]">
            <div className="relative h-full border-[#6b6b6b] border-[3px] bg-[#171217] bg-[#1a1516] p-1.5 shadow-[inset_0_0_0_2px_#2b2b2b]">
              <ScrollablePane>
                {messages.map((m) => (
                  <div className="mb-2" key={m.id}>
                    {m.sender === "user" ? (
                      <div className="text-[#174c7e] text-xs">
                        &gt; {m.content}
                      </div>
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
        <form
          className="flex flex-col gap-1 border-[#666666] border-[3px] bg-[#101014] px-2.5 py-1.5 pb-2"
          onSubmit={handleSubmit}
        >
          <div className="mb-0.5 text-[#e8dfb2] text-[10px] [text-shadow:1px_1px_#000]">
            <span>WHAT WISDOM DO YOU SEEK?</span>
          </div>
          <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-stretch">
            <div className="flex flex-1 items-center gap-1 border-2 border-[#474747] bg-[#050608] px-1.5 py-1">
              <span className="text-[#f5f5dc] text-[11px]">&gt;</span>
              <input
                className="flex-1 border-none bg-transparent font-[inherit] text-[#f5f5dc] text-[11px] uppercase outline-none placeholder:text-[#6e6e6e]"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="TYPE COMMAND..."
                value={input}
              />
            </div>
            <div className="flex gap-1.5 sm:justify-end">
              <button
                className="cursor-pointer border-2 border-[#555555] bg-[linear-gradient(#373737,#181818)] px-2.5 py-1 text-[#f5f5dc] text-[10px] uppercase shadow-[0_2px_0_#000] [text-shadow:1px_1px_#000] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                disabled={isLoading || isLimitReached}
                title={
                  isLimitReached ? "Daily prophecy limit reached" : undefined
                }
                type="submit"
              >
                ASK
              </button>
              <button
                className="cursor-pointer border-2 border-[#555555] bg-[linear-gradient(#373737,#181818)] px-2.5 py-1 text-[#f5f5dc] text-[10px] uppercase shadow-[0_2px_0_#000] [text-shadow:1px_1px_#000] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                disabled={isLoading}
                onClick={handleReset}
                // className="border-2 border-[#555555] bg-[linear-gradient(#373737,#181818)] text-[#f5f5dc] px-2.5 py-1 text-[10px] uppercase cursor-pointer [text-shadow:1px_1px_#000] shadow-[0_2px_0_#000] active:translate-y-px active:shadow-[0_1px_0_#000]"
                type="button"
              >
                RESET
              </button>
            </div>
          </div>
        </form>

        {/* Info Panel */}
        <div className="mt-2">
          <SidePanel />
        </div>
      </div>
    </div>
  );
}
