import React, { useState } from 'react';
import { Check, Sparkles, Send, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StyleSelectorProps {
  directors: any[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCustomRequest: (request: string) => void;
  isGenerating?: boolean;
}

export default function StyleSelector({ directors, selectedId, onSelect, onCustomRequest, isGenerating }: StyleSelectorProps) {
  const [customRequest, setCustomRequest] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customRequest.trim() && !isGenerating) {
      onCustomRequest(customRequest);
      setCustomRequest('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          Style & Vibe
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {directors.map((style) => (
          <div
            key={style.id}
            onClick={() => onSelect(style.id)}
            className={cn(
              "group relative bg-[#141414] border border-[#27272a] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-indigo-500/50",
              selectedId === style.id && "border-indigo-500 ring-2 ring-indigo-500/20"
            )}
          >
            <div className="aspect-video relative overflow-hidden">
              <img
                src={style.thumbnail || `https://picsum.photos/seed/${style.id}/800/450`}
                alt={style.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent opacity-60" />
              
              {selectedId === style.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            <div className="p-4 space-y-1">
              <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                {style.name}
              </h4>
              <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
                {style.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Style Chat Input */}
      <div className="bg-[#141414] border border-[#27272a] rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Custom Style Assistant</h4>
            <p className="text-xs text-gray-500">Describe any style or combination you want to create.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={customRequest}
            onChange={(e) => setCustomRequest(e.target.value)}
            placeholder="e.g. 'A mix of Blade Runner neon and Wes Anderson symmetry' or 'Cyberpunk 1950s film noir'"
            disabled={isGenerating}
            className="w-full bg-[#0a0a0a] border border-[#27272a] rounded-lg py-3 pl-4 pr-12 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!customRequest.trim() || isGenerating}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:bg-gray-700"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
