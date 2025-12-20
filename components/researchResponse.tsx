import type React from "react";

type ResearchResponseProps = {
  company_name: string;
  description: string;

  industry?: string;
  founded?: string;
  headquarters?: string;
  companySize?: string;
  website?: string;
};

const ResearchResponse: React.FC<ResearchResponseProps> = ({
  company_name,
  description,
  industry = "Computer Software",
  founded = "2016.0",
  headquarters = "New York, NY, USA",
  companySize = "1,000",
  website = "https://www.vastdata.com",
}) => {
  return (
    <div style={{ padding: "20px", fontFamily: "Inter, sans-serif" }}>
      <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>{company_name}</h2>

      <div style={{ display: "flex", gap: "60px" }}>
        <div style={{ flex: 1 }}>
          <p>
            <strong>Industry:</strong> {industry}
          </p>
          <p>
            <strong>Founded:</strong> {founded}
          </p>
          <p>
            <strong>Headquarters:</strong> {headquarters}
          </p>
        </div>

        <div style={{ flex: 1 }}>
          <p>
            <strong>Company Size:</strong> {companySize}
          </p>
          <p>
            <strong>Website:</strong>{" "}
            <a href={website} rel="noopener noreferrer" target="_blank">
              {website}
            </a>
          </p>
        </div>
      </div>

      <div style={{ marginTop: "30px" }}>
        <p style={{ fontSize: "18px", fontWeight: "bold" }}>Description:</p>
        <p style={{ lineHeight: "1.5" }}>{description}</p>
      </div>
    </div>
  );
};

export default ResearchResponse;
