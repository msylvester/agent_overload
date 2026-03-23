"use client";

import React, { useState, useEffect } from "react";

const MODAL_CONTENT = [
  {
    title: "WELCOME, TRAVELER",
    body: "This is a look at the agents available to users. It's just to test the agentic workflow agents. For best results WIRE up KBZ w/ Claude Code OR OpenClaw.",
  },
  {
    title: "HOW TO USE",
    body: "Ask about recent funding or about individual companies.",
  },
  {
    title: "SEE IT IN ACTION",
    body: "Check out the YouTube videos to see agents in action!",
    link: {
      url: "https://youtu.be/1_O64RDEMwo?si=SAVgp0S0_NeairDW",
      label: "WATCH ON YOUTUBE",
    },
  },
];

const STORAGE_KEY = "retro-modals-seen";

export default function RetroModals() {
  const [currentModal, setCurrentModal] = useState<number | null>(null);

  useEffect(() => {
    const seen = sessionStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setCurrentModal(0);
    }
  }, []);

  const handleNext = () => {
    if (currentModal === null) return;
    const next = currentModal + 1;
    if (next >= MODAL_CONTENT.length) {
      sessionStorage.setItem(STORAGE_KEY, "true");
      setCurrentModal(null);
    } else {
      setCurrentModal(next);
    }
  };

  if (currentModal === null) return null;

  const modal = MODAL_CONTENT[currentModal];
  const isLast = currentModal === MODAL_CONTENT.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80" />

      {/* Modal */}
      <div className="relative border-4 border-[#5c5c5c] bg-[#141016] shadow-[0_0_0_4px_#4e4e4e,0_0_32px_rgba(0,0,0,0.7)] p-6 max-w-md w-[90%] [image-rendering:pixelated]">
        {/* Title bar */}
        <div className="border-[3px] border-[#5c5c5c] px-2.5 py-1.5 bg-[linear-gradient(#403b3b,#262020)] [text-shadow:1px_1px_#000] mb-4">
          <div className="text-xs tracking-[2px] text-[#f0e6d2]">
            {modal.title}
          </div>
        </div>

        {/* Body */}
        <div className="text-[11px] leading-relaxed tracking-wide text-[#f5edd5] font-medium mb-6 px-1">
          <p>{modal.body}</p>
          {modal.link && (
            <a
              href={modal.link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-[10px] text-[#5dacff] underline hover:text-[#7dc5ff] tracking-wider"
            >
              {modal.link.label}
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {MODAL_CONTENT.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 border border-[#555] ${
                  i === currentModal ? "bg-[#5dacff]" : "bg-[#2b2b2b]"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="border-2 border-[#555555] bg-[linear-gradient(#373737,#181818)] text-[#f5f5dc] px-3 py-1.5 text-[10px] uppercase cursor-pointer [text-shadow:1px_1px_#000] shadow-[0_2px_0_#000] active:translate-y-px active:shadow-[0_1px_0_#000] tracking-wider"
          >
            {isLast ? "BEGIN" : "NEXT"}
          </button>
        </div>
      </div>
    </div>
  );
}
