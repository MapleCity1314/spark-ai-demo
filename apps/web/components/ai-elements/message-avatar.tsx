"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export type MessageAvatarProps = {
  from: "user" | "assistant";
  className?: string;
};

export function MessageAvatar({ from, className }: MessageAvatarProps) {
  return (
    <div className={cn("flex-shrink-0", className)}>
      <Avatar className="size-8 border-2 border-border">
        {from === "user" ? (
          <>
            <AvatarImage src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20pixel%20art%20style%20portrait&image_size=square" alt="User" />
            <AvatarFallback className="bg-blue-500 text-white">U</AvatarFallback>
          </>
        ) : (
          <>
            <AvatarImage src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=robot%20avatar%20pixel%20art%20style%20portrait&image_size=square" alt="Assistant" />
            <AvatarFallback className="bg-green-500 text-white">AI</AvatarFallback>
          </>
        )}
      </Avatar>
    </div>
  );
}
