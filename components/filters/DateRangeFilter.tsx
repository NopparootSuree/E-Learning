"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface DateRange {
  from: string | null
  to: string | null
  preset?: string
}

interface DateRangeFilterProps {
  value: DateRange
  onChange: (value: DateRange) => void
  placeholder?: string
  className?: string
}

const DATE_PRESETS = [
  { value: "7d", label: "7 วันที่แล้ว" },
  { value: "30d", label: "30 วันที่แล้ว" },
  { value: "90d", label: "90 วันที่แล้ว" },
  { value: "1y", label: "1 ปีที่แล้ว" },
  { value: "custom", label: "กำหนดเอง" }
]

export function DateRangeFilter({ 
  value, 
  onChange, 
  placeholder = "เลือกช่วงวันที่",
  className = ""
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handlePresetChange = (preset: string) => {
    if (preset === "custom") {
      onChange({ ...value, preset })
      return
    }

    const now = new Date()
    const days = parseInt(preset.replace('d', '').replace('y', preset.includes('y') ? '365' : ''))
    const from = new Date(now)
    from.setDate(from.getDate() - days)

    onChange({
      from: from.toISOString().split('T')[0],
      to: now.toISOString().split('T')[0],
      preset
    })
    setIsOpen(false)
  }

  const handleCustomDateChange = (type: 'from' | 'to', date: string) => {
    onChange({
      ...value,
      [type]: date,
      preset: 'custom'
    })
  }

  const clearFilter = () => {
    onChange({ from: null, to: null })
    setIsOpen(false)
  }

  const getDisplayText = () => {
    if (value.preset && value.preset !== 'custom') {
      const preset = DATE_PRESETS.find(p => p.value === value.preset)
      return preset?.label || placeholder
    }
    
    if (value.from && value.to) {
      return `${value.from} ถึง ${value.to}`
    }
    
    if (value.from) {
      return `จาก ${value.from}`
    }
    
    if (value.to) {
      return `ถึง ${value.to}`
    }
    
    return placeholder
  }

  const hasValue = value.from || value.to

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={`justify-between ${className}`}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="truncate">{getDisplayText()}</span>
          </div>
          {hasValue && (
            <X 
              className="h-4 w-4 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                clearFilter()
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">ช่วงเวลา</label>
            <Select 
              value={value.preset || ""} 
              onValueChange={handlePresetChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกช่วงเวลา" />
              </SelectTrigger>
              <SelectContent>
                {DATE_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {value.preset === 'custom' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">วันที่เริ่มต้น</label>
                <Input
                  type="date"
                  value={value.from || ""}
                  onChange={(e) => handleCustomDateChange('from', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">วันที่สิ้นสุด</label>
                <Input
                  type="date"
                  value={value.to || ""}
                  onChange={(e) => handleCustomDateChange('to', e.target.value)}
                />
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              ตกลง
            </Button>
            {hasValue && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={clearFilter}
              >
                ล้าง
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}