import { NextRequest, NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";

import {
  getChatView,
  hasAcceptedMentorshipBetween,
  persistChatMessage,
  resolveChatContactByKey,
  resolveChatProfile,
} from "@/lib/chat-service";
import type { StoredChatAttachment } from "@/lib/portal-store";

function wantsJson(request: NextRequest) {
  const accept = request.headers.get("accept") || "";
  const contentType = request.headers.get("content-type") || "";

  return accept.includes("application/json") || contentType.includes("application/json");
}

export async function GET(request: NextRequest) {
  const withParam = request.nextUrl.searchParams.get("with") || undefined;
  const view = await getChatView(withParam);

  if (!view.profile) {
    return NextResponse.json(view, { status: 401 });
  }

  return NextResponse.json(view);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    if (wantsJson(request)) {
      return NextResponse.json({ error: "Please sign in to use chat." }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const sender = await resolveChatProfile();

  if (!sender) {
    if (wantsJson(request)) {
      return NextResponse.json({ error: "Unable to resolve the signed-in chat profile." }, { status: 400 });
    }

    return NextResponse.redirect(new URL("/chat", request.url));
  }

  let receiverId = "";
  let content = "";
  let attachments: StoredChatAttachment[] = [];

  if (request.headers.get("content-type")?.includes("application/json")) {
    const body = (await request.json()) as {
      receiverId?: string;
      content?: string;
      attachments?: StoredChatAttachment[];
    };
    receiverId = body.receiverId?.trim() || "";
    content = body.content?.trim() || "";
    attachments = body.attachments ?? [];
  } else {
    const formData = await request.formData();
    receiverId = formData.get("receiverId")?.toString().trim() || "";
    content = formData.get("content")?.toString().trim() || "";
    const driveUrl = formData.get("driveUrl")?.toString().trim() || "";
    const uploadedFile = formData.get("attachment");

    if (driveUrl) {
      attachments.push({
        id: `drive-${crypto.randomUUID()}`,
        name: driveUrl.replace(/^https?:\/\//, "").slice(0, 80),
        mimeType: "text/uri-list",
        size: driveUrl.length,
        source: "drive",
        url: driveUrl,
      });
    }

    if (uploadedFile instanceof File && uploadedFile.size > 0) {
      if (uploadedFile.size > 4_500_000) {
        return NextResponse.json(
          { error: "Please upload files smaller than 4.5 MB." },
          { status: 400 },
        );
      }

      let uploadUrl = "";
      const mimeType = uploadedFile.type || "application/octet-stream";

      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const blob = await put(
          `chat-uploads/${sender.rollNumber}-${receiverId}-${Date.now()}-${uploadedFile.name}`,
          uploadedFile,
          {
            access: "public",
          },
        );

        uploadUrl = blob.url;
      } else {
        const bytes = Buffer.from(await uploadedFile.arrayBuffer());
        uploadUrl = `data:${mimeType};base64,${bytes.toString("base64")}`;
      }

      attachments.push({
        id: `file-${crypto.randomUUID()}`,
        name: uploadedFile.name,
        mimeType,
        size: uploadedFile.size,
        source: "upload",
        url: uploadUrl,
      });
    }
  }

  if (!receiverId || (!content && attachments.length === 0)) {
    if (wantsJson(request)) {
      return NextResponse.json(
        { error: "Receiver and either a message, file, or Drive link are required." },
        { status: 400 },
      );
    }

    return NextResponse.redirect(new URL("/chat", request.url));
  }

  const receiver = await resolveChatContactByKey(receiverId);

  if (!receiver || receiver.rollNumber === sender.rollNumber) {
    if (wantsJson(request)) {
      return NextResponse.json({ error: "Unable to resolve the selected chat contact." }, { status: 400 });
    }

    return NextResponse.redirect(new URL("/chat", request.url));
  }

  const canChat = await hasAcceptedMentorshipBetween(sender, receiver);

  if (!canChat) {
    if (wantsJson(request)) {
      return NextResponse.json(
        { error: "Chat is available only after the mentorship request is accepted." },
        { status: 403 },
      );
    }

    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const stored = await persistChatMessage(sender, receiver, content, attachments);

  if (!stored) {
    if (wantsJson(request)) {
      return NextResponse.json(
        {
          error:
            attachments.length > 0
              ? "File sending is temporarily unavailable for this chat. Please try again in the accepted chat after both profiles finish syncing."
              : "Message could not be stored right now.",
        },
        { status: 500 },
      );
    }

    return NextResponse.redirect(new URL(`/chat?with=${receiver.rollNumber}`, request.url));
  }

  const view = await getChatView(receiver.rollNumber);

  if (wantsJson(request)) {
    return NextResponse.json(view);
  }

  return NextResponse.redirect(new URL(`/chat?with=${receiver.rollNumber}`, request.url));
}
