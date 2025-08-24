import type React from "react"
import { Label, Textarea } from "@components/ui"

const BookingForm: React.FC = () => {
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="purpose">Course Title *</Label>
        <Textarea id="purpose" name="purpose" placeholder="Enter the course title" required className="min-h-[80px]" />
      </div>
      {/* ** rest of code here ** */}
    </form>
  )
}

export default BookingForm
