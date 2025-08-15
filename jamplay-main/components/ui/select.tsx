"use client"
import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { cn } from "@/lib/utils"

export function Select({
  value, onValueChange, children, placeholder
}: { value?: string, onValueChange?: (v: string)=>void, children: React.ReactNode, placeholder?: string }) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger className={cn("h-9 w-full rounded-md border border-neutral-300 px-3 text-left text-sm")}>
        <SelectPrimitive.Value placeholder={placeholder} />
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="rounded-md border bg-white p-1 shadow-md">
          <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
export const SelectItem = ({ value, children }: { value: string, children: React.ReactNode }) => (
  <SelectPrimitive.Item value={value} className="cursor-pointer rounded px-2 py-1 text-sm hover:bg-neutral-100">
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
)
