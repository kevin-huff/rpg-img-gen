import React from 'react'
import { Copy, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PromptPreview({
    promptText,
    onGenerate,
    isGenerating,
    className = ''
}) {
    const copyToClipboard = async () => {
        if (!promptText) return
        try {
            await navigator.clipboard.writeText(promptText)
            toast.success('Preview copied to clipboard!')
        } catch (error) {
            console.error('Failed to copy:', error)
            toast.error('Failed to copy preview')
        }
    }

    return (
        <div className={`flex flex-col h-full ${className}`}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Live Preview
                </h3>
                <button
                    type="button"
                    onClick={copyToClipboard}
                    disabled={!promptText}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Copy className="h-3 w-3" />
                    Copy Text
                </button>
            </div>

            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-y-auto font-mono text-sm text-gray-800 whitespace-pre-wrap shadow-inner min-h-[200px]">
                {promptText || <span className="text-gray-400 italic">Select options to see the prompt preview...</span>}
            </div>

            <div className="mt-4">
                <button
                    type="button"
                    onClick={onGenerate}
                    disabled={isGenerating || !promptText}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold shadow-lg hover:from-blue-700 hover:to-purple-700 transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    <Sparkles className={`h-5 w-5 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? 'Generating Template...' : 'Generate & Save Template'}
                </button>
            </div>
        </div>
    )
}
