
"use client"

import React, { PropsWithChildren } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'

type PropType = PropsWithChildren<
  React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
>

export const PrevButton: React.FC<PropType> = (props) => {
  const { children, ...restProps } = props

  return (
    <Button
      variant="outline"
      size="icon"
      className="absolute top-1/2 -left-4 -translate-y-1/2 z-10 rounded-full h-10 w-10 hidden md:flex"
      {...restProps}
    >
      <ChevronLeft className="h-5 w-5" />
      {children}
    </Button>
  )
}

export const NextButton: React.FC<PropType> = (props) => {
  const { children, ...restProps } = props

  return (
    <Button
      variant="outline"
      size="icon"
      className="absolute top-1/2 -right-4 -translate-y-1/2 z-10 rounded-full h-10 w-10 hidden md:flex"
      {...restProps}
    >
      <ChevronRight className="h-5 w-5" />
      {children}
    </Button>
  )
}
