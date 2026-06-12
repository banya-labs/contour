"use client";

import { UserButton } from "@clerk/nextjs";

export function UserMenu() {
  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: "size-10 rounded-full",
          userButtonPopoverCard: "shadow-[0_22px_80px_rgba(39,26,0,0.16)]",
        },
      }}
    />
  );
}
