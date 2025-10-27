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

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const DialogContent = ({ children, className, ...props }: DialogContentProps) => {
  return <div className={className} {...props}>{children}</div>
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const DialogHeader = ({ children, className, ...props }: DialogHeaderProps) => {
  return <div className={className} {...props}>{children}</div>
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

const DialogTitle = ({ children, className, ...props }: DialogTitleProps) => {
  return <h2 className={className} {...props}>{children}</h2>
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

const DialogDescription = ({ children, className, ...props }: DialogDescriptionProps) => {
  return <p className={className} {...props}>{children}</p>
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription }
