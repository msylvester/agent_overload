import { waitUntil } from "@vercel/functions";

import { runOrchestratorWorkflow, type OrchFlowOutput } from "@/workflows/orchestrator_workflow";


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
import { logger } from "@/lib/logger";

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

    logger.log(`[Job ${jobId}] Starting workflow...`);

    const orchWorkflowOutput: OrchFlowOutput = await runOrchestratorWorkflow(userMessageText);
    const { classifyResponse } = orchWorkflowOutput;

    let assistantMessage: ChatMessage;

    switch (classifyResponse) {
      case 'time': {
        // Extract temporal data
        const temporalResponse = orchWorkflowOutput.temporalResponse;

        let formattedText = "";

        if (temporalResponse?.time) {
          // Handle both ISO strings (from fromScratch.ts) and Unix timestamps (from legacy workflow)
          let startDate: string = '';
          let endDate: string = '';

          if (typeof temporalResponse.time.start === 'string') {
            // ISO string format (YYYY-MM-DD) from fromScratch.ts
            startDate = new Date(temporalResponse.time.start).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            endDate = new Date(temporalResponse.time.end).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          } else if (typeof temporalResponse.time.start === 'number' && typeof temporalResponse.time.end === 'number') {
            // Unix timestamp (seconds) from legacy workflow
            startDate = new Date(temporalResponse.time.start * 1000).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            endDate = new Date(temporalResponse.time.end * 1000).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          }

          if (startDate && endDate) {
            formattedText += `**Time Period:** ${startDate} to ${endDate}\n\n`;
          }
        }

        if (temporalResponse?.results?.companies && temporalResponse.results.companies.length > 0) {
          formattedText += `**Companies Found:**\n`;
          temporalResponse.results.companies.forEach(company => {
            formattedText += `• ${company}\n`;
          });
          formattedText += `\n`;
        }

        if (temporalResponse?.results?.inference) {
          formattedText += `**Analysis:**\n${temporalResponse.results.inference}`;
        }

        if (!formattedText) {
          formattedText = "No temporal results found.";
        }

        assistantMessage = {
          id: generateUUID(),
          role: "assistant",
          parts: [{ type: "text" as const, text: formattedText }],
        };
        break;
      }

      case 'basic': {
        // Extract basic response
        const basicText = orchWorkflowOutput.basicResponse || "No response available.";

        assistantMessage = {
          id: generateUUID(),
          role: "assistant",
          parts: [{ type: "text" as const, text: basicText }],
        };
        break;
      }

      case 'research': {
        // Extract RAG results text
        const ragText = orchWorkflowOutput.ragResults || "No research results found.";

        assistantMessage = {
          id: generateUUID(),
          role: "assistant",
          parts: [{ type: "text" as const, text: ragText }],
        };
        break;
      }

      default: {
        logger.error(`[Job ${jobId}] Unexpected classification: ${classifyResponse}`);

        assistantMessage = {
          id: generateUUID(),
          role: "assistant",
          parts: [{ type: "text" as const, text: "Sorry, I couldn't process your request." }],
        };

        await updateJobStatus({
          id: jobId,
          status: "failed",
          error: `Unexpected classification: ${classifyResponse}`,
        });
        return;
      }
    }

    logger.log(`[Job ${jobId}] Workflow completed`);

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

    logger.log(`[Job ${jobId}] Completed successfully`);
  } catch (error) {
    logger.error(`[Job ${jobId}] Failed:`, error);
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
    logger.error("Schema validation failed:", error);
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

    logger.error("Unhandled error in chat API:", error, { vercelId });
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
