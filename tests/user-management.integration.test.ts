import assert from "node:assert/strict"
import test from "node:test"
import { PrismaClient } from "@prisma/client"
import { createManagedUser, deleteManagedUser, updateManagedUser } from "../lib/user-management"

function form(values: Record<string, string>): FormData {
  const formData = new FormData()
  for (const [key, value] of Object.entries(values)) formData.set(key, value)
  return formData
}

test(
  "creates, updates, and deletes a user in PostgreSQL",
  { skip: process.env.RUN_USER_DATABASE_TEST !== "1" },
  async () => {
    const prisma = new PrismaClient()
    let adminId: string | undefined
    let managedUserId: string | undefined

    try {
      const admin = await createManagedUser(
        prisma,
        form({
          email: "integration-admin@example.test",
          username: "integration_admin",
          name: "Integration Admin",
          password: "admin-password",
          role: "ADMIN",
        }),
      )
      adminId = admin.id

      const managedUser = await createManagedUser(
        prisma,
        form({
          email: "integration-user@example.test",
          username: "integration_user",
          name: "Integration User",
          password: "initial-password",
          role: "USER",
        }),
      )
      managedUserId = managedUser.id

      const updateResult = await updateManagedUser(
        prisma,
        admin.id,
        managedUser.id,
        form({
          email: "updated-user@example.test",
          username: "updated_user",
          name: "Updated Integration User",
          password: "updated-password",
          role: "ADMIN",
        }),
      )

      assert.equal(updateResult.passwordChanged, true)
      assert.equal(updateResult.user.email, "updated-user@example.test")
      assert.equal(updateResult.user.username, "updated_user")
      assert.equal(updateResult.user.role, "ADMIN")
      assert.equal(updateResult.user.tokenVersion, 1)

      await deleteManagedUser(prisma, admin.id, managedUser.id)
      managedUserId = undefined
      assert.equal(await prisma.user.findUnique({ where: { id: managedUser.id } }), null)
    } finally {
      if (managedUserId) await prisma.user.deleteMany({ where: { id: managedUserId } })
      if (adminId) await prisma.user.deleteMany({ where: { id: adminId } })
      await prisma.$disconnect()
    }
  },
)
