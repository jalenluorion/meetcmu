import { updateSession } from "@/lib/supabase/middleware";
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isAuthProtected = createRouteMatcher([
  '/new(.*)',
  '/profile(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  
  // Protect authenticated routes
  if (isAuthProtected(req) && !userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }
  
  // Run Supabase middleware after Clerk
  return await updateSession(req);
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
