"use client";

import { useEffect, useState } from "react";
import { Calendar, Users, Clock, BookOpen } from 'lucide-react';

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  purpose: string;
  instructorName: string;
  trainingOrder: string;
  participants: number;
  ecaaApproval: boolean;
  approvalNumber?: string;
  qualifications?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  classroom: {
    id: string;
    name: string;
    capacity: number;
  };
  user: {
    name: string;
  };
}

interface BookingTimelineProps {
  bookings: Booking[];
  classrooms: { id: string; name: string; capacity: number }[];
}

export function BookingTimeline({ bookings, classrooms }: BookingTimelineProps) {
  const [timelineData, setTimelineData] = useState<{
    time: string;
    classrooms: {
      [classroomId: string]: {
        status: "AVAILABLE" | "PENDING" | "APPROVED";
        booking?: Booking;
      };
    };
  }[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const generateTimeline = () => {
      const timeline = [];
      const startTime = 8; // 8:00 AM
      const endTime = 18; // 6:00 PM

      for (let hour = startTime; hour < endTime; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeString = `${hour.toString().padStart(2, "0")}:${minute
            .toString()
            .padStart(2, "0")}`;
          const classroomsData: {
            [classroomId: string]: {
              status: "AVAILABLE" | "PENDING" | "APPROVED";
              booking?: Booking;
            };
          } = {};

          classrooms.forEach((classroom) => {
            classroomsData[classroom.id] = { status: "AVAILABLE" };
          });

          timeline.push({ time: timeString, classrooms: classroomsData });
        }
      }

      // Populate bookings
      bookings.forEach((booking) => {
        const bookingStartTime = new Date(booking.startTime);
        const bookingEndTime = new Date(booking.endTime);

        const bookingStartHour = bookingStartTime.getHours();
        const bookingStartMinute = bookingStartTime.getMinutes();
        const bookingEndHour = bookingEndTime.getHours();
        const bookingEndMinute = bookingEndTime.getMinutes();

        const bookingStartTimeString = `${bookingStartHour
          .toString()
          .padStart(2, "0")}:${bookingStartMinute.toString().padStart(2, "0")}`;

        timeline.forEach((slot) => {
          if (slot.time === bookingStartTimeString) {
            slot.classrooms[booking.classroom.id] = {
              status: booking.status,
              booking: booking,
            };
          }
        });
      });

      setTimelineData(timeline);
    };

    generateTimeline();
  }, [bookings, classrooms]);

  const formatTime = (timeString: string) => {
    const [hour, minute] = timeString.split(":");
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? "PM" : "AM";
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${displayHour}:${minute} ${ampm}`;
  };

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-[60px_repeat(auto-fit,minmax(120px,1fr))] auto-rows-[60px] border">
        {/* Header Row */}
        <div className="p-2 font-semibold border-b border-r flex items-center justify-center">
          Time
        </div>
        {classrooms.map((classroom) => (
          <div
            key={classroom.id}
            className="p-2 font-semibold border-b border-r flex items-center justify-center"
          >
            {classroom.name}
          </div>
        ))}

        {/* Timeline Rows */}
        {timelineData.map((slot) => (
          <React.Fragment key={slot.time}>
            <div className="p-2 font-medium border-b border-r flex items-center justify-center">
              {formatTime(slot.time)}
            </div>
            {classrooms.map((classroom) => {
              const cellData = slot.classrooms[classroom.id];
              let cellClass = "p-2 border-b border-r flex items-center justify-center";

              if (cellData.status === "APPROVED") {
                cellClass += " bg-green-100 text-green-800";
              } else if (cellData.status === "PENDING") {
                cellClass += " bg-yellow-100 text-yellow-800";
              }

              return (
                <div key={classroom.id} className={cellClass}>
                  {cellData.booking ? (
                    <div className="text-sm">
                      {cellData.booking.user.name}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
