"use client"

// Placeholder file to maintain imports
// We're using direct DOM manipulation instead of React components for toasts

export type ToastProps = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  variant?: "default" | "success" | "destructive" | "warning" | "info"
  onClose?: () => void
  duration?: number
}

export const Toast = () => null
export const ToastViewport = () => null