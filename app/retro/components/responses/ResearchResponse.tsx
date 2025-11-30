import React from "react";

interface CompanyData {
  company_name: string;
  description: string;
  industry?: string;
  founded?: string;
  headquarters?: string;
  companySize?: string;
  website?: string;
}

interface ResearchResponseProps {
  companies: CompanyData[];
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#c9b88a] border border-[#8b7a52] px-2 py-0.5 text-[10px] rounded-sm">
      <span className="opacity-70">{label}:</span> {value}
    </div>
  );
}

export default function ResearchResponse({ companies }: ResearchResponseProps) {
  if (!companies || companies.length === 0) {
    return (
      <div className="border-2 border-[#7b6b4a] bg-[#e5d8b0] p-3 rounded-sm">
        <div className="text-xs text-[#2c1f18]">No companies found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="border-2 border-[#8b6914] bg-gradient-to-r from-[#d5c29a] to-[#c9b88a] p-2 rounded-sm">
        <div className="text-xs font-[var(--font-press-start)] uppercase text-[#2c1f18]">
          Research Results ({companies.length})
        </div>
      </div>

      {/* Company Cards */}
      {companies.map((company, index) => (
        <div
          key={index}
          className="border-2 border-[#7b6b4a] bg-[#e5d8b0] p-3 rounded-sm space-y-2"
        >
          {/* Company Name */}
          <div className="text-sm font-[var(--font-press-start)] border-b border-[#8b7a52] pb-1 text-[#2c1f18] uppercase">
            {company.company_name}
          </div>

          {/* Info Chips */}
          <div className="flex flex-wrap gap-1.5">
            {company.industry && (
              <Chip label="Industry" value={company.industry} />
            )}
            {company.founded && <Chip label="Founded" value={company.founded} />}
            {company.headquarters && (
              <Chip label="Location" value={company.headquarters} />
            )}
            {company.companySize && (
              <Chip label="Size" value={company.companySize} />
            )}
          </div>

          {/* Description */}
          <div className="text-xs leading-relaxed text-[#2c1f18]">
            {company.description}
          </div>

          {/* Website Link */}
          {company.website && (
            <div className="border border-[#8b6914] bg-[#c9b88a] px-2 py-1 text-xs text-center">
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="uppercase font-[var(--font-press-start)] text-[#2c1f18] hover:text-[#8b6914] text-[10px]"
              >
                [VISIT SITE]
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
