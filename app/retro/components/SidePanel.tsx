"use client";

import type React from "react";

interface SidePanelSectionProps {
  title: string;
  children: React.ReactNode;
}

function SidePanelSection({ title, children }: SidePanelSectionProps) {
  return (
    <div className="border border-[#3a3a3a] bg-[#0d0d10]">
      <div className="border-[#3a3a3a] border-b bg-[linear-gradient(#252525,#1a1a1a)] px-3 py-2">
        <h2 className="text-[#8a8a8a] text-[10px] uppercase tracking-wider">
          {title}
        </h2>
      </div>
      <div className="px-3 py-2.5">{children}</div>
    </div>
  );
}

interface LinkItemProps {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}

function LinkItem({ href, children, external = true }: LinkItemProps) {
  return (
    <a
      className="block py-0.5 text-[#7a9ec2] text-[10px] transition-colors duration-150 hover:text-[#a8c8e8]"
      href={href}
      rel={external ? "noopener noreferrer" : undefined}
      target={external ? "_blank" : undefined}
    >
      {children}
    </a>
  );
}

export default function SidePanel() {
  return (
    <div className="grid w-full grid-cols-1 gap-2 font-[var(--font-geist-mono),ui-monospace,monospace] text-[#c0c0c0] md:grid-cols-2 lg:grid-cols-4">
      {/* Project Links */}
      <SidePanelSection title="Project Links">
        <div className="flex flex-col gap-1">
          <LinkItem href="https://github.com/msylvester/agent_overload">
            GitHub Repository
          </LinkItem>
          <LinkItem href="https://github.com/msylvester/agent_overload/issues">
            Report Issues
          </LinkItem>
          <LinkItem href="https://github.com/msylvester/agent_overload#readme">
            Documentation
          </LinkItem>
        </div>
      </SidePanelSection>

      {/* How To Use */}
      <SidePanelSection title="How To Use">
        <div className="space-y-1.5 text-[#909090] text-[9px] leading-relaxed">
          <p>Type your question in the input field below.</p>
          <p>The oracle will divine your answer.</p>
          <p>5 prophecies per day are granted.</p>
        </div>
      </SidePanelSection>

      {/* About the Creator */}
      <SidePanelSection title="About the Creator">
        <div className="flex flex-col gap-1">
          <LinkItem href="https://x.com/MikeS47896459">X / Twitter</LinkItem>
          <LinkItem href="https://www.linkedin.com/in/msylvest55/">
            LinkedIn
          </LinkItem>
          <LinkItem href="https://github.com/msylvester">GitHub</LinkItem>
          <LinkItem href="https://www.twitch.tv/krystal_mess323">
            Twitch
          </LinkItem>
          <LinkItem href="https://bsky.app/profile/krystalmess.bsky.social">
            Bluesky
          </LinkItem>
        </div>
      </SidePanelSection>

      {/* App Status */}
      <SidePanelSection title="App Status">
        <div className="space-y-1 text-[#707070] text-[9px]">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="text-[#909090]">0.1.0</span>
          </div>
          <div className="flex justify-between">
            <span>Status</span>
            <span className="text-[#6b8f6b]">Experimental</span>
          </div>
        </div>
      </SidePanelSection>
    </div>
  );
}
