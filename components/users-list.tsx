"use client"

import { useState } from "react"
import { updateUser, deleteUser } from "@/app/actions/users"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Shield, Mail, Calendar, BookOpen, Edit2, Trash2, Save, X, User } from "lucide-react"

interface UserType {
  id: string
  email: string
  name: string | null
  username: string
  role: string
  createdAt: Date
  _count: {
    bookings: number
  }
}

interface UsersListProps {
  users: UserType[]
  currentUserId: string
}

export function UsersList({ users, currentUserId }: UsersListProps) {
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const [editForm, setEditForm] = useState({ name: "", role: "", username: "", password: "" })

  const handleEdit = (user: UserType) => {
    setEditingUser(user.id)
    setEditForm({
      name: user.name || "",
      role: user.role,
      username: user.username,
      password: "",
    })
  }

  const handleSave = async (userId: string) => {
    try {
      setIsSaving(true)
      const formData = new FormData()
      formData.append("name", editForm.name)
      formData.append("role", editForm.role)
      formData.append("username", editForm.username)
      if (editForm.password && editForm.password.trim() !== "") {
        formData.append("password", editForm.password)
      }

      const res = (await updateUser(userId, formData)) as {
        success: boolean
        message: string
        passwordChanged?: boolean
      }
      setEditingUser(null)

      toast({
        title: res?.passwordChanged ? "Password changed successfully" : "User updated",
        description:
          res?.message ?? (res?.passwordChanged ? "The user will be signed out immediately." : "Changes saved."),
      })
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to delete ${userName}? This will also delete all their bookings.`)) {
      try {
        await deleteUser(userId)
        toast({ title: "User deleted", description: `${userName} and their bookings were removed.` })
      } catch (error) {
        toast({
          title: "Deletion failed",
          description: error instanceof Error ? error.message : "Failed to delete user",
          variant: "destructive",
        })
      }
    }
  }

  const getRoleColor = (role: string) => {
    return role === "ADMIN"
      ? "bg-purple-100 text-purple-800 border-purple-200"
      : "bg-blue-100 text-blue-800 border-blue-200"
  }

  const getRoleIcon = (role: string) => {
    return role === "ADMIN" ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />
  }

  if (users.length === 0) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">No users found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <Card
          key={user.id}
          className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-shadow duration-200"
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  {editingUser === user.id ? (
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="text-lg font-semibold"
                      placeholder="Full name"
                    />
                  ) : (
                    <CardTitle className="text-lg">{user.name || "No name"}</CardTitle>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {editingUser === user.id ? (
                  <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={`${getRoleColor(user.role)} font-medium`}>
                    {getRoleIcon(user.role)}
                    <span className="ml-1">{user.role}</span>
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              <span>{user.email}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>
                Joined{" "}
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <BookOpen className="h-4 w-4" />
              <span>{user._count.bookings} booking(s)</span>
            </div>

            {editingUser === user.id && (
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <div>
                  <label htmlFor={"username-" + user.id} className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <Input
                    id={"username-" + user.id}
                    placeholder="Username"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor={"password-" + user.id} className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <Input
                    id={"password-" + user.id}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Set a new password (optional)"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave blank to keep the current password.</p>
                </div>
              </div>
            )}

            {user.id !== currentUserId && (
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                {editingUser === user.id ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleSave(user.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingUser(null)}
                      className="flex-1"
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(user)} className="flex-1">
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(user.id, user.name || user.email)}
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            )}

            {user.id === currentUserId && (
              <div className="pt-2 border-t border-gray-100">
                <Badge variant="outline" className="text-xs">
                  This is your account
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
