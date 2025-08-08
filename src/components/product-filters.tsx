"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { categories, conditions, locations, Category } from "@/lib/types"
import { Car, Home, Laptop, Lamp, Phone, Filter, Trash2 } from "lucide-react"

export type FilterValues = {
  search: string
  category: string
  priceRange: [number, number]
  location: string
  condition: string
}

type ProductFiltersProps = {
  filters: FilterValues
  onFilterChange: (newFilters: Partial<FilterValues>) => void
  onClear: () => void;
}

const categoryIcons: Record<Category, React.ElementType> = {
  Cars: Car,
  Electronics: Laptop,
  'Real Estate': Home,
  Furniture: Lamp,
  Phones: Phone,
}

export function ProductFilters({ filters, onFilterChange, onClear }: ProductFiltersProps) {
  const handlePriceChange = (value: [number, number]) => {
    onFilterChange({ priceRange: value })
  }

  const isAnyFilterActive = Object.values(filters).some(value => {
    if (Array.isArray(value)) {
      return value[0] !== 0 || value[1] !== 150000000;
    }
    return value !== '';
  });

  return (
    <Card className="sticky top-20">
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filters</CardTitle>
        </div>
        {isAnyFilterActive && (
          <Button variant="ghost" size="sm" onClick={onClear} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
            <Trash2 className="h-4 w-4" /> Clear
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="search">Search by name</Label>
          <Input
            id="search"
            placeholder="e.g., Toyota Camry"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
          />
        </div>

        <div className="space-y-3">
          <Label>Category</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
            {categories.map((category) => {
              const Icon = categoryIcons[category]
              return (
                <Button
                  key={category}
                  variant={filters.category === category ? "secondary" : "outline"}
                  className="flex flex-col h-auto p-2 gap-1 items-center justify-center text-center"
                  onClick={() => onFilterChange({ category: filters.category === category ? '' : category })}
                >
                  <Icon className="h-6 w-6 mb-1" />
                  <span className="text-xs font-normal whitespace-normal leading-tight">{category}</span>
                </Button>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price Range (₦)</Label>
          <Slider
            id="price"
            min={0}
            max={150000000}
            step={100000}
            value={filters.priceRange}
            onValueChange={handlePriceChange}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{filters.priceRange[0].toLocaleString()}</span>
            <span>{filters.priceRange[1].toLocaleString()}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Select value={filters.location} onValueChange={(value) => onFilterChange({ location: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="condition">Condition</Label>
           <Select value={filters.condition} onValueChange={(value) => onFilterChange({ condition: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Conditions</SelectItem>
              {conditions.map((cond) => (
                <SelectItem key={cond} value={cond}>
                  {cond}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
