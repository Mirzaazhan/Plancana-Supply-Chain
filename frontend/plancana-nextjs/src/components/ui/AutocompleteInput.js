'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const AutocompleteInput = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Type to search...',
  required = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [inputValue, setInputValue] = useState(value || '');
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    const filtered = options.filter(option =>
      (typeof option === 'string' ? option : option.label || option.value || option)
        .toLowerCase()
        .includes(inputValue.toLowerCase())
    );
    if (filtered.length !== filteredOptions.length || JSON.stringify(filtered) !== JSON.stringify(filteredOptions)) {
        setFilteredOptions(filtered);
    }
  }, [inputValue, options,filteredOptions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleOptionSelect = (option) => {
    const selectedValue = typeof option === 'string' ? option : option.label || option.value || option;
    setInputValue(selectedValue);
    onChange(selectedValue);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const displayOptions = inputValue.length === 0 ? options : filteredOptions;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          required={required}
        />
        
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <ChevronDownIcon className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && displayOptions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {displayOptions.map((option, index) => {
            const displayText = typeof option === 'string' ? option : option.label || option.value || option;
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleOptionSelect(option)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none text-gray-900 border-b border-gray-100 last:border-b-0"
              >
                {displayText}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;