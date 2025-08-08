
"use client"

import { useMemo } from "react"
import {
  Card,
  CardContent,
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { conditions, locations, Condition, DatePostedOption, datePostedOptions } from "@/lib/types"
import { Filter, Trash2 } from "lucide-react"

export type FilterValues = {
  search: string
  priceRange: [number, number]
  location: string
  condition: Condition | ''
  datePosted: DatePostedOption
}

type ProductFiltersProps = {
  filters: Omit<FilterValues, 'category'>
  onFilterChange: (newFilters: Partial<FilterValues>) => void
  onClear: () => void;
}

export function ProductFilters({ filters, onFilterChange, onClear }: ProductFiltersProps) {

  const isAnyFilterActive = useMemo(() => {
    return filters.search !== '' ||
           filters.priceRange[0] !== 0 ||
           filters.priceRange[1] !== 150000000 ||
           filters.location !== '' ||
           filters.condition !== '' ||
           filters.datePosted !== 'any';
  }, [filters]);

  const datePostedLabels: Record<DatePostedOption, string> = {
    any: 'Any Time',
    today: 'Today',
    last7days: 'Last 7 Days',
    last30days: 'Last 30 Days'
  }

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
      <ScrollArea className="h-[calc(100vh-10rem)]">
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="search">Search by name</Label>
            <Input
              id="search"
              placeholder="e.g., Toyota Camry"
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price Range (₦)</Label>
            <Slider
              id="price"
              min={0}
              max={150000000}
              step={100000}
              value={filters.priceRange}
              onValueChange={(value) => onFilterChange({ priceRange: value as [number, number] })}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{filters.priceRange[0].toLocaleString()}</span>
              <span>{filters.priceRange[1].toLocaleString()}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select value={filters.location} onValueChange={(value) => onFilterChange({ location: value === "all" ? "" : value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
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
             <Select value={filters.condition} onValueChange={(value: string) => onFilterChange({ condition: value === "all" ? "" : value as Condition })}>
              <SelectTrigger>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                {conditions.map((cond) => (
                  <SelectItem key={cond} value={cond}>
                    {cond}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date-posted">Date Posted</Label>
             <Select value={filters.datePosted} onValueChange={(value: string) => onFilterChange({ datePosted: value as DatePostedOption })}>
              <SelectTrigger>
                <SelectValue placeholder="Select date" />
              </SelectTrigger>
              <SelectContent>
                 {datePostedOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {datePostedLabels[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  )
}
