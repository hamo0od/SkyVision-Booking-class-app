import { ApiResponseDebugger } from "@/components/debug/api-response-debugger"

export default function ApiDebugPage() {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold">API Debug Tools</h1>
      <ApiResponseDebugger />
    </div>
  )
}
