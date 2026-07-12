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
        <section className="py-24 bg-transparent border-t border-[#ebebeb]
                            text-center px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-[#1c1c1c] tracking-tight mb-4">
              Your UPSC dream is one session away
            </h2>
            <p className="text-[#1c1c1c]/70 mb-8 font-medium">
              Start with a free 30-minute counselling session.
              No commitment required.
            </p>
            <Link
              href="/chat?new=true"
              className="inline-flex items-center gap-2 bg-[#1c1c1c]
                         hover:bg-[#2a2a2a] text-white font-semibold
                         px-10 py-4 rounded-full text-lg transition-all
                         shadow-[0_4px_16px_rgba(0,0,0,0.15)]
                         hover:scale-[1.02] active:scale-[0.98]"
            >
              Chat with Arjun
            </Link>
            <p className="text-xs text-[#1c1c1c]/40 mt-6 font-medium tracking-wide uppercase">
              Jai Hind
            </p>
          </div>
        </section>
      </main>
    </>
  )
}
