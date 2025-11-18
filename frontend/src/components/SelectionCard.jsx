import React from 'react'
import { Check } from 'lucide-react'

export default function SelectionCard({
    title,
    subtitle,
    tags = [],
    isSelected,
    onToggle,
    onTagClick,
    className = ''
}) {
    return (
        <div
            onClick={onToggle}
            className={`
        relative group cursor-pointer rounded-lg border p-3 transition-all duration-200
        ${isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-500'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                }
        ${className}
      `}
        >
            <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {title}
                    </h3>
                    {subtitle && (
                        <p className={`text-sm truncate ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                            {subtitle}
                        </p>
                    )}
                </div>

                <div className={`
          flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors
          ${isSelected
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-gray-300 text-transparent group-hover:border-blue-400'
                    }
        `}>
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
            </div>

            {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                    {tags.map((tag, index) => (
                        <button
                            key={`${tag}-${index}`}
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                onTagClick?.(tag)
                            }}
                            className={`
                px-2 py-0.5 text-xs rounded-full border transition-colors
                ${isSelected
                                    ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
                                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                                }
              `}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
