import React from 'react'
import { X } from 'lucide-react'

export default function ModifierChips({
    label,
    options = [],
    value,
    onChange,
    allowCustom = true,
    placeholder = "Custom..."
}) {
    const handleChipClick = (option) => {
        // If it's the same value, toggle it off (if desired, or keep it)
        // For single select fields like Composition/Lighting, we usually just switch.
        // If we want to allow deselecting, we can check if value === option.
        onChange(value === option ? '' : option)
    }

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
            </label>
            <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                    const isSelected = value === option
                    return (
                        <button
                            key={option}
                            type="button"
                            onClick={() => handleChipClick(option)}
                            className={`
                px-3 py-1.5 text-xs rounded-full border transition-all
                ${isSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                }
              `}
                        >
                            {option}
                        </button>
                    )
                })}

                {allowCustom && (
                    <div className="relative flex-1 min-w-[120px] max-w-[200px]">
                        <input
                            type="text"
                            value={options.includes(value) ? '' : value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
                            className={`
                w-full px-3 py-1.5 text-xs border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500
                ${!options.includes(value) && value
                                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                                    : 'border-gray-300'
                                }
              `}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
