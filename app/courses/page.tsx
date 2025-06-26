"use client"

import { useSession } from "next-auth/react"
import UserCoursesPage from "./user-courses"
import AdminCoursesPage from "./admin-courses"

export default function CoursesPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "admin"

  // Show admin view for admins, user view for regular users
  if (isAdmin) {
    return <AdminCoursesPage />
  }

  return <UserCoursesPage />
}