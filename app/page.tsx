import { SignUpForm } from "@/components/sign-up-form"

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <SignUpForm />
      </div>
    </div>
  )
}
