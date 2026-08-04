import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import { clsx } from 'clsx';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  icon?: React.ElementType;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder = 'Selecione...',
  icon: Icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    const newValues = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value];
    onChange(newValues);
  };

  const removeValue = (e: React.MouseEvent, value: string) => {
    e.stopPropagation();
    onChange(selected.filter(v => v !== value));
  };

  const selectedLabels = options
    .filter(opt => selected.includes(opt.value))
    .map(opt => opt.label);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        className={clsx(
          "h-12 border rounded-xl shadow-sm bg-white px-4 py-2 cursor-pointer flex items-center justify-between transition-all duration-200 gap-2",
          selected.length > 0 ? "border-2 border-amber-400" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
          isOpen && selected.length === 0 && "border-gray-300 ring-2 ring-black/5"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-2 items-center flex-1 overflow-hidden">
          {Icon && selected.length === 0 && (
            <Icon className="h-4 w-4 text-gray-400 mr-1 shrink-0" />
          )}

          {selected.length === 0 && (
            <span className="text-gray-400 text-sm truncate">{placeholder}</span>
          )}

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1 w-full">
              {selectedLabels.slice(0, 2).map((label, index) => (
                <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-md font-medium whitespace-nowrap flex items-center gap-1">
                  {label}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={(e) => removeValue(e, options.find(o => o.label === label)?.value || '')}
                  />
                </span>
              ))}
              {selectedLabels.length > 2 && (
                <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-md font-medium whitespace-nowrap">
                  +{selectedLabels.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selected.length > 0 && (
            <div
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
            >
              <X className="h-3 w-3 text-gray-400 hover:text-gray-600" />
            </div>
          )}
          <ChevronDown className={clsx("h-4 w-4 text-gray-400 transition-transform duration-200", isOpen && "rotate-180")} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto py-1 animate-in fade-in zoom-in-95 duration-100">
          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <div
                key={option.value}
                className={clsx(
                  "px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors",
                  isSelected ? "text-black font-medium bg-gray-50" : "text-gray-600"
                )}
                onClick={() => toggleOption(option.value)}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="h-4 w-4 text-black" />}
              </div>
            );
          })}
          {options.length === 0 && (
            <div className="px-4 py-2 text-sm text-gray-400 text-center">
              Nenhuma opção encontrada
            </div>
          )}
        </div>
      )}
    </div>
  );
};
