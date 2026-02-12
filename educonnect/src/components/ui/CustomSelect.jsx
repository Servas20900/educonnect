import React from 'react';
import { Controller } from 'react-hook-form';
import Select from 'react-select';

const CustomSelect = ({ name, control, options, placeholder, rules, ...rest }) => {
    return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field: { onChange, value, ref }, fieldState: { error } }) => {
                const currentSelection = options?.find(opt => opt.value == value) || null;

                const handleSelectChange = (selectedOption) => {
                    onChange(selectedOption ? selectedOption.value : "");
                };

                return (
                    <div className="w-full">
                        <Select
                            inputRef={ref}
                            options={options}
                            value={currentSelection}
                            onChange={handleSelectChange}
                            isSearchable
                            placeholder={placeholder}
                            classNamePrefix="react-select"
                            noOptionsMessage={() => "No hay resultados"}
                            styles={{
                                control: (base, state) => ({
                                    ...base,
                                    minHeight: '42px',
                                    borderRadius: '0.75rem',
                                    backgroundColor: 'rgb(249 250 251 / 0.5)',
                                    borderColor: error ? '#f87171' : state.isFocused ? '#6366f1' : '#e5e7eb',
                                    boxShadow: state.isFocused ? '0 0 0 4px rgba(99, 102, 241, 0.1)' : 'none',
                                }),
                                menu: (base) => ({
                                    ...base,
                                    zIndex: 9999
                                })
                            }}
                            {...rest}
                        />
                        {error && <p className="text-xs text-red-500 mt-1 ml-1">{error.message}</p>}
                    </div>
                );
            }}
        />
    );
};

export default CustomSelect;