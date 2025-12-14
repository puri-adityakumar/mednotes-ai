'use client';

import Link from 'next/link';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    href?: string;
    showIcon?: boolean;
}

export function Logo({ size = 'md', href = '/', showIcon = true }: LogoProps) {
    const sizeClasses = {
        sm: 'text-lg',
        md: 'text-2xl',
        lg: 'text-3xl',
    };

    const iconSizes = {
        sm: 20,
        md: 28,
        lg: 36,
    };

    const iconSize = iconSizes[size];

    const logoContent = (
        <span className="flex items-center gap-2">
            {showIcon && (
                <svg
                    width={iconSize}
                    height={iconSize}
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="flex-shrink-0"
                >
                    {/* Background Circle with Gradient */}
                    <defs>
                        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#2563eb" />
                            <stop offset="100%" stopColor="#14b8a6" />
                        </linearGradient>
                        <linearGradient id="crossGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="100%" stopColor="#f0f9ff" />
                        </linearGradient>
                    </defs>
                    
                    {/* Main Circle */}
                    <circle cx="24" cy="24" r="22" fill="url(#logoGradient)" />
                    
                    {/* Medical Cross */}
                    <path
                        d="M20 14h8v8h8v8h-8v8h-8v-8h-8v-8h8v-8z"
                        fill="url(#crossGradient)"
                    />
                    
                    {/* Subtle shine effect */}
                    <ellipse
                        cx="18"
                        cy="16"
                        rx="8"
                        ry="6"
                        fill="white"
                        fillOpacity="0.15"
                    />
                    
                    {/* AI indicator dots */}
                    <circle cx="39" cy="39" r="6" fill="#14b8a6" stroke="white" strokeWidth="2" />
                    <text
                        x="39"
                        y="42"
                        textAnchor="middle"
                        fill="white"
                        fontSize="7"
                        fontWeight="bold"
                        fontFamily="system-ui"
                    >
                        AI
                    </text>
                </svg>
            )}
            <span
                className={`${sizeClasses[size]} font-logo font-medium italic bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent`}
            >
                MedNotes AI
            </span>
        </span>
    );

    if (href) {
        return (
            <Link href={href} className="hover:opacity-90 transition-opacity">
                {logoContent}
            </Link>
        );
    }

    return logoContent;
}
