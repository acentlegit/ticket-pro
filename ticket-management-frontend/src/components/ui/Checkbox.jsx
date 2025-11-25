import { forwardRef } from 'react'

const Checkbox = forwardRef(({ 
  label, 
  error,
  className = '',
  containerClassName = '',
  ...props 
}, ref) => {
  return (
    <div className={containerClassName}>
      <div className="flex items-start">
        <input
          ref={ref}
          type="checkbox"
          className={`
            mt-1 h-4 w-4 
            text-primary-600 
            focus:ring-primary-500 
            border-gray-300 
            rounded
            transition-colors
            ${className}
          `}
          {...props}
        />
        {label && (
          <label className="ml-2 text-sm text-gray-700">
            {label}
          </label>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
})

Checkbox.displayName = 'Checkbox'

export default Checkbox
