import assert from "node:assert/strict"
import test from "node:test"
import type { Role } from "@prisma/client"
import {
  createManagedUser,
  deleteManagedUser,
  updateManagedUser,
  type UserDatabase,
} from "../lib/user-management"

type TestUser = {
  id: string
  email: string
  username: string
  name: string | null
  password: string
  role: Role
  tokenVersion: number
}

class InMemoryUserDatabase {
  users: TestUser[]
  private nextId = 1

  constructor(users: TestUser[] = []) {
    this.users = structuredClone(users)
  }

  asPrisma(): UserDatabase {
    const findUnique = async ({ where }: { where: { id?: string; email?: string } }) =>
      this.users.find((user) => (where.id ? user.id === where.id : user.email === where.email)) ?? null

    const findFirst = async ({ where }: { where: Record<string, unknown> }) => {
      const excludedId = (where.id as { not?: string } | undefined)?.not
      const filters = where.OR as Array<Record<string, { equals: string }>>
      return (
        this.users.find(
          (user) =>
            user.id !== excludedId &&
            filters.some((filter) =>
              filter.email
                ? user.email.toLowerCase() === filter.email.equals.toLowerCase()
                : user.username.toLowerCase() === filter.username.equals.toLowerCase(),
            ),
        ) ?? null
      )
    }

    const create = async ({ data }: { data: Omit<TestUser, "id"> }) => {
      const user = { id: `created-${this.nextId++}`, ...data }
      this.users.push(user)
      return user
    }

    const update = async ({ where, data }: { where: { id: string }; data: Partial<TestUser> }) => {
      const user = this.users.find((candidate) => candidate.id === where.id)
      if (!user) throw new Error("Missing test user")
      Object.assign(user, data)
      return user
    }

    const remove = async ({ where }: { where: { id: string } }) => {
      const index = this.users.findIndex((candidate) => candidate.id === where.id)
      if (index < 0) throw new Error("Missing test user")
      return this.users.splice(index, 1)[0]
    }

    const count = async ({ where }: { where: { role: Role } }) =>
      this.users.filter((user) => user.role === where.role).length

    return {
      user: { findUnique, findFirst, create, update, delete: remove, count } as never,
    }
  }
}

const hashPassword = async (password: string, rounds: number) => `hashed:${rounds}:${password}`

function user(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: "admin-1",
    email: "admin@example.com",
    username: "admin",
    name: "Admin User",
    password: "existing-hash",
    role: "ADMIN",
    tokenVersion: 0,
    ...overrides,
  }
}

function form(values: Record<string, string>): FormData {
  const formData = new FormData()
  for (const [key, value] of Object.entries(values)) formData.set(key, value)
  return formData
}

test("creates, updates, and deletes a user", async () => {
  const memory = new InMemoryUserDatabase([user()])
  const database = memory.asPrisma()

  const created = await createManagedUser(
    database,
    form({
      email: "  New.User@Example.COM ",
      username: "new_user",
      name: "New User",
      password: "initial-pass",
      role: "USER",
    }),
    hashPassword,
  )

  assert.equal(created.email, "new.user@example.com")
  assert.equal(created.password, "hashed:12:initial-pass")

  const updated = await updateManagedUser(
    database,
    "admin-1",
    created.id,
    form({
      email: "updated@example.com",
      username: "updated_user",
      name: "Updated User",
      password: "replacement-pass",
      role: "ADMIN",
    }),
    hashPassword,
  )

  assert.equal(updated.passwordChanged, true)
  assert.equal(updated.user.email, "updated@example.com")
  assert.equal(updated.user.role, "ADMIN")
  assert.equal(updated.user.tokenVersion, 1)
  assert.equal(updated.user.password, "hashed:12:replacement-pass")

  await deleteManagedUser(database, "admin-1", created.id)
  assert.equal(memory.users.some((candidate) => candidate.id === created.id), false)
})

test("rejects duplicate emails and usernames case-insensitively", async () => {
  const database = new InMemoryUserDatabase([user()]).asPrisma()
  const base = {
    name: "Another User",
    password: "valid-password",
    role: "USER",
  }

  await assert.rejects(
    createManagedUser(database, form({ ...base, email: "ADMIN@example.com", username: "different" }), hashPassword),
    /Email already exists/,
  )
  await assert.rejects(
    createManagedUser(database, form({ ...base, email: "different@example.com", username: "ADMIN" }), hashPassword),
    /Username already exists/,
  )
})

test("accepts international user names", async () => {
  const database = new InMemoryUserDatabase().asPrisma()
  const created = await createManagedUser(
    database,
    form({
      email: "arabic@example.com",
      username: "arabic_user",
      name: "محمد أحمد",
      password: "valid-password",
      role: "USER",
    }),
    hashPassword,
  )

  assert.equal(created.name, "محمد أحمد")
})

test("keeps the password and token version when no new password is supplied", async () => {
  const target = user({ id: "user-1", email: "user@example.com", username: "user_one", role: "USER" })
  const memory = new InMemoryUserDatabase([user(), target])

  const result = await updateManagedUser(
    memory.asPrisma(),
    "admin-1",
    "user-1",
    form({ email: target.email, username: target.username, name: "Renamed User", role: "USER" }),
    hashPassword,
  )

  assert.equal(result.passwordChanged, false)
  assert.equal(result.user.password, "existing-hash")
  assert.equal(result.user.tokenVersion, 0)
})

test("blocks self-management and removal of the last administrator", async () => {
  const admin = user()
  const database = new InMemoryUserDatabase([admin]).asPrisma()

  await assert.rejects(
    updateManagedUser(
      database,
      admin.id,
      admin.id,
      form({ email: admin.email, username: admin.username, name: admin.name!, role: "USER" }),
      hashPassword,
    ),
    /profile page/,
  )
  await assert.rejects(deleteManagedUser(database, admin.id, admin.id), /cannot delete your own/)

  await assert.rejects(
    updateManagedUser(
      database,
      "different-admin",
      admin.id,
      form({ email: admin.email, username: admin.username, name: admin.name!, role: "USER" }),
      hashPassword,
    ),
    /last administrator account cannot be demoted/,
  )

  const secondAdmin = user({ id: "admin-2", email: "second@example.com", username: "second_admin" })
  const secondDatabase = new InMemoryUserDatabase([secondAdmin]).asPrisma()
  await assert.rejects(deleteManagedUser(secondDatabase, "missing-admin", secondAdmin.id), /last administrator/)
})
