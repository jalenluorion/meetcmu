import { Navbar } from "@/components/navbar";
import { currentUser } from '@clerk/nextjs/server';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userId={user?.id} />
      <main className="flex-1 w-full max-w-5xl mx-auto p-5">
        {children}
      </main>
    </div>
  );
}
