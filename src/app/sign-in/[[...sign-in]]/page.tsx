import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-stone-900">MDCAT Prep</h1>
        <p className="mt-1 text-sm text-stone-500">Sign in to start practicing</p>
      </div>
      <SignIn
        appearance={{
          elements: {
            footerAction: { display: "flex" },
          },
        }}
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
