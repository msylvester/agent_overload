import { getMongoClient } from "@/workflows/mongoPool";
import { ChatSDKError } from "@/lib/errors";
import { ensureAuthenticated } from "@/lib/auth-helpers";
import { logger } from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    await ensureAuthenticated();

    const { name } = await params;

    if (!name) {
      return new ChatSDKError("bad_request:api").toResponse();
    }

    const companyName = decodeURIComponent(name);
    const client = await getMongoClient();
    const db = client.db("companies");
    const collection = db.collection("funded_companies");

    const company = await collection.findOne({ company_name: companyName });

    if (!company) {
      return Response.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    return Response.json({
      company_name: company.company_name,
      posted_date: company.posted_date,
      source: company.source,
      founded_year: company.founded_year,
      description: company.description?.replace(/\s*\*\*Funding Details\*\*[\s\S]*$/, '').trim(),
      sector: company.sector,
      funding_amount: company.funding_amount,
      total_funding: company.total_funding,
      investors: company.investors,
    });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    logger.error("Error fetching company:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
