import { createSubscriber } from "@/lib/db/queries";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const trimmed = email.trim();
    if (!trimmed.includes("@") || !trimmed.split("@")[1]?.includes(".")) {
      return Response.json({ error: "Invalid email format" }, { status: 400 });
    }

    await createSubscriber({ email: trimmed });

    return Response.json(
      { message: "Successfully subscribed" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Subscribe error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
