import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">MDCAT Pro</h1>
        <p className="mt-1 text-sm text-gray-500">Create your account</p>
      </div>
      <SignUp
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
