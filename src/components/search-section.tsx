
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type SearchSectionProps = {
    onSearch: (searchTerm: string) => void;
}

export function SearchSection({ onSearch }: SearchSectionProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(searchTerm);
    }

    return (
        <section className="bg-background py-6 sm:py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSearch} className="flex w-full items-center space-x-2 rounded-lg bg-card p-1.5 border shadow-sm">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search for cars, phones, and more..."
                                className="w-full border-none bg-transparent pl-9 focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-base"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button type="submit" size="sm" className="px-6">
                            <Search className="h-4 w-4 sm:hidden" />
                            <span className="hidden sm:inline">Search</span>
                        </Button>
                    </form>
                </div>
            </div>
        </section>
    )
}
