# Form UX

Best practices for form design and input handling in mobile apps.

## Core Principles

### Minimize Input

Every form field is friction. Ruthlessly eliminate unnecessary fields.

| Before | After | Reduction |
|--------|-------|-----------|
| Name (First, Last) | Full Name | 50% |
| Address (5 fields) | Address autocomplete | 80% |
| Phone + Email | Just email | 50% |
| Confirm password | Show password toggle | 50% |

### Use Smart Defaults

```typescript
// Pre-fill country based on locale
const defaultCountry = Localization.getLocales()[0]?.regionCode ?? 'US';

// Pre-select common options
<Select
  defaultValue="standard"
  options={[
    { value: 'standard', label: 'Standard Shipping (Free)' },
    { value: 'express', label: 'Express ($9.99)' },
  ]}
/>
```

---

## Input Types

### Keyboard Types

```typescript
// Email
<TextInput
  keyboardType="email-address"
  autoCapitalize="none"
  autoComplete="email"
  textContentType="emailAddress"
/>

// Phone
<TextInput
  keyboardType="phone-pad"
  autoComplete="tel"
  textContentType="telephoneNumber"
/>

// Number
<TextInput
  keyboardType="numeric"
  returnKeyType="done"
/>

// Decimal
<TextInput
  keyboardType="decimal-pad"
/>

// URL
<TextInput
  keyboardType="url"
  autoCapitalize="none"
  autoCorrect={false}
/>

// Search
<TextInput
  keyboardType="web-search"
  returnKeyType="search"
  onSubmitEditing={handleSearch}
/>
```

### Text Content Types (iOS AutoFill)

```typescript
// Personal info
textContentType="name"
textContentType="givenName"
textContentType="familyName"
textContentType="nickname"

// Address
textContentType="streetAddressLine1"
textContentType="streetAddressLine2"
textContentType="addressCity"
textContentType="addressState"
textContentType="postalCode"
textContentType="countryName"

// Credentials
textContentType="username"
textContentType="password"
textContentType="newPassword"
textContentType="oneTimeCode" // SMS verification codes

// Payment
textContentType="creditCardNumber"
textContentType="creditCardExpiration"
```

---

## Form Layout

### Single Column Only

```typescript
// Good - Single column
<View style={styles.form}>
  <Input label="Email" />
  <Input label="Password" />
  <Button title="Sign In" />
</View>

// Bad - Side by side (hard to tap on mobile)
<View style={styles.row}>
  <Input label="First" style={{ flex: 1 }} />
  <Input label="Last" style={{ flex: 1 }} />
</View>
```

### Grouping Related Fields

```typescript
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Shipping Address</Text>
  <Input label="Street" />
  <Input label="City" />
  <View style={styles.row}>
    <Input label="State" style={{ flex: 1 }} />
    <Input label="ZIP" style={{ flex: 1 }} />
  </View>
</View>
```

### Label Placement

```typescript
// Stacked labels (recommended for mobile)
<View style={styles.inputGroup}>
  <Text style={styles.label}>Email</Text>
  <TextInput style={styles.input} placeholder="you@example.com" />
</View>

// Floating labels (space-efficient)
<FloatingLabelInput
  label="Email"
  value={email}
  onChangeText={setEmail}
/>
```

---

## Validation

### Inline Validation

```typescript
function EmailInput({ value, onChange, onValidation }) {
  const [error, setError] = useState(null);
  const [isTouched, setIsTouched] = useState(false);

  const validate = (text) => {
    if (!text) return 'Email is required';
    if (!text.includes('@')) return 'Enter a valid email';
    return null;
  };

  const handleBlur = () => {
    setIsTouched(true);
    const validationError = validate(value);
    setError(validationError);
    onValidation?.(!validationError);
  };

  const handleChange = (text) => {
    onChange(text);
    // Clear error when user starts typing
    if (error && isTouched) {
      const validationError = validate(text);
      setError(validationError);
    }
  };

  return (
    <View>
      <TextInput
        value={value}
        onChangeText={handleChange}
        onBlur={handleBlur}
        style={[styles.input, error && styles.inputError]}
        accessibilityLabel={error ? `Email, error: ${error}` : 'Email'}
      />
      {error && isTouched && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.interactive.separator,
    borderRadius: 8,
    padding: 12,
  },
  inputError: {
    borderColor: colors.semantic.error,
  },
  errorText: {
    color: colors.semantic.error,
    fontSize: 12,
    marginTop: 4,
  },
});
```

### When to Validate

| Timing | Use Case |
|--------|----------|
| On blur | Most fields |
| On change | Critical fields (password strength) |
| On submit | Final validation |
| Debounced | Username availability, search |

### Error Message Guidelines

```
Bad:  "Invalid"
Good: "Enter a valid email (e.g., you@example.com)"

Bad:  "Error"
Good: "Password must be at least 8 characters"

Bad:  "Required field"
Good: "Email is required"
```

---

## Multi-Step Forms

### Progress Indication

```typescript
function FormProgress({ currentStep, totalSteps }) {
  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index < currentStep && styles.progressDotComplete,
            index === currentStep && styles.progressDotActive,
          ]}
        />
      ))}
      <Text style={styles.progressText}>
        Step {currentStep + 1} of {totalSteps}
      </Text>
    </View>
  );
}
```

### Step Navigation

```typescript
function MultiStepForm() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});

  const steps = [
    { title: 'Account', component: AccountStep },
    { title: 'Profile', component: ProfileStep },
    { title: 'Preferences', component: PreferencesStep },
  ];

  const handleNext = (stepData) => {
    setFormData({ ...formData, ...stepData });
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit({ ...formData, ...stepData });
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const StepComponent = steps[step].component;

  return (
    <View style={styles.container}>
      <FormProgress currentStep={step} totalSteps={steps.length} />
      <StepComponent
        data={formData}
        onNext={handleNext}
        onBack={handleBack}
        isFirstStep={step === 0}
        isLastStep={step === steps.length - 1}
      />
    </View>
  );
}
```

### State Persistence

```typescript
// Save form state to handle interruptions
useEffect(() => {
  const saveFormState = async () => {
    await AsyncStorage.setItem('checkout_form', JSON.stringify({
      step,
      formData,
      timestamp: Date.now(),
    }));
  };

  const debounced = setTimeout(saveFormState, 500);
  return () => clearTimeout(debounced);
}, [step, formData]);

// Restore on mount
useEffect(() => {
  const restoreFormState = async () => {
    const saved = await AsyncStorage.getItem('checkout_form');
    if (saved) {
      const { step, formData, timestamp } = JSON.parse(saved);
      // Only restore if less than 1 hour old
      if (Date.now() - timestamp < 60 * 60 * 1000) {
        setStep(step);
        setFormData(formData);
      }
    }
  };
  restoreFormState();
}, []);
```

---

## Alternative Input Methods

### Camera Input

```typescript
import { Camera } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';

async function scanCreditCard() {
  const { status } = await Camera.requestCameraPermissionsAsync();
  if (status !== 'granted') return;

  // Use ML Kit or similar for card scanning
  const cardData = await CardScanner.scan();

  setFormData({
    cardNumber: cardData.number,
    expiry: cardData.expiry,
    name: cardData.name,
  });
}
```

### Location Input

```typescript
import * as Location from 'expo-location';

async function useCurrentLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return;

  const location = await Location.getCurrentPositionAsync({});
  const [address] = await Location.reverseGeocodeAsync(location.coords);

  setFormData({
    street: address.street,
    city: address.city,
    region: address.region,
    postalCode: address.postalCode,
    country: address.country,
  });
}
```

### Voice Input

```typescript
import { Audio } from 'expo-av';

function VoiceInput({ onTranscription }) {
  const [recording, setRecording] = useState(null);

  const startRecording = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') return;

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    setRecording(recording);
  };

  const stopRecording = async () => {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    // Send to speech-to-text service
    const text = await transcribe(uri);
    onTranscription(text);
    setRecording(null);
  };

  return (
    <Pressable
      onPressIn={startRecording}
      onPressOut={stopRecording}
      style={styles.voiceButton}
    >
      <IconSymbol name={recording ? 'mic.fill' : 'mic'} />
    </Pressable>
  );
}
```

---

## Accessibility

### Form Accessibility

```typescript
<View accessible={true} accessibilityRole="form">
  <Text nativeID="email-label">Email Address</Text>
  <TextInput
    accessibilityLabelledBy="email-label"
    accessibilityHint="Enter your email address"
    accessibilityState={{ disabled: isSubmitting }}
  />

  {error && (
    <Text
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={styles.error}
    >
      {error}
    </Text>
  )}
</View>
```

### Focus Management

```typescript
const emailRef = useRef(null);
const passwordRef = useRef(null);

<TextInput
  ref={emailRef}
  returnKeyType="next"
  onSubmitEditing={() => passwordRef.current?.focus()}
/>

<TextInput
  ref={passwordRef}
  returnKeyType="done"
  onSubmitEditing={handleSubmit}
/>
```

---

## Anti-Patterns

### Avoid

1. **Password confirmation field** - Use show/hide toggle instead
2. **Dropdown for 2-3 options** - Use radio buttons or segmented control
3. **Placeholder as label** - Label disappears on focus
4. **Validation only on submit** - User loses all context
5. **Clear buttons on every field** - Only for search/filter
6. **Required asterisks** - Mark optional fields instead
7. **CAPTCHA on mobile** - Use invisible reCAPTCHA or alternatives
