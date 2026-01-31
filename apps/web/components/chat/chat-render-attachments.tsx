"use client";

import type { FileUIPart, SourceDocumentUIPart, UIMessage } from "ai";
import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  Attachments,
} from "../ai-elements/attachments";

interface MessageAttachmentsProps {
  message: UIMessage;
}

type AttachmentPart = FileUIPart | SourceDocumentUIPart;

type MessagePart = UIMessage["parts"][number];

const isAttachmentPart = (part: MessagePart): part is AttachmentPart =>
  part.type === "file" || part.type === "source-document";

export function MessageAttachments({ message }: MessageAttachmentsProps) {
  const attachments = message.parts.filter(isAttachmentPart);

  if (attachments.length === 0) {
    return null;
  }

  return (
    <Attachments className="mb-2" variant="grid">
      {attachments.map((part, index) => (
        <Attachment
          data={{
            ...part,
            id:
              "id" in part && typeof part.id === "string"
                ? part.id
                : `${message.id}-attachment-${index}`,
          }}
          key={`attachment-${message.id}-${index}`}
        >
          <AttachmentPreview />
          <AttachmentInfo />
        </Attachment>
      ))}
    </Attachments>
  );
}
