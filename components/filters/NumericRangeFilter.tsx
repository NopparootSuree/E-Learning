"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { BarChart3, X } from "lucide-react"

export interface NumericRange {
  min: number | null
  max: number | null
}

interface NumericRangeFilterProps {
  value: NumericRange
  onChange: (value: NumericRange) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  placeholder?: string
  className?: string
}

export function NumericRangeFilter({ 
  value, 
  onChange, 
  min = 0,
  max = 100,
  step = 1,
  unit = "",
  placeholder = "เลือกช่วง",
  className = ""
}: NumericRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempRange, setTempRange] = useState<[number, number]>([
    value.min ?? min,
    value.max ?? max
  ])

  const handleSliderChange = (newRange: [number, number]) => {
    setTempRange(newRange)
  }

  const handleInputChange = (type: 'min' | 'max', inputValue: string) => {
    const numValue = parseFloat(inputValue)
    if (isNaN(numValue)) return

    const newRange: [number, number] = [...tempRange]
    if (type === 'min') {
      newRange[0] = Math.max(min, Math.min(numValue, tempRange[1]))
    } else {
      newRange[1] = Math.min(max, Math.max(numValue, tempRange[0]))
    }
    setTempRange(newRange)
  }

  const applyFilter = () => {
    onChange({
      min: tempRange[0] === min ? null : tempRange[0],
      max: tempRange[1] === max ? null : tempRange[1]
    })
    setIsOpen(false)
  }

  const clearFilter = () => {
    onChange({ min: null, max: null })
    setTempRange([min, max])
    setIsOpen(false)
  }

  const getDisplayText = () => {
    if (value.min === null && value.max === null) {
      return placeholder
    }
    
    if (value.min !== null && value.max !== null) {
      return `${value.min}${unit} - ${value.max}${unit}`
    }
    
    if (value.min !== null) {
      return `≥ ${value.min}${unit}`
    }
    
    if (value.max !== null) {
      return `≤ ${value.max}${unit}`
    }
    
    return placeholder
  }

  const hasValue = value.min !== null || value.max !== null

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={`justify-between ${className}`}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
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
            <label className="text-sm font-medium mb-3 block">
              ช่วงค่า: {tempRange[0]}{unit} - {tempRange[1]}{unit}
            </label>
            <Slider
              value={tempRange}
              onValueChange={handleSliderChange}
              min={min}
              max={max}
              step={step}
              className="mb-3"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">ค่าต่ำสุด</label>
              <Input
                type="number"
                value={tempRange[0]}
                onChange={(e) => handleInputChange('min', e.target.value)}
                min={min}
                max={tempRange[1]}
                step={step}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">ค่าสูงสุด</label>
              <Input
                type="number"
                value={tempRange[1]}
                onChange={(e) => handleInputChange('max', e.target.value)}
                min={tempRange[0]}
                max={max}
                step={step}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={applyFilter}
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