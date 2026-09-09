import { getServerSession } from "next-auth/next"
import ReviewList from "./components/ReviewList"

export default async function Home() {
  const session = await getServerSession()
  
  if (session) {
    return (
      <main className="min-h-screen w-full bg-slate-50">
        <ReviewList />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 text-black">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4 text-black">Google Reviews AI Manager</h1>
        <p className="mb-6 text-gray-600">Please sign in with your Google account to manage your reviews.</p>
        <a href="/api/auth/signin" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors inline-block">Sign in with Google</a>
      </div>
    </main>
  )
}
