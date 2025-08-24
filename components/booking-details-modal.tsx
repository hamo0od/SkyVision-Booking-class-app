"use client"

import type React from "react"
import { useState } from "react"
import { Modal, Button } from "antd"
import type { Booking } from "../types"

interface BookingDetailsModalProps {
  booking: Booking
  onCancel: () => void
  onApprove: () => void
}

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ booking, onCancel, onApprove }) => {
  const [visible, setVisible] = useState(true)

  const handleCancel = () => {
    setVisible(false)
    onCancel()
  }

  const handleApprove = () => {
    setVisible(false)
    onApprove()
  }

  return (
    <Modal
      title="Booking Details"
      visible={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        booking.status === "pending" && (
          <Button key="approve" type="primary" onClick={handleApprove}>
            Approve
          </Button>
        ),
      ]}
    >
      <p>
        <strong>Course Title:</strong> {booking.courseTitle}
      </p>
      <p>
        <strong>Date:</strong> {booking.date}
      </p>
      <p>
        <strong>Time:</strong> {booking.time}
      </p>
      <p>
        <strong>Status:</strong> {booking.status}
      </p>
      {/* Additional booking details can be added here */}
    </Modal>
  )
}

export default BookingDetailsModal
