
"use client";

import { Button } from "./ui/button";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { cn } from "@/lib/utils";

type ProfileFeatureCardProps = {
    icon: LucideIcon;
    label: string;
    value: string;
    buttonText?: string;
    onButtonClick?: () => void;
}

export function ProfileFeatureCard({ icon: Icon, label, value, buttonText, onButtonClick }: ProfileFeatureCardProps) {
    const router = useRouter();
    
    const content = (
        <>
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-md bg-background">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="font-bold text-base">{value}</p>
                </div>
            </div>
            {buttonText && (
                 <div className="flex items-center text-sm font-medium text-primary">
                    {buttonText}
                    <ChevronRight className="h-4 w-4 ml-1" />
                </div>
            )}
        </>
    );

    if (onButtonClick) {
        return (
             <div 
                onClick={onButtonClick} 
                className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/40 hover:bg-secondary/60 text-left cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onButtonClick()}}
             >
                {content}
            </div>
        )
    }

    return (
        <div className={cn("flex items-center justify-between p-3 rounded-lg bg-secondary/40")}>
            {content}
        </div>
    )
}
