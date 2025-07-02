"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronDown, X } from "lucide-react"

export interface MultiSelectOption {
  value: string
  label: string
  count?: number
}

interface MultiSelectFilterProps {
  value: string[]
  onChange: (value: string[]) => void
  options: MultiSelectOption[]
  placeholder?: string
  className?: string
  maxDisplay?: number
}

export function MultiSelectFilter({ 
  value, 
  onChange, 
  options, 
  placeholder = "เลือกหลายรายการ",
  className = "",
  maxDisplay = 2
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue]
    onChange(newValue)
  }

  const handleSelectAll = () => {
    if (value.length === options.length) {
      onChange([])
    } else {
      onChange(options.map(option => option.value))
    }
  }

  const clearAll = () => {
    onChange([])
    setIsOpen(false)
  }

  const getDisplayText = () => {
    if (value.length === 0) return placeholder
    
    if (value.length <= maxDisplay) {
      return value
        .map(v => options.find(opt => opt.value === v)?.label || v)
        .join(", ")
    }
    
    return `เลือกแล้ว ${value.length} รายการ`
  }

  const selectedOptions = value.map(v => options.find(opt => opt.value === v)).filter(Boolean)
  const isAllSelected = value.length === options.length

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={`justify-between h-auto min-h-[40px] ${className}`}
        >
          <div className="flex items-center gap-1 flex-wrap">
            {value.length <= maxDisplay ? (
              selectedOptions.map((option, index) => (
                <Badge 
                  key={option?.value} 
                  variant="secondary"
                  className="text-xs"
                >
                  {option?.label}
                  <X 
                    className="h-3 w-3 ml-1 hover:bg-gray-200 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggle(option?.value || "")
                    }}
                  />
                </Badge>
              ))
            ) : (
              <span className="text-sm">{getDisplayText()}</span>
            )}
            {value.length === 0 && (
              <span className="text-sm text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              เลือกรายการ ({value.length}/{options.length})
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSelectAll}
                className="h-6 px-2 text-xs"
              >
                {isAllSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
              </Button>
              {value.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearAll}
                  className="h-6 px-2 text-xs"
                >
                  ล้าง
                </Button>
              )}
            </div>
          </div>
          
          <div className="max-h-48 overflow-y-auto space-y-2">
            {options.map((option) => (
              <div
                key={option.value}
                className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => handleToggle(option.value)}
              >
                <Checkbox
                  checked={value.includes(option.value)}
                  onChange={() => handleToggle(option.value)}
                />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm">{option.label}</span>
                  {option.count !== undefined && (
                    <Badge variant="outline" className="text-xs">
                      {option.count}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-2 border-t">
            <Button 
              size="sm" 
              onClick={() => setIsOpen(false)}
              className="w-full"
            >
              ตกลง
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}