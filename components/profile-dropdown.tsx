"use client";

import { User } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import { useRouter } from "next/navigation";

export function ProfileDropdown() {
  const router = useRouter();
  return (
    <UserButton>
      <UserButton.MenuItems>
          <UserButton.Action
            label="Profile"
            onClick={() => {
              router.push('/profile');
            }}
            labelIcon={<User />}
          />
        </UserButton.MenuItems>
    </UserButton>
  );
}
