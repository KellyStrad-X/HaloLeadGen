# Component Patterns

Consistent patterns for building React components in the Halo Lead Gen codebase.

---

## Component Organization

### File Structure

```
components/
├── CampaignForm.tsx          # Major feature components
├── PhotoUpload.tsx
├── LeadsTab.tsx
├── GlobalSidebar.tsx
│
├── CampaignDetailsModal.tsx  # Modal components
├── CreateCampaignModal.tsx
├── JobModal.tsx
│
├── CampaignMap.tsx           # Map components
├── HaloMap.tsx
├── MapModal.tsx
│
└── CampaignSuccess.tsx       # Specialized views
```

### Naming Conventions

- **PascalCase** for component files: `MyComponent.tsx`
- **camelCase** for utility functions: `myHelper.ts`
- **UPPER_SNAKE_CASE** for constants: `MAX_FILE_SIZE`

---

## Component Types

### Page Components

Located in `app/` directories:

```typescript
// app/(authenticated)/dashboard/page.tsx
export default function DashboardPage() {
  return <div>Dashboard content</div>;
}
```

### Layout Components

Wrap routes, provide context:

```typescript
// app/(authenticated)/layout.tsx
export default function AuthenticatedLayout({ children }) {
  return (
    <AuthProvider>
      <div className="layout">
        {children}
      </div>
    </AuthProvider>
  );
}
```

### Feature Components

Encapsulate major features:

```typescript
// components/LeadsTab.tsx
export default function LeadsTab() {
  // Complex feature logic
  return <div>Lead pipeline UI</div>;
}
```

### Modal Components

Follow modal patterns (see MODALS.md):

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: any;
  onSuccess?: () => void;
}

export default function MyModal({ isOpen, onClose }: ModalProps) {
  if (!isOpen) return null;
  return <div className="modal">...</div>;
}
```

---

## Client vs Server Components

### 'use client' Directive

Add to components using:
- React hooks (useState, useEffect, etc.)
- Browser APIs (window, localStorage)
- Event handlers
- Context consumers

```typescript
'use client';

import { useState } from 'react';

export default function InteractiveComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### Server Components (Default)

Components without 'use client' are server components:

```typescript
// No 'use client' directive
export default function StaticComponent() {
  return <div>Static content</div>;
}
```

**Benefits**:
- Zero JavaScript sent to client
- Can async fetch data
- Better performance

---

## Common Patterns

### Data Fetching Component

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function DataComponent() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/data', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch');

        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return <DataDisplay data={data} />;
}
```

### Form Component

```typescript
'use client';

import { useState } from 'react';

interface FormData {
  name: string;
  email: string;
}

export default function MyForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const [formData, setFormData] = useState<FormData>({ name: '', email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.includes('@')) {
      newErrors.email = 'Invalid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setErrors({ submit: 'Failed to submit' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      {errors.name && <span className="error">{errors.name}</span>}

      {/* More fields */}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

### List Component with Actions

```typescript
export default function ItemList({ items, onDelete }) {
  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.id} className="flex items-center justify-between p-4 bg-gray-800 rounded">
          <span>{item.name}</span>
          <button
            onClick={() => onDelete(item.id)}
            className="text-red-400 hover:text-red-300"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## Styling

### Tailwind Classes

Primary styling method:

```typescript
<div className="flex items-center justify-between px-6 py-4 bg-[#1e2227] border border-[#373e47] rounded-lg">
  <h2 className="text-xl font-semibold text-white">Title</h2>
</div>
```

### Color Palette

Consistent dark theme colors:
- Background: `#0d1117`, `#1e2227`, `#2d333b`
- Borders: `#373e47`, `#444c56`
- Text: `white`, `text-gray-300`, `text-gray-400`
- Primary: `cyan-400`, `cyan-500`
- Status: `green-400`, `orange-400`, `red-400`

### Conditional Classes

```typescript
<div className={`px-4 py-2 rounded ${
  isActive ? 'bg-cyan-500 text-black' : 'bg-gray-800 text-gray-300'
}`}>
  {label}
</div>
```

---

## TypeScript Patterns

### Component Props Interface

```typescript
interface ComponentProps {
  // Required props
  id: string;
  onClose: () => void;

  // Optional props
  className?: string;
  data?: any;

  // Callback with params
  onSubmit?: (data: FormData) => void;

  // Children
  children?: React.ReactNode;
}

export default function Component({ id, onClose, className }: ComponentProps) {
  // ...
}
```

### Generic Components

```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

export default function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <div>
      {items.map(item => (
        <div key={keyExtractor(item)}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}
```

---

## Performance Patterns

### useMemo for Expensive Calculations

```typescript
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}, [items]);
```

### useCallback for Event Handlers

```typescript
const handleClick = useCallback((id: string) => {
  console.log('Clicked:', id);
}, []);
```

### Lazy Loading Images

```typescript
<img
  src={imageUrl}
  loading="lazy"
  alt="Description"
/>
```

---

## Error Boundaries

```typescript
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong</div>;
    }

    return this.props.children;
  }
}
```

---

## Accessibility

### Semantic HTML

```typescript
<button onClick={handleClick}>Click Me</button>  // ✅ Good
<div onClick={handleClick}>Click Me</div>        // ❌ Avoid
```

### ARIA Labels

```typescript
<button
  onClick={onClose}
  aria-label="Close modal"
>
  <X className="h-6 w-6" />
</button>
```

### Focus Management

```typescript
useEffect(() => {
  if (isOpen) {
    inputRef.current?.focus();
  }
}, [isOpen]);
```

---

## Testing Patterns

Currently no automated tests. Manual testing checklist:

- [ ] Component renders without errors
- [ ] Props pass correctly
- [ ] Event handlers work
- [ ] Loading states display
- [ ] Error states display
- [ ] Mobile responsive
- [ ] Keyboard accessible

---

## Related Guides

- [MODALS.md](../areas/MODALS.md) - Modal components
- [DASHBOARD.md](../areas/DASHBOARD.md) - Dashboard components
- [CAMPAIGNS.md](../areas/CAMPAIGNS.md) - Campaign components
- [LEADS.md](../areas/LEADS.md) - Lead components
