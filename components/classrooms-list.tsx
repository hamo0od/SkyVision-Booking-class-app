"use client"

import { useState } from "react"
import { updateClassroom, deleteClassroom } from "@/app/actions/classrooms"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Building, Users, Edit2, Trash2, Save, X, BookOpen } from "lucide-react"

interface ClassroomType {
  id: string
  name: string
  capacity: number
  description: string | null
  _count: {
    bookings: number
  }
}

interface ClassroomsListProps {
  classrooms: ClassroomType[]
}

export function ClassroomsList({ classrooms }: ClassroomsListProps) {
  const [editingClassroom, setEditingClassroom] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: "", capacity: 0, description: "" })
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string; id: string } | null>(null)

  const handleEdit = (classroom: ClassroomType) => {
    setEditingClassroom(classroom.id)
    setEditForm({
      name: classroom.name,
      capacity: classroom.capacity,
      description: classroom.description || "",
    })
  }

  const handleSave = async (classroomId: string) => {
    try {
      const formData = new FormData()
      formData.append("name", editForm.name)
      formData.append("capacity", editForm.capacity.toString())
      formData.append("description", editForm.description)

      await updateClassroom(classroomId, formData)
      setEditingClassroom(null)
      setMessage({ type: "success", text: "Classroom updated successfully!", id: classroomId })

      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage(null)
      }, 3000)
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update classroom",
        id: classroomId,
      })
    }
  }

  const handleDelete = async (classroomId: string, classroomName: string) => {
    if (confirm(`Are you sure you want to delete ${classroomName}?`)) {
      try {
        await deleteClassroom(classroomId)
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to delete classroom")
      }
    }
  }

  if (classrooms.length === 0) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Building className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">No classrooms found</p>
          <p className="text-gray-400 text-sm mt-1">Create your first classroom to get started</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {classrooms.map((classroom) => (
        <Card
          key={classroom.id}
          className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-shadow duration-200"
        >
          {message && message.id === classroom.id && (
            <div
              className={`mx-4 mt-4 p-3 rounded-lg flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {classroom.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  {editingClassroom === classroom.id ? (
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="text-lg font-semibold"
                      placeholder="Classroom name"
                    />
                  ) : (
                    <CardTitle className="text-lg">{classroom.name}</CardTitle>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {editingClassroom === classroom.id ? (
                    <Input
                      type="number"
                      value={editForm.capacity}
                      onChange={(e) => setEditForm({ ...editForm, capacity: Number.parseInt(e.target.value) || 0 })}
                      className="w-16 h-6 text-xs p-1"
                      min="1"
                    />
                  ) : (
                    classroom.capacity
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2 text-sm text-gray-600">
              {editingClassroom === classroom.id ? (
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full min-h-[80px]"
                  placeholder="Classroom description"
                />
              ) : (
                <p>{classroom.description || "No description provided"}</p>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <BookOpen className="h-4 w-4" />
              <span>{classroom._count.bookings} booking(s)</span>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              {editingClassroom === classroom.id ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleSave(classroom.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingClassroom(null)} className="flex-1">
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(classroom)} className="flex-1">
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(classroom.id, classroom.name)}
                    className="flex-1"
                    disabled={classroom._count.bookings > 0}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </>
              )}
            </div>

            {classroom._count.bookings > 0 && !editingClassroom && (
              <p className="text-xs text-gray-500 mt-1">Cannot delete classroom with existing bookings</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
