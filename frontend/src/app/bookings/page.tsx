import { auth }               from '@/lib/auth'
import { getBookingsByUserId } from '@/lib/db'
import { redirect }           from 'next/navigation'
import Navbar                 from '@/components/Navbar'
import BookingCard            from '@/components/bookings/BookingCard'

export default async function BookingsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/bookings')
  }

  const bookings = await getBookingsByUserId(session.user.id)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-transparent pt-24 px-4 pb-12">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-[#1c1c1c]">
              Your Sessions
            </h1>
            <p className="text-gray-500 mt-1">
              Welcome back, {session.user.name?.split(' ')[0]}!
              Here are your Lakshya IAS bookings.
            </p>
          </div>

          {/* Bookings list */}
          {bookings.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl
                            border border-[#ebebeb] shadow-sm">
              <div className="mx-auto w-20 h-20 bg-[#fafafa] border border-[#ebebeb] rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-[#1c1c1c] mb-2">
                No sessions yet
              </h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
                Your journey starts here. Book your first mentorship session with Arjun!
              </p>
              <a
                href="/chat?new=true"
                className="inline-flex items-center gap-2 bg-[#1c1c1c]
                           hover:bg-[#2a2a2a] text-white font-semibold
                           px-8 py-3.5 rounded-full transition-all duration-300
                           shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                Book a Session
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking, i) => (
                <BookingCard
                  key={booking.booking_ref}
                  booking={booking}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
