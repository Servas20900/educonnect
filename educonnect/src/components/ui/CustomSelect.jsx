import React from 'react';
import { Controller } from 'react-hook-form';
import Select from 'react-select';

const CustomSelect = ({ name, control, options, placeholder, rules, isMulti = false, ...rest }) => {
    return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field: { onChange, value, ref }, fieldState: { error } }) => {
                
                const currentSelection = isMulti
                    ? options?.filter(opt => value?.includes(opt.value)) 
                    : options?.find(opt => opt.value == value) || null;  

                const handleSelectChange = (selectedOption) => {
                    if (isMulti) {
                        onChange(selectedOption ? selectedOption.map(opt => opt.value) : []);
                    } else {
                        onChange(selectedOption ? selectedOption.value : "");
                    }
                };

                return (
                    <div className="w-full">
                        <Select
                            {...rest}
                            inputRef={ref}
                            options={options}
                            value={currentSelection}
                            onChange={handleSelectChange}
                            isMulti={isMulti} 
                            isSearchable
                            placeholder={placeholder}
                            classNamePrefix="react-select"
                            noOptionsMessage={() => "No hay resultados"}
                            styles={{
                                control: (base, state) => ({
                                    ...base,
                                    minHeight: '42px',
                                    borderRadius: '0.75rem',
                                    backgroundColor: 'white',
                                    borderColor: error ? '#f87171' : state.isFocused ? '#6366f1' : '#e5e7eb',
                                    boxShadow: state.isFocused ? '0 0 0 4px rgba(99, 102, 241, 0.1)' : 'none',
                                    '&:hover': {
                                        borderColor: state.isFocused ? '#6366f1' : '#d1d5db'
                                    }
                                }),
                                menu: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                    borderRadius: '0.75rem',
                                    overflow: 'hidden'
                                }),
                                multiValue: (base) => ({
                                    ...base,
                                    backgroundColor: '#e0e7ff',
                                    borderRadius: '0.5rem',
                                }),
                                multiValueLabel: (base) => ({
                                    ...base,
                                    color: '#4338ca',
                                    fontWeight: 'bold',
                                    fontSize: '12px'
                                }),
                                multiValueRemove: (base) => ({
                                    ...base,
                                    color: '#4338ca',
                                    '&:hover': {
                                        backgroundColor: '#c7d2fe',
                                        color: '#312e81',
                                    },
                                }),
                            }}
                        />
                        {error && <p className="text-[10px] font-black text-red-500 mt-1 ml-1 uppercase tracking-wider">{error.message}</p>}
                    </div>
                );
            }}
        />
    );
};

export default CustomSelect;