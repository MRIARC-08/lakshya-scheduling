import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { linkGuestBookingsToUser } from './db'

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    // Add userId to JWT token
    async jwt({ token, user }) {
      if (user) {
        token.userId = token.sub
      }
      return token
    },

    // Expose userId in session
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
      }
      return session
    },

    // On sign in — map guest bookings to this user
    async signIn({ user }) {
      if (user.email && user.id) {
        try {
          const linked = await linkGuestBookingsToUser(
            user.email,
            user.id
          )
          if (linked > 0) {
            console.log(
              `✅ Linked ${linked} guest booking(s) for ${user.email}`
            )
          }
        } catch (err) {
          // Don't block sign in if mapping fails
          console.error('Guest mapping error:', err)
        }
      }
      return true
    },
  },

  pages: {
    signIn: '/login',
  },

  session: {
    strategy: 'jwt',
  },
})
