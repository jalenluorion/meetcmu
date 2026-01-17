import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SignedIn } from '@clerk/nextjs';
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { hasEnvVars } from "@/lib/utils";
import { EnvVarWarning } from "@/components/env-var-warning";

interface NavbarProps {
  userId?: string;
}

export function Navbar({ userId }: NavbarProps) {
  return (
    <nav className="w-full border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-5xl mx-auto flex justify-between items-center p-3 px-5">
        <Link href="/" className="font-bold text-xl">
          MeetCMU
        </Link>
        <div className="flex gap-3 items-center">
          <SignedIn>
            <Button asChild size="sm">
              <Link href="/new">
                <Plus className="h-4 w-4 mr-1" />
                New Event
              </Link>
            </Button>
          </SignedIn>
          <div className="flex gap-3 items-center">
            <NotificationsDropdown userId={userId} />
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
}
