"use client"

import * as React from "react"

const Dialog = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>
}

const DialogTrigger = ({ children }: { children: React.ReactNode }) => {
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

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle }
