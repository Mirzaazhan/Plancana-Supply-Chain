'use client';

import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const MultiSelectInput = ({
  label,
  value = [],
  onChange,
  options = [],
  placeholder = 'Select options...',
  required = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const selectedValues = Array.isArray(value) ? value : [];
  
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedValues.includes(option)
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddOption = (option) => {
    const newSelected = [...selectedValues, option];
    onChange(newSelected);
    setSearchTerm('');
    inputRef.current?.focus();
  };

  const handleRemoveOption = (optionToRemove) => {
    const newSelected = selectedValues.filter(item => item !== optionToRemove);
    onChange(newSelected);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && searchTerm === '' && selectedValues.length > 0) {
      handleRemoveOption(selectedValues[selectedValues.length - 1]);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="min-h-[42px] w-full px-3 py-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent bg-white">
          <div className="flex flex-wrap gap-1 items-center">
            {selectedValues.map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
              >
                {item}
                <button
                  type="button"
                  onClick={() => handleRemoveOption(item)}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
            
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={selectedValues.length === 0 ? placeholder : ''}
              className="flex-1 min-w-[120px] outline-none text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>
        
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <ChevronDownIcon className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleAddOption(option)}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none text-gray-900 border-b border-gray-100 last:border-b-0"
            >
              {option}
            </button>
          ))}
          
          {searchTerm && !filteredOptions.includes(searchTerm) && (
            <button
              type="button"
              onClick={() => handleAddOption(searchTerm)}
              className="w-full text-left px-3 py-2 hover:bg-green-50 focus:bg-green-50 focus:outline-none text-green-700 border-b border-gray-100 italic"
            >
              Add "{searchTerm}"
            </button>
          )}
        </div>
      )}

      {/* Hidden input for form validation */}
      <input
        type="hidden"
        value={selectedValues.join(', ')}
        required={required && selectedValues.length === 0}
      />
    </div>
  );
};

export default MultiSelectInput;