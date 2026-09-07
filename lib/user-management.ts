import type { Prisma, PrismaClient, Role } from "@prisma/client"
import bcrypt from "bcryptjs"
import { sanitizeInput, validateEmail, validateName, validatePassword, validateUsername } from "@/lib/security"

export type UserDatabase = Pick<PrismaClient, "user">

export class UserManagementError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UserManagementError"
  }
}

type PasswordHasher = (password: string, rounds: number) => Promise<string>

function requiredValue(formData: FormData, key: string): string {
  return sanitizeInput(formData.get(key) as string)
}

function normalizedEmail(value: string): string {
  return value.toLowerCase()
}

function validateUserFields(email: string, username: string, name: string, role: string) {
  if (!validateEmail(email)) throw new UserManagementError("Invalid email format")
  if (!validateUsername(username)) {
    throw new UserManagementError("Username must be 3-20 characters and contain only letters, numbers, and underscores")
  }
  if (!validateName(name)) {
    throw new UserManagementError(
      "Name must be 2-50 characters and contain only letters, numbers, spaces, hyphens, and apostrophes",
    )
  }
  if (role !== "USER" && role !== "ADMIN") throw new UserManagementError("Invalid role")
}

function uniqueConstraintMessage(error: unknown): UserManagementError | null {
  if (!error || typeof error !== "object" || !("code" in error) || error.code !== "P2002") return null

  const target = "meta" in error && error.meta && typeof error.meta === "object" && "target" in error.meta
    ? String(error.meta.target)
    : ""

  return new UserManagementError(target.includes("email") ? "Email already exists" : "Username already exists")
}

export async function createManagedUser(
  database: UserDatabase,
  formData: FormData,
  hashPassword: PasswordHasher = bcrypt.hash,
) {
  const email = normalizedEmail(requiredValue(formData, "email"))
  const username = requiredValue(formData, "username")
  const name = requiredValue(formData, "name")
  const password = formData.get("password")
  const role = requiredValue(formData, "role")

  if (!email || !username || !name || typeof password !== "string" || !password || !role) {
    throw new UserManagementError("All fields are required")
  }

  validateUserFields(email, username, name, role)
  if (!validatePassword(password)) throw new UserManagementError("Password must be 12-128 characters long")

  const existingUser = await database.user.findFirst({
    where: {
      OR: [
        { email: { equals: email, mode: "insensitive" } },
        { username: { equals: username, mode: "insensitive" } },
      ],
    },
  })

  if (existingUser?.email.toLowerCase() === email) throw new UserManagementError("Email already exists")
  if (existingUser) throw new UserManagementError("Username already exists")

  try {
    return await database.user.create({
      data: {
        email,
        username,
        name,
        password: await hashPassword(password, 12),
        role: role as Role,
        tokenVersion: 0,
      },
    })
  } catch (error) {
    throw uniqueConstraintMessage(error) ?? error
  }
}

export async function updateManagedUser(
  database: UserDatabase,
  currentAdminId: string,
  userId: string,
  formData: FormData,
  hashPassword: PasswordHasher = bcrypt.hash,
) {
  if (currentAdminId === userId) {
    throw new UserManagementError("Use your profile page to update your own administrator account")
  }

  const currentUser = await database.user.findUnique({ where: { id: userId } })
  if (!currentUser) throw new UserManagementError("User not found")

  const emailValue = requiredValue(formData, "email")
  const usernameValue = requiredValue(formData, "username")
  const nameValue = requiredValue(formData, "name")
  const roleValue = requiredValue(formData, "role")
  const password = formData.get("password")

  const email = normalizedEmail(emailValue || currentUser.email)
  const username = usernameValue || currentUser.username
  const name = nameValue || currentUser.name || ""
  const role = roleValue || currentUser.role

  validateUserFields(email, username, name, role)

  const existingUser = await database.user.findFirst({
    where: {
      id: { not: userId },
      OR: [
        { email: { equals: email, mode: "insensitive" } },
        { username: { equals: username, mode: "insensitive" } },
      ],
    },
  })

  if (existingUser?.email.toLowerCase() === email) throw new UserManagementError("Email already exists")
  if (existingUser) throw new UserManagementError("Username already exists")

  if (currentUser.role === "ADMIN" && role !== "ADMIN") {
    const adminCount = await database.user.count({ where: { role: "ADMIN" } })
    if (adminCount <= 1) throw new UserManagementError("The last administrator account cannot be demoted")
  }

  const updateData: Prisma.UserUpdateInput = { email, username, name, role: role as Role }
  let passwordChanged = false

  if (typeof password === "string" && password.trim()) {
    if (!validatePassword(password)) throw new UserManagementError("Password must be 12-128 characters long")
    updateData.password = await hashPassword(password, 12)
    updateData.tokenVersion = currentUser.tokenVersion + 1
    passwordChanged = true
  }

  try {
    const user = await database.user.update({ where: { id: userId }, data: updateData })
    return { user, passwordChanged }
  } catch (error) {
    throw uniqueConstraintMessage(error) ?? error
  }
}

export async function deleteManagedUser(database: UserDatabase, currentAdminId: string, userId: string) {
  const user = await database.user.findUnique({ where: { id: userId } })
  if (!user) throw new UserManagementError("User not found")
  if (user.id === currentAdminId) throw new UserManagementError("You cannot delete your own administrator account")

  if (user.role === "ADMIN") {
    const adminCount = await database.user.count({ where: { role: "ADMIN" } })
    if (adminCount <= 1) throw new UserManagementError("The last administrator account cannot be deleted")
  }

  return database.user.delete({ where: { id: userId } })
}
