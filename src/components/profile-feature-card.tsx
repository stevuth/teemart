
"use client";

import { Button } from "./ui/button";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

type ProfileFeatureCardProps = {
    icon: LucideIcon;
    label: string;
    value: string;
    buttonText?: string;
    onButtonClick?: () => void;
}

export function ProfileFeatureCard({ icon: Icon, label, value, buttonText, onButtonClick }: ProfileFeatureCardProps) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/40">
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-md bg-background">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="font-bold text-base">{value}</p>
                </div>
            </div>
            {buttonText && onButtonClick && (
                 <Button size="sm" variant="ghost" onClick={onButtonClick}>
                    {buttonText}
                    <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            )}
        </div>
    )
}

    