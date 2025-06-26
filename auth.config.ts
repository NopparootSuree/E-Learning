import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnAuthPage = nextUrl.pathname.startsWith("/auth")
      const isOnAdminPage = nextUrl.pathname.startsWith("/admin")
      
      if (isOnAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl))
        return true
      }
      
      if (isOnAdminPage) {
        if (!isLoggedIn) return false
        if (auth?.user?.role !== "admin") return false
        return true
      }
      
      return isLoggedIn
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.employeeId = user.employeeId
      }
      return token
    },
    session({ session, token }) {
      session.user.role = token.role as string
      session.user.employeeId = token.employeeId as string
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig