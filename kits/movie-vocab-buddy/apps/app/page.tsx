import Link from "next/link";

export default function HomePage() {
  return (
    <main className="max-w-xl mx-auto p-6 text-center">
      <h1 className="text-3xl font-semibold mb-2">🎬 Movie Vocab Buddy</h1>
      <p className="text-gray-600 mb-6">
        Turn what you watch into vocabulary you actually remember.
      </p>
      <div className="flex flex-col gap-3">
        <Link href="/upload" className="bg-black text-white rounded px-4 py-2">
          Paste a new transcript
        </Link>
        <Link href="/library" className="border rounded px-4 py-2">
          View my library
        </Link>
        <Link href="/weekly-quiz" className="border rounded px-4 py-2">
          Take this week's quiz
        </Link>
        <Link href="/review" className="border rounded px-4 py-2">
          Review missed words
        </Link>
      </div>
    </main>
  );
}
