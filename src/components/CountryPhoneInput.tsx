import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, Phone } from 'lucide-react';
import { UNIQUE_COUNTRY_CODES, POPULAR_COUNTRY_CODES, CountryCode } from '../data/countryCodes';

interface CountryPhoneInputProps {
  value: string;
  onChange: (fullPhoneNumber: string) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  defaultCountryCode?: string; // e.g. 'IN'
  className?: string;
}

export const CountryPhoneInput: React.FC<CountryPhoneInputProps> = ({
  value,
  onChange,
  placeholder = '98765 43210',
  id,
  required = false,
  disabled = false,
  defaultCountryCode = 'IN',
  className = '',
}) => {
  // Parse initial country from value or default
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(() => {
    if (value) {
      // Check if value starts with any dial code
      const match = UNIQUE_COUNTRY_CODES.find((c) => value.startsWith(c.dialCode));
      if (match) return match;
    }
    return UNIQUE_COUNTRY_CODES.find((c) => c.code === defaultCountryCode) || UNIQUE_COUNTRY_CODES[0];
  });

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Extract raw local number without dialCode
  const getLocalNumber = (val: string, country: CountryCode): string => {
    if (!val) return '';
    if (val.startsWith(country.dialCode)) {
      return val.slice(country.dialCode.length).trim();
    }
    return val.replace(/^\+\d+\s*/, '').trim();
  };

  const localNumber = getLocalNumber(value, selectedCountry);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchQuery('');
    // Combine new dial code with existing local number
    const updated = localNumber ? `${country.dialCode} ${localNumber}` : `${country.dialCode} `;
    onChange(updated);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d\s-]/g, '');
    const full = `${selectedCountry.dialCode} ${raw}`.trim();
    onChange(full);
  };

  // Filter countries by search query
  const filteredCountries = UNIQUE_COUNTRY_CODES.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.dialCode.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="flex items-center rounded-xl border border-[#c2c6d7] bg-white focus-within:border-[#0050c8] focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden shadow-2xs">
        {/* Country Picker Trigger */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 border-r border-[#c2c6d7] text-xs font-bold text-gray-800 shrink-0 cursor-pointer transition-colors"
          title={`${selectedCountry.name} (${selectedCountry.dialCode})`}
        >
          <span className="text-base leading-none select-none">{selectedCountry.flag}</span>
          <span className="font-mono text-gray-900">{selectedCountry.dialCode}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Local Number Input */}
        <div className="relative flex-1 flex items-center">
          <input
            type="tel"
            id={id}
            required={required}
            disabled={disabled}
            value={localNumber}
            onChange={handlePhoneChange}
            placeholder={placeholder}
            className="w-full px-3 py-2.5 bg-transparent text-xs font-bold text-[#121c28] placeholder:text-gray-400 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-72 max-w-[90vw] bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col text-xs animate-in fade-in zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/70">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country or code (+91, UK...)"
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:border-[#0050c8]"
              />
            </div>
          </div>

          {/* Countries List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-gray-50 py-1">
            {!searchQuery && (
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400 bg-gray-50/50">
                Popular Countries
              </div>
            )}
            {!searchQuery &&
              POPULAR_COUNTRY_CODES.map((country) => {
                const isSelected = selectedCountry.code === country.code;
                return (
                  <button
                    key={`pop-${country.code}`}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={`w-full px-3 py-2 flex items-center justify-between text-left hover:bg-blue-50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50/80 font-bold text-[#0050c8]' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base select-none">{country.flag}</span>
                      <span className="truncate">{country.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      <span className="font-mono text-gray-500 text-[11px]">{country.dialCode}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#0050c8]" />}
                    </div>
                  </button>
                );
              })}

            {!searchQuery && (
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400 bg-gray-50/50 mt-1">
                All Countries (A-Z)
              </div>
            )}

            {filteredCountries.length === 0 ? (
              <div className="px-3 py-6 text-center text-gray-400 text-xs">
                No matching countries found
              </div>
            ) : (
              filteredCountries.map((country) => {
                const isSelected = selectedCountry.code === country.code;
                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={`w-full px-3 py-2 flex items-center justify-between text-left hover:bg-blue-50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50/80 font-bold text-[#0050c8]' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base select-none">{country.flag}</span>
                      <span className="truncate">{country.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      <span className="font-mono text-gray-500 text-[11px]">{country.dialCode}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#0050c8]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
