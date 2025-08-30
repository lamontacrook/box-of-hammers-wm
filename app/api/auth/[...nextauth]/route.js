import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/signup",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Redirect to profile page after successful sign in
      if (url.startsWith("/") || url.startsWith(baseUrl)) {
        return `${baseUrl}/profile`
      }
      return baseUrl
    },
    async session({ session, token }) {
      return session
    },
    async jwt({ token, user }) {
      return token
    },
  },
})

export { handler as GET, handler as POST }
