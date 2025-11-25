# UI Components Library

Reusable, themed UI components for the Ticket Tracker application.

## Components

### Input

Text input field with label, error handling, and helper text support.

```jsx
import { Input } from '../components/ui'

<Input
  label="Email"
  type="email"
  name="email"
  value={email}
  onChange={handleChange}
  required
  error={errors.email}
  helperText="We'll never share your email"
  placeholder="Enter your email"
/>
```

**Props:**
- `label` - Label text
- `required` - Shows asterisk if true
- `error` - Error message to display
- `helperText` - Helper text below input
- `containerClassName` - Additional classes for container
- All standard input props (type, name, value, onChange, etc.)

### TextArea

Multi-line text input with label and error handling.

```jsx
import { TextArea } from '../components/ui'

<TextArea
  label="Description"
  name="description"
  value={description}
  onChange={handleChange}
  rows={4}
  required
  error={errors.description}
/>
```

**Props:**
- `label` - Label text
- `required` - Shows asterisk if true
- `rows` - Number of rows (default: 4)
- `error` - Error message to display
- `helperText` - Helper text below textarea
- All standard textarea props

### Select

Dropdown select with label and error handling.

```jsx
import { Select } from '../components/ui'

<Select
  label="Category"
  name="category"
  value={category}
  onChange={handleChange}
  required
>
  <option value="">Select...</option>
  <option value="hardware">Hardware</option>
  <option value="software">Software</option>
</Select>
```

**Props:**
- `label` - Label text
- `required` - Shows asterisk if true
- `error` - Error message to display
- `children` - Option elements
- All standard select props

### Button

Themed button with variants, sizes, and loading states.

```jsx
import { Button } from '../components/ui'

<Button
  variant="primary"
  size="md"
  onClick={handleClick}
  loading={isLoading}
  leftIcon={<PlusIcon />}
>
  Add Item
</Button>
```

**Variants:**
- `primary` - Primary blue button (default)
- `secondary` - Gray button
- `outline` - White with border
- `outlinePrimary` - White with primary border
- `danger` - Red button
- `success` - Green button
- `ghost` - Transparent button

**Sizes:**
- `sm` - Small
- `md` - Medium (default)
- `lg` - Large

**Props:**
- `variant` - Button style variant
- `size` - Button size
- `fullWidth` - Makes button full width
- `loading` - Shows loading spinner
- `leftIcon` - Icon on the left
- `rightIcon` - Icon on the right
- All standard button props

### Label

Standalone label component.

```jsx
import { Label } from '../components/ui'

<Label htmlFor="email" required>
  Email Address
</Label>
```

**Props:**
- `required` - Shows asterisk if true
- `htmlFor` - Associates with input id
- `className` - Additional classes

### Checkbox

Checkbox input with label.

```jsx
import { Checkbox } from '../components/ui'

<Checkbox
  name="agree"
  checked={agreed}
  onChange={handleChange}
  label="I agree to the terms"
  error={errors.agree}
/>
```

**Props:**
- `label` - Label text (can be JSX)
- `error` - Error message to display
- All standard checkbox props

## Theme

Colors are defined in `src/theme/colors.js` and can be customized:

```js
export const colors = {
  primary: { ... },
  secondary: { ... },
  success: { ... },
  error: { ... },
  warning: { ... },
  info: { ... },
}
```

## Usage Examples

### Form with validation

```jsx
import { Input, Select, TextArea, Button } from '../components/ui'

const MyForm = () => {
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
        error={errors.name}
      />
      
      <Select
        label="Category"
        name="category"
        value={formData.category}
        onChange={handleChange}
        error={errors.category}
      >
        <option value="">Select...</option>
        <option value="1">Option 1</option>
      </Select>
      
      <TextArea
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
      />
      
      <div className="flex space-x-3">
        <Button type="submit" loading={loading}>
          Submit
        </Button>
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
```

### Button variations

```jsx
// Primary action
<Button variant="primary">Save</Button>

// Secondary action
<Button variant="secondary">Cancel</Button>

// Outline button
<Button variant="outline">Edit</Button>

// Danger action
<Button variant="danger">Delete</Button>

// With icon
<Button leftIcon={<PlusIcon />}>Add New</Button>

// Loading state
<Button loading={true}>Saving...</Button>

// Full width
<Button fullWidth>Continue</Button>
```
