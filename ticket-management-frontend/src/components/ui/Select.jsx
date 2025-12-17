import { forwardRef } from 'react'

const Select = forwardRef(({
  label,
  error,
  helperText,
  required,
  children,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={`
          w-full px-3 py-2 
          border rounded-lg 
          bg-white dark:bg-gray-800
          transition-colors
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed dark:disabled:bg-gray-700
          text-gray-900 dark:text-gray-100
          ${error
            ? 'border-red-300 focus:ring-red-500'
            : 'border-gray-300 dark:border-gray-600'
          }
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
})

Select.displayName = 'Select'

export default Select
