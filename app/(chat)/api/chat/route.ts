import { geolocation } from "@vercel/functions";
import { auth, type UserType } from "@/app/(auth)/auth";
import type { VisibilityType } from "@/components/visibility-selector";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import type { ChatModel } from "@/lib/ai/models";
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatLastContextById,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";
import inference from "@/lib/inference";
import { uiModelToInferenceModel } from "@/lib/ai/model-registry";

export const maxDuration = 60;

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
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

    const session = await auth();
    const userId = session?.user?.id || "anonymous";

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

    const messagesFromDb = await getMessagesByChatId({ id });

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

    // Map UI model ID to inference model ID
    const inferenceModelId = uiModelToInferenceModel(selectedChatModel);
    console.log(`Selected UI model: ${selectedChatModel}, using inference model: ${inferenceModelId}`);

    // Call local inference endpoint with the mapped model
    const generatedText = await inference(userMessageText, { modelId: inferenceModelId });

    // Create assistant response message
    const assistantMessage: ChatMessage = {
      id: generateUUID(),
      role: "assistant",
      parts: [{ type: "text", text: generatedText }],
    };

    // Save assistant message
    await saveMessages({
      messages: [
        {
          chatId: id,
          id: assistantMessage.id,
          role: "assistant",
          parts: assistantMessage.parts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    // Return the assistant's response
    return Response.json({
      success: true,
      message: assistantMessage,
      response: generatedText,
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

  const session = await auth();
  const userId = session?.user?.id || "anonymous";

  const chat = await getChatById({ id });

  if (chat?.userId !== userId) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
