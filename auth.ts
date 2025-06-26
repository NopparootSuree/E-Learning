import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ idEmp: z.string(), password: z.string() })
          .safeParse(credentials)

        if (parsedCredentials.success) {
          const { idEmp, password } = parsedCredentials.data
          
          // Find employee by ID_EMP
          const employee = await prisma.employee.findFirst({
            where: {
              idEmp: idEmp,
              deletedAt: null
            },
            include: {
              user: true
            }
          })

          if (!employee) {
            return null
          }

          // Check password
          if (employee.password) {
            // If employee has hashed password, verify it
            const isValidPassword = await bcrypt.compare(password, employee.password)
            if (!isValidPassword) {
              return null
            }
          } else {
            // For employees without password, use idEmp as default password
            if (password !== employee.idEmp) {
              return null
            }
          }

          // Create or update user account
          let user = employee.user
          if (!user) {
            // Use upsert to handle unique constraint issues
            user = await prisma.user.upsert({
              where: { employeeId: employee.id },
              update: {
                name: employee.name,
                role: employee.idEmp === "admin" || employee.idEmp === "1076706004" ? "admin" : "user"
              },
              create: {
                name: employee.name,
                employeeId: employee.id,
                role: employee.idEmp === "admin" || employee.idEmp === "1076706004" ? "admin" : "user"
              }
            })
          }

          return {
            id: user.id,
            name: user.name,
            role: user.role,
            employeeId: user.employeeId || "",
          }
        }

        return null
      },
    }),
  ],
})