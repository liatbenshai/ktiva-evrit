import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: string;
}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      className={className}
      {...props}
    />
  )
}

export { Badge }
