# RevenueCat Setup Guide

## Monthly and Annual Subscription Product Setup

### 1. Create Products in App Store Connect

**Monthly Subscription:**
- Product ID: `{app_bundle_id}.monthly` (e.g., `com.example.app.monthly`)
- Subscription Group: Create new group "Premium Subscriptions"
- Duration: 1 Month
- Price: $9.99/month
- Localize product name and description

**Annual Subscription:**
- Product ID: `{app_bundle_id}.annual` (e.g., `com.example.app.annual`)
- Subscription Group: Same as monthly ("Premium Subscriptions")
- Duration: 1 Year
- Price: $99.99/year (20% discount compared to monthly)
- Localize product name and description
- Optional: Add introductory offer (e.g., first month at $4.99)

### 2. Link Products in RevenueCat Dashboard

**Create Products:**
1. Navigate to RevenueCat Dashboard → Project → Products
2. Click "Add Product"
3. For Monthly:
   - Store Identifier: `com.example.app.monthly`
   - App: Select your iOS app
   - Type: Subscription
   - Display Name: "Monthly Premium"
4. For Annual:
   - Store Identifier: `com.example.app.annual`
   - App: Select your iOS app
   - Type: Subscription
   - Display Name: "Annual Premium"

**Create Entitlement:**
1. Navigate to Entitlements
2. Click "Add Entitlement"
3. Lookup Key: `pro` (or `premium`)
4. Display Name: "Premium Access"
5. Attach both products to this entitlement

**Create Offering:**
1. Navigate to Offerings
2. Click "Add Offering"
3. Lookup Key: `default`
4. Display Name: "Premium Plans"
5. Set as current offering

**Create Packages:**
1. In the offering, click "Add Package"
2. For Monthly:
   - Lookup Key: `$rc_monthly`
   - Display Name: "Monthly Plan"
   - Position: 1
   - Attach product: "Monthly Premium"
3. For Annual:
   - Lookup Key: `$rc_annual`
   - Display Name: "Annual Plan"
   - Position: 0 (appears first)
   - Attach product: "Annual Premium"

### 3. RevenueCat MCP Verification

Use RevenueCat MCP tools to verify setup:

```
"RevenueCatのプロジェクト設定を確認して"
```

MCP will check:
- ✅ Products are created with correct store identifiers
- ✅ Entitlement "pro" is attached to both products
- ✅ Offering is set as current
- ✅ Packages are properly configured with correct lookup keys

### 4. Price Calculation Examples

**Monthly:** $9.99/month × 12 = $119.88/year

**Annual:** $99.99/year = 16.6% discount (~$20 savings)

**Introductory Offer Example:**
- First month: $4.99
- Then: $9.99/month
- Configure in App Store Connect → Subscription → Introductory Offers

### 5. Common Package Lookup Keys

RevenueCat recommends standard package identifiers:

- `$rc_monthly` - Monthly subscription
- `$rc_annual` - Annual subscription
- `$rc_three_month` - Three-month subscription
- `$rc_six_month` - Six-month subscription
- `$rc_lifetime` - Lifetime purchase (one-time)
- `$rc_custom_*` - Custom packages (e.g., `$rc_custom_quarterly`)

### 6. Testing with Sandbox

**Setup:**
1. Create sandbox tester account in App Store Connect
2. Sign out of App Store on test device
3. When prompted, sign in with sandbox account

**Verification:**
1. Purchase flows complete successfully
2. Subscription status updates in RevenueCat dashboard
3. Entitlement "pro" becomes active
4. Restore purchases works correctly

### 7. Production Checklist

- [ ] Products approved in App Store Connect
- [ ] RevenueCat offering set as "current"
- [ ] Entitlements properly attached to products
- [ ] Packages configured with standard lookup keys
- [ ] API keys configured in Expo Secrets
- [ ] TestFlight testing completed with sandbox users
- [ ] Purchase, restore, and subscription status flows verified
