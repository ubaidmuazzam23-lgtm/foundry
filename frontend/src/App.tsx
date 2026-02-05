import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Foundry
          </h1>
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SignedIn>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Welcome to Foundry</h2>
            <p className="text-gray-600">
              Get started by describing your startup idea using text or voice input.
            </p>
          </div>
        </SignedIn>
        <SignedOut>
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">Please sign in to continue</h2>
            <p className="text-gray-600">
              Sign in to start validating your startup ideas with AI.
            </p>
          </div>
        </SignedOut>
      </main>
    </div>
  )
}

export default App
