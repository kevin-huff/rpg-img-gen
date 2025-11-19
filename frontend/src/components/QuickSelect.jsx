import React, { useState, useEffect } from 'react'
import { Star, Dice5, Trash2 } from 'lucide-react'

export default function QuickSelect({
    title,
    items = [],
    selectedId,
    onSelect,
    storageKey,
    renderItem = (item) => item.title || item.name || item.description
}) {
    const [favorites, setFavorites] = useState([])

    useEffect(() => {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
            try {
                setFavorites(JSON.parse(stored))
            } catch (e) {
                console.error('Failed to parse favorites', e)
            }
        }
    }, [storageKey])

    const toggleFavorite = (item) => {
        const isFav = favorites.some(f => f.id === item.id)
        let newFavs
        if (isFav) {
            newFavs = favorites.filter(f => f.id !== item.id)
        } else {
            // Limit to 5 favorites
            if (favorites.length >= 5) {
                newFavs = [...favorites.slice(1), item]
            } else {
                newFavs = [...favorites, item]
            }
        }
        setFavorites(newFavs)
        localStorage.setItem(storageKey, JSON.stringify(newFavs))
    }

    const pickRandom = () => {
        if (!items.length) return
        const randomItem = items[Math.floor(Math.random() * items.length)]
        onSelect(randomItem.id)
    }

    if (!items.length) return null

    return (
        <div className="flex items-center gap-2 mb-3 bg-gray-50 p-2 rounded-lg border border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                {title}
            </span>

            {/* Randomizer */}
            <button
                type="button"
                onClick={pickRandom}
                className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-md transition-colors"
                title="Pick Random"
            >
                <Dice5 className="h-4 w-4" />
            </button>

            <div className="h-4 w-px bg-gray-300 mx-1" />

            {/* Favorites Slots */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1">
                {favorites.length === 0 ? (
                    <span className="text-xs text-gray-400 italic py-1">Star items to pin them here</span>
                ) : (
                    favorites.map(fav => (
                        <button
                            key={fav.id}
                            type="button"
                            onClick={() => onSelect(fav.id)}
                            className={`
                flex items-center gap-1 px-2 py-1 rounded text-xs border whitespace-nowrap max-w-[120px]
                ${(Array.isArray(selectedId) ? selectedId.includes(fav.id) : String(selectedId) === String(fav.id))
                                    ? 'bg-blue-100 text-blue-800 border-blue-300 ring-1 ring-blue-300'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                                }
              `}
                        >
                            <span className="truncate">{renderItem(fav)}</span>
                        </button>
                    ))
                )}
            </div>
        </div>
    )
}
