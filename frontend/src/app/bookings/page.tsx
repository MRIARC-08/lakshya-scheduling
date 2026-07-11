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
      <main className="min-h-screen bg-gray-50 pt-24 px-4 pb-12">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-navy-900">
              Your Sessions
            </h1>
            <p className="text-gray-500 mt-1">
              Welcome back, {session.user.name?.split(' ')[0]}!
              Here are your Lakshya IAS bookings.
            </p>
          </div>

          {/* Bookings list */}
          {bookings.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl
                            border border-gray-100 shadow-sm">
              <p className="text-5xl mb-4">📅</p>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No sessions yet
              </h3>
              <p className="text-gray-500 mb-6">
                Book your first session with Arjun!
              </p>
              <a
                href="/chat"
                className="inline-flex items-center gap-2 bg-saffron-500
                           hover:bg-saffron-600 text-white font-medium
                           px-6 py-3 rounded-full transition-colors"
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
