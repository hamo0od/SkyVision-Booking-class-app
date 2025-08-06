"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { api, type User } from "@/lib/api"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  token: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const storedToken = localStorage.getItem("auth_token")
    if (storedToken) {
      console.log("Found stored token:", storedToken.substring(0, 20) + "...")
      setToken(storedToken)
      api.auth
        .me()
        .then((userData) => {
          console.log("User data from token:", userData)
          setUser(userData)
        })
        .catch((error) => {
          console.error("Token validation failed:", error)
          // Token is invalid, remove it
          localStorage.removeItem("auth_token")
          setToken(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      console.log("No stored token found")
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("Attempting login for:", email)
      const response = await api.auth.login({ email, password })
      console.log("Login response:", response)

      if (response.token) {
        localStorage.setItem("auth_token", response.token)
        setToken(response.token)
        setUser(response.user)
        console.log("Login successful, token stored")
        return true
      } else {
        console.error("No token in login response")
        return false
      }
    } catch (error) {
      console.error("Login failed:", error)
      return false
    }
  }

  const logout = () => {
    console.log("Logging out...")
    localStorage.removeItem("auth_token")
    setToken(null)
    setUser(null)
    // Optionally call the logout endpoint
    api.auth.logout().catch(console.error)
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading, token }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
