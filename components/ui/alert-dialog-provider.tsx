"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AlertOptions {
  title?: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
}

interface AlertDialogContextType {
  showAlert: (options: AlertOptions) => Promise<void>
  showConfirm: (options: AlertOptions) => Promise<boolean>
}

const AlertDialogContext = createContext<AlertDialogContextType | undefined>(undefined)

export function AlertDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<AlertOptions>({ description: "" })
  const [isConfirm, setIsConfirm] = useState(false)
  const [resolve, setResolve] = useState<((value: boolean) => void) | null>(null)

  const showAlert = (alertOptions: AlertOptions) => {
    return new Promise<void>((res) => {
      setOptions({
        title: alertOptions.title || "แจ้งเตือน",
        ...alertOptions,
        confirmText: alertOptions.confirmText || "รับทราบ"
      })
      setIsConfirm(false)
      setIsOpen(true)
      setResolve(() => () => {
        res()
        setIsOpen(false)
      })
    })
  }

  const showConfirm = (confirmOptions: AlertOptions) => {
    return new Promise<boolean>((res) => {
      setOptions({
        title: confirmOptions.title || "ยืนยันการดำเนินการ",
        ...confirmOptions,
        confirmText: confirmOptions.confirmText || "ยืนยัน",
        cancelText: confirmOptions.cancelText || "ยกเลิก"
      })
      setIsConfirm(true)
      setIsOpen(true)
      setResolve(() => (value: boolean) => {
        res(value)
        setIsOpen(false)
      })
    })
  }

  const handleConfirm = () => {
    if (resolve) resolve(true)
  }

  const handleCancel = () => {
    if (resolve) resolve(false)
  }

  const handleClose = () => {
    if (isConfirm) {
      handleCancel()
    } else {
      if (resolve) resolve(true) 
    }
  }

  return (
    <AlertDialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <AlertDialog open={isOpen} onOpenChange={handleClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
            <AlertDialogDescription>{options.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {isConfirm ? (
              <>
                <AlertDialogCancel onClick={handleCancel}>
                  {options.cancelText}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirm}
                  className={options.variant === "destructive" ? "bg-destructive hover:bg-destructive/90" : ""}
                >
                  {options.confirmText}
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction onClick={handleConfirm}>
                {options.confirmText}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertDialogContext.Provider>
  )
}

export function useAlertDialog() {
  const context = useContext(AlertDialogContext)
  if (!context) {
    throw new Error("useAlertDialog must be used within AlertDialogProvider")
  }
  return context
}