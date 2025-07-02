"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, RotateCcw } from "lucide-react"

export interface FilterBadge {
  key: string
  label: string
  value: string
  onRemove: () => void
}

interface FilterBadgesProps {
  badges: FilterBadge[]
  onClearAll?: () => void
  className?: string
}

export function FilterBadges({ 
  badges, 
  onClearAll, 
  className = "" 
}: FilterBadgesProps) {
  if (badges.length === 0) return null

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <span className="text-sm text-muted-foreground shrink-0">
        ตัวกรอง:
      </span>
      
      {badges.map((badge) => (
        <Badge 
          key={badge.key} 
          variant="secondary"
          className="px-2 py-1 text-xs"
        >
          <span className="mr-1">{badge.label}:</span>
          <span className="font-medium">{badge.value}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={badge.onRemove}
            className="h-3 w-3 p-0 ml-1 hover:bg-gray-200 rounded-full"
          >
            <X className="h-2 w-2" />
          </Button>
        </Badge>
      ))}
      
      {badges.length > 1 && onClearAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          ล้างทั้งหมด
        </Button>
      )}
    </div>
  )
}