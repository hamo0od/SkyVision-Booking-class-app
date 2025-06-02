"use client"

import { useState } from "react"
import { updateUser, deleteUser } from "@/app/actions/users"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, Mail, Calendar, BookOpen, Edit2, Trash2, Save, X, User } from "lucide-react"

interface UserType {
  id: string
  email: string
  name: string | null
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
  const [editForm, setEditForm] = useState({ name: "", role: "" })

  const handleEdit = (user: UserType) => {
    setEditingUser(user.id)
    setEditForm({ name: user.name || "", role: user.role })
  }

  const handleSave = async (userId: string) => {
    try {
      const formData = new FormData()
      formData.append("name", editForm.name)
      formData.append("role", editForm.role)

      await updateUser(userId, formData)
      setEditingUser(null)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update user")
    }
  }

  const handleDelete = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to delete ${userName}? This will also delete all their bookings.`)) {
      try {
        await deleteUser(userId)
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to delete user")
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

            {user.id !== currentUserId && (
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                {editingUser === user.id ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleSave(user.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingUser(null)} className="flex-1">
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
