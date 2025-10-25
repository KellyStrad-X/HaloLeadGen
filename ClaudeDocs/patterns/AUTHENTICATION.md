# Authentication Patterns

Firebase Authentication is used for all user management. All contractors are authenticated users with their own isolated data.

---

## Auth Context

**File**: `lib/auth-context.tsx`

Provides authentication state and functions throughout the app:

```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

---

## Client-Side Auth

### Using Auth Context

```typescript
import { useAuth } from '@/lib/auth-context';

export default function MyComponent() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Getting ID Token

For API calls:

```typescript
const { user } = useAuth();

const token = await user.getIdToken();

const response = await fetch('/api/dashboard/campaigns', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

## Server-Side Auth

### Verifying Tokens in API Routes

```typescript
import { adminAuth } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  // Extract token
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // Verify with Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Use userId for queries
    // ...
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
```

---

## Protected Routes

### Route Groups

All authenticated pages are in `app/(authenticated)/` route group:

```
app/(authenticated)/
├── layout.tsx         # Wraps with AuthProvider, checks auth
├── dashboard/         # Dashboard pages
├── login/            # Login page
└── signup/           # Signup page
```

### Layout Protection

```typescript
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function AuthenticatedLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null; // Redirecting
  }

  return <>{children}</>;
}
```

---

## Login/Signup

### Login

```typescript
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (error) {
      setError('Invalid email or password');
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Signup

```typescript
const { signup } = useAuth();

const handleSignup = async (e) => {
  e.preventDefault();
  try {
    await signup(email, password);
    // Optionally create contractor document
    await createContractorProfile(user.uid);
    router.push('/dashboard');
  } catch (error) {
    setError('Signup failed');
  }
};
```

---

## Password Reset

```typescript
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const handleReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    setMessage('Password reset email sent');
  } catch (error) {
    setError('Failed to send reset email');
  }
};
```

---

## User Profile Data

### Contractor Document

Each user has a corresponding contractor document in Firestore:

```
contractors/
  └── [uid]/          # Firebase Auth UID
      ├── email
      ├── companyName
      ├── phone
      ├── address
      └── createdAt
```

### Fetching Profile

```typescript
const { user } = useAuth();

const profile = await getContractorAdmin(user.uid);
```

---

## Auth State Persistence

Firebase Auth automatically persists auth state in browser localStorage. Users stay logged in across sessions.

### Logging Out

```typescript
const { logout } = useAuth();

await logout();
router.push('/login');
```

---

## Auth Errors

Common Firebase Auth errors:

```typescript
try {
  await login(email, password);
} catch (error) {
  switch (error.code) {
    case 'auth/user-not-found':
      setError('No account with this email');
      break;
    case 'auth/wrong-password':
      setError('Incorrect password');
      break;
    case 'auth/too-many-requests':
      setError('Too many attempts. Try again later');
      break;
    case 'auth/invalid-email':
      setError('Invalid email format');
      break;
    default:
      setError('Authentication failed');
  }
}
```

---

## Security Best Practices

✅ **Do**:
- Always verify tokens on server-side
- Check resource ownership before operations
- Use HTTPS only
- Implement rate limiting (future)
- Require strong passwords

❌ **Don't**:
- Trust client-side auth checks alone
- Expose Firebase Admin credentials
- Store passwords in plain text
- Skip token verification in API routes

---

## Related Guides

- [API-ROUTES.md](./API-ROUTES.md) - Token verification in APIs
- [FIREBASE.md](./FIREBASE.md) - User data in Firestore
- [DASHBOARD.md](../areas/DASHBOARD.md) - Protected dashboard
