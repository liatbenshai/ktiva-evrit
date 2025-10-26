"use client"

import * as React from "react"

interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Dialog = ({ children, open, onOpenChange }: DialogProps) => {
  return <div>{children}</div>
}

interface DialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const DialogTrigger = ({ children, asChild }: DialogTriggerProps) => {
  return <div>{children}</div>
}

const DialogContent = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>
}

const DialogHeader = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>
}

const DialogTitle = ({ children }: { children: React.ReactNode }) => {
  return <h2>{children}</h2>
}

const DialogDescription = ({ children }: { children: React.ReactNode }) => {
  return <p>{children}</p>
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription }
