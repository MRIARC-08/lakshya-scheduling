import Navbar        from '@/components/Navbar'
import Hero          from '@/components/landing/Hero'
import SessionTypes  from '@/components/landing/SessionTypes'
import Link          from 'next/link'

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <SessionTypes />

        {/* Final CTA section */}
        <section className="py-24 bg-gradient-to-br from-navy-900
                            to-navy-800 text-center px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">
              Your UPSC dream is one session away
            </h2>
            <p className="text-gray-400 mb-8">
              Start with a free 30-minute counselling session.
              No commitment required.
            </p>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 bg-saffron-500
                         hover:bg-saffron-400 text-white font-semibold
                         px-10 py-4 rounded-full text-lg transition-all
                         shadow-lg shadow-saffron-500/30
                         hover:scale-105 active:scale-95"
            >
              Chat with Arjun
              <span>🎯</span>
            </Link>
            <p className="text-xs text-gray-600 mt-4">
              Jai Hind 🇮🇳
            </p>
          </div>
        </section>
      </main>
    </>
  )
}
