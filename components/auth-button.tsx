import { Button } from "./ui/button";
import { ProfileDropdown } from "./profile-dropdown";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
} from '@clerk/nextjs'

export async function AuthButton() {
  return (
    <>
      <SignedIn>
        <ProfileDropdown />
      </SignedIn>
      <SignedOut> 
        <div className="flex gap-2">
          <SignInButton mode="modal">
            <Button size="sm" variant={"outline"}>
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button size="sm" variant={"default"}>
              Sign up
            </Button>
          </SignUpButton>
        </div>
      </SignedOut>
    </>
  )
}
