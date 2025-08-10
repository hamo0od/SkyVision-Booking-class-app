"use client"

import { useState } from "react"
import { createUser } from "@/app/actions/users"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus, CheckCircle, AlertCircle, Mail, User, Shield, Lock, Eye, EyeOff } from "lucide-react"

export function CreateUserForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedRole, setSelectedRole] = useState("") // force explicit choice
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await createUser(formData)
      setMessage({ type: "success", text: result.message })

      // Reset form
      setSelectedRole("")
      setShowPassword(false)
      const form = document.querySelector("form") as HTMLFormElement
      form?.reset()
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to create user",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <UserPlus className="h-5 w-5 text-indigo-600" />
          Add New User
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
              <Mail className="inline h-4 w-4 mr-1" />
              Email Address
            </label>
            <Input type="email" name="email" placeholder="user@example.com" required className="w-full" />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <User className="inline h-4 w-4 mr-1" />
              Username
            </label>
            <Input type="text" name="username" placeholder="johndoe" required className="w-full" />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <User className="inline h-4 w-4 mr-1" />
              Full Name
            </label>
            <Input type="text" name="name" placeholder="John Doe" required className="w-full" />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <Lock className="inline h-4 w-4 mr-1" />
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                required
                className="w-full pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <Shield className="inline h-4 w-4 mr-1" />
              Role
            </label>
            <Select name="role" value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select user role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Regular User</span>
                  </div>
                </SelectItem>
                <SelectItem value="ADMIN">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Administrator</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {/* Visually hidden, required field that participates in native validation */}
            <input
              type="text"
              name="role"
              value={selectedRole}
              required
              pattern=".+"
              aria-hidden="true"
              tabIndex={-1}
              onChange={() => {}}
              className="sr-only absolute -m-px h-0 w-0 overflow-hidden p-0 opacity-0 pointer-events-none"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-200"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating User...
              </div>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Create User
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
