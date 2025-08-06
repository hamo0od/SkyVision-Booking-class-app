import type { User } from "./auth-context"

export const hasPermission = (user: User | null, action: string): boolean => {
  if (!user) return false

  const permissions = {
    admin: ["*"],
    storekeeper: [
      "view_dashboard",
      "view_materials",
      "edit_materials",
      "issue_materials",
      "view_requests",
      "approve_requests",
      "view_reports",
    ],
    technician: ["view_dashboard", "view_materials", "create_requests", "view_own_requests", "view_requests"],
  }

  return permissions[user.role].includes("*") || permissions[user.role].includes(action)
}
