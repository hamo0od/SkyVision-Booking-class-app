"use client"

import { useState } from "react"
import { createClassroom } from "@/app/actions/classrooms"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, CheckCircle, AlertCircle, Users } from "lucide-react"

export function CreateClassroomForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await createClassroom(formData)
      setMessage({ type: "success", text: result.message })

      // Reset form
      const form = document.querySelector("form") as HTMLFormElement
      form?.reset()

      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to create classroom",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Building className="h-5 w-5 text-green-600" />
          Add New Classroom
        </CardTitle>
      </CardHeader>
      <CardContent>
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <Building className="inline h-4 w-4 mr-1" />
              Classroom Name
            </label>
            <Input type="text" name="name" placeholder="Room A" required className="w-full" />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <Users className="inline h-4 w-4 mr-1" />
              Capacity
            </label>
            <Input type="number" name="capacity" placeholder="30" min="1" required className="w-full" />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <Textarea
              name="description"
              placeholder="Describe the classroom features, equipment, etc."
              className="w-full min-h-[100px]"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-medium py-3 rounded-lg transition-all duration-200"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Classroom...
              </div>
            ) : (
              <>
                <Building className="h-4 w-4 mr-2" />
                Create Classroom
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
