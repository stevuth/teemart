
"use client"

import { useState, useMemo } from "react"
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
import { conditions, locations, Condition, DatePostedOption, datePostedOptions, Category, categories } from "@/lib/types"
import { X, RotateCcw } from "lucide-react"

export type FilterValues = {
  priceRange: [number, number]
  location: string
  condition: Condition | ''
  datePosted: DatePostedOption
  category: Category | ''
}

type ProductFiltersProps = {
  filters: FilterValues
  onApply: (newFilters: FilterValues) => void
  onClear: () => void;
  onClose?: () => void;
}

export function ProductFilters({ filters: initialFilters, onApply, onClear, onClose }: ProductFiltersProps) {

  const [currentFilters, setCurrentFilters] = useState(initialFilters);

  const handleFilterChange = (newValues: Partial<FilterValues>) => {
    setCurrentFilters(prev => ({...prev, ...newValues}));
  }

  const handleReset = () => {
    const defaultFilters = {
      priceRange: [0, 150000000] as [number, number],
      location: '',
      condition: '' as Condition | '',
      datePosted: 'any' as DatePostedOption,
      category: '' as Category | '',
    };
    setCurrentFilters(defaultFilters);
    onClear();
  }

  const datePostedLabels: Record<DatePostedOption, string> = {
    any: 'Any Time',
    today: 'Today',
    last7days: 'Last 7 Days',
    last30days: 'Last 30 Days'
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-xl shadow-sm border">
      <div className="p-6 pb-4 border-b">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Filter Results</h2>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8 lg:hidden">
                  <X className="h-4 w-4" />
              </Button>
            )}
        </div>
      </div>

      <ScrollArea className="flex-grow bg-card">
        <div className="p-6 space-y-8">
          <div className="space-y-4">
            <Label className="text-base font-semibold">Category</Label>
            <Select value={currentFilters.category} onValueChange={(value: string) => handleFilterChange({ category: value === "all" ? "" : value as Category })}>
                <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                        {cat}
                    </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold">Price Range (₦)</Label>
            <Slider
              min={0}
              max={150000000}
              step={100000}
              value={currentFilters.priceRange}
              onValueChange={(value) => handleFilterChange({ priceRange: value as [number, number] })}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>₦{currentFilters.priceRange[0].toLocaleString()}</span>
              <span>₦{currentFilters.priceRange[1].toLocaleString()}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <Label className="text-base font-semibold">Condition</Label>
            <div className="flex flex-wrap gap-2">
                {(['', ...conditions] as const).map(cond => (
                    <Button 
                        key={cond || 'all'}
                        variant={currentFilters.condition === cond ? 'default' : 'secondary'}
                        onClick={() => handleFilterChange({ condition: cond as Condition | '' })}
                        className="rounded-full"
                    >
                        {cond || 'All'}
                    </Button>
                ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <Label className="text-base font-semibold">Location</Label>
            <Select value={currentFilters.location} onValueChange={(value) => handleFilterChange({ location: value === "all" ? "" : value })}>
              <SelectTrigger className="h-12 text-base">
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
          
          <div className="space-y-4">
            <Label className="text-base font-semibold">Date Posted</Label>
             <Select value={currentFilters.datePosted} onValueChange={(value: string) => handleFilterChange({ datePosted: value as DatePostedOption })}>
              <SelectTrigger className="h-12 text-base">
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
        </div>
      </ScrollArea>
      <div className="p-6 pt-4 border-t flex flex-col sm:flex-row gap-2 justify-between">
            <Button variant="secondary" onClick={handleReset} className="w-full sm:w-auto mb-2 sm:mb-0">
                <RotateCcw className="mr-2 h-4 w-4"/>
                Reset Filters
            </Button>
            <Button onClick={() => onApply(currentFilters)} className="w-full sm:w-auto">
                Apply Filters
            </Button>
      </div>
    </div>
  )
}
