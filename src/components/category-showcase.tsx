
"use client"

import { Button } from "@/components/ui/button"
import { categories, Category } from "@/lib/types"
import { Car, Home, Laptop, Lamp, Phone } from "lucide-react"

type CategoryShowcaseProps = {
  selectedCategory: Category | ''
  onCategorySelect: (category: Category | '') => void
}

const categoryIcons: Record<Category, React.ElementType> = {
  Cars: Car,
  Electronics: Laptop,
  'Real Estate': Home,
  Furniture: Lamp,
  Phones: Phone,
}

export function CategoryShowcase({ selectedCategory, onCategorySelect }: CategoryShowcaseProps) {
  return (
    <div className="pb-8 border-b">
        <h2 className="text-2xl font-bold tracking-tight mb-6 text-center">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {categories.map((category) => {
            const Icon = categoryIcons[category]
            return (
            <Button
                key={category}
                variant={selectedCategory === category ? "secondary" : "outline"}
                className="flex flex-col h-28 p-4 gap-2 items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow"
                onClick={() => onCategorySelect(selectedCategory === category ? '' : category)}
            >
                <Icon className="h-8 w-8 mb-1 text-primary" />
                <span className="text-sm font-semibold whitespace-normal leading-tight">{category}</span>
            </Button>
            )
        })}
        </div>
    </div>
  )
}
