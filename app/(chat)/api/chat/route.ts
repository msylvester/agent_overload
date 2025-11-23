import { waitUntil } from "@vercel/functions";

import { runResearchWorkflow } from "@/workflows/research_workflow";

import type { VisibilityType } from "@/components/visibility-selector";
import type { ChatModel } from "@/lib/ai/models";
import {
  createJob,
  deleteChatById,
  getChatById,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateJobStatus,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";
import { ensureAuthenticated } from "@/lib/auth-helpers";

export const maxDuration = 60;

// Background workflow processor
async function processWorkflowInBackground(
  jobId: string,
  chatId: string,
  userMessageText: string
) {
  try {
    // Mark job as processing
    await updateJobStatus({ id: jobId, status: "processing" });

    console.log(`[Job ${jobId}] Starting workflow...`);
    const workflowOutput = await runResearchWorkflow(userMessageText);
    console.log(`[Job ${jobId}] Workflow completed`);

    // Create a data part for each company with mapped field names
    const companyParts = (workflowOutput.webResults?.companies || []).map(company => ({
      type: "data-researchResponse" as const,
      data: {
        company_name: company.company_name,
        description: company.description,
        industry: company.industry,
        founded: String(company.founded_year),
        headquarters: company.headquarters_location,
        companySize: company.company_size,
        website: company.website,
      }
    }));

    // Create assistant response message with research response data parts
    const assistantMessage: ChatMessage = {
      id: generateUUID(),
      role: "assistant",
      parts: companyParts.length > 0
        ? companyParts
        : [{ type: "text" as const, text: "No research results found." }],
    };

    // Save assistant message
    await saveMessages({
      messages: [
        {
          chatId,
          id: assistantMessage.id,
          role: "assistant",
          parts: assistantMessage.parts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    // Mark job as completed with the result
    await updateJobStatus({
      id: jobId,
      status: "completed",
      result: assistantMessage,
    });

    console.log(`[Job ${jobId}] Completed successfully`);
  } catch (error) {
    console.error(`[Job ${jobId}] Failed:`, error);
    await updateJobStatus({
      id: jobId,
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (error) {
    console.error("Schema validation failed:", error);
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel["id"];
      selectedVisibilityType: VisibilityType;
    } = requestBody;

    const userId = await ensureAuthenticated();

    const chat = await getChatById({ id });

    if (chat) {
      if (chat.userId !== userId) {
        return new ChatSDKError("forbidden:chat").toResponse();
      }
    } else {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId,
        title,
        visibility: selectedVisibilityType,
      });
    }

    // Save the user message
    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: "user",
          parts: message.parts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    // Extract text from message parts
    const userMessageText = message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join(" ");

    // Create a job for background processing
    const jobId = generateUUID();
    await createJob({
      id: jobId,
      chatId: id,
      messageId: message.id,
    });

    // Use waitUntil to process the workflow in the background
    // This allows the response to return immediately while processing continues
    waitUntil(processWorkflowInBackground(jobId, id, userMessageText));

    // Return immediately with the job ID for polling
    return Response.json({
      success: true,
      jobId,
      status: "pending",
    });
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    // Check for Vercel AI Gateway credit card error
    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new ChatSDKError("bad_request:activate_gateway").toResponse();
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new ChatSDKError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const userId = await ensureAuthenticated();

  const chat = await getChatById({ id });

  if (chat?.userId !== userId) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
