"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface StatusOption {
  value: string
  label: string
  color?: string
}

interface StatusFilterProps {
  value: string
  onChange: (value: string) => void
  options: StatusOption[]
  placeholder?: string
  className?: string
}

export function StatusFilter({ 
  value, 
  onChange, 
  options, 
  placeholder = "เลือกสถานะ",
  className = ""
}: StatusFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">ทั้งหมด</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              {option.color && (
                <div 
                  className={`w-2 h-2 rounded-full ${option.color}`}
                />
              )}
              {option.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Common status options
export const COURSE_STATUS_OPTIONS: StatusOption[] = [
  { value: "active", label: "เปิดใช้งาน", color: "bg-green-500" },
  { value: "inactive", label: "ปิดใช้งาน", color: "bg-gray-500" }
]

export const ENROLLMENT_STATUS_OPTIONS: StatusOption[] = [
  { value: "active", label: "กำลังเรียน", color: "bg-blue-500" },
  { value: "completed", label: "เรียนจบแล้ว", color: "bg-green-500" },
  { value: "inactive", label: "ไม่ใช้งาน", color: "bg-gray-500" }
]

export const PROGRESS_STATUS_OPTIONS: StatusOption[] = [
  { value: "not_started", label: "ยังไม่เริ่ม", color: "bg-gray-500" },
  { value: "in_progress", label: "กำลังเรียน", color: "bg-blue-500" },
  { value: "content_viewed", label: "ดูเนื้อหาแล้ว", color: "bg-yellow-500" },
  { value: "completed", label: "เสร็จสิ้น", color: "bg-green-500" }
]

export const TEST_STATUS_OPTIONS: StatusOption[] = [
  { value: "active", label: "เปิดใช้งาน", color: "bg-green-500" },
  { value: "inactive", label: "ปิดใช้งาน", color: "bg-gray-500" }
]