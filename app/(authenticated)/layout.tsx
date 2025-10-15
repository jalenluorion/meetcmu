import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  
  if (!data?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-5xl mx-auto flex justify-between items-center p-3 px-5">
          <Link href="/" className="font-bold text-xl">
            MeetCMU
          </Link>
          <div className="flex gap-3 items-center">
            <Button asChild size="sm">
              <Link href="/new">
                <Plus className="h-4 w-4 mr-1" />
                New Event
              </Link>
            </Button>
            <AuthButton />
            <ThemeSwitcher />
          </div>
        </div>
      </nav>
      <main className="flex-1 w-full max-w-5xl mx-auto p-5">
        {children}
      </main>
    </div>
  );
}
