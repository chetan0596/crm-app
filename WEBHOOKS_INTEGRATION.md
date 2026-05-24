# Webhooks Integration Guide

## What Are Webhooks?

Webhooks automatically send lead data from the CRM to other apps or URLs when something happens. Example: get a Slack message every time a new lead is created.

**Two types:**
- **Push** — CRM sends data out to another app
- **Pull** — CRM fetches data from another app

---

## Step 1: Open the Webhooks Page

1. Log in to the CRM
2. From the left sidebar, click **Leads**
3. Click **Webhooks**

> Requires the `webhooks-view` permission.

---

## Step 2: Create a New Webhook

1. Click the **New Webhook** button (top right)
2. Fill the form:

| Field | What to enter |
|-------|---------------|
| **Name** | A label like "Slack Lead Alerts" |
| **Webhook URL** | The address that will receive data (e.g., `https://hooks.slack.com/services/xxx`) |
| **Type** | Choose `Push` to send data, or `Pull` to fetch data |
| **Secret Key** | Optional password to verify the data is really from your CRM |
| **Status** | Keep `Active` to use it immediately |
| **Events** | Pick which events should trigger this webhook |

3. Click **Save Webhook**

### Available Events

| Event | When it triggers |
|-------|-----------------|
| Lead Created | A new lead is added |
| Lead Updated | An existing lead is edited |
| Lead Deleted | A lead is removed |
| Lead Assigned | A lead is given to a user |
| Follow-up Created | A new follow-up is scheduled |
| Follow-up Completed | A follow-up is marked done |

---

## Step 3: Test the Webhook

Before relying on it, verify the endpoint works:

1. Find your webhook in the table
2. Click the **Test** button (vial icon)
3. Wait for the result:
   - **Green / 200** = Working
   - **Red / Error** = Check the URL or firewall

---

## Step 4: Managing Webhooks

| Action | How to do it |
|--------|-------------|
| Edit | Click the **pencil icon** on any webhook row |
| Delete | Click the **trash icon** (permanent) |
| Disable | Open edit, change Status to **Inactive**, save |

---

## What Data Is Sent? (Push Example)

When the event occurs, the CRM sends a POST request to your URL with this JSON:

```json
{
  "event": "lead.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": 123,
    "name": "John Doe",
    "phone": "+91 98765 43210",
    "email": "john@example.com",
    "source": { "name": "Website" },
    "stage": { "name": "New" },
    "city": { "name": "Mumbai" },
    "assignee": { "name": "Alice Manager" },
    "expected_value": 50000,
    "priority": "High",
    "status": "Active"
  }
}
```

### Headers included

```
Content-Type: application/json
X-CRM-Event: lead.created
X-CRM-Signature: sha256=<signature>
```

---

## Step 5: Secure Your Webhook (Optional)

If you set a **Secret Key**, the CRM signs every request with HMAC-SHA256.

### How to verify (Node.js)

```javascript
const crypto = require('crypto');

const signature = req.headers['x-crm-signature'].replace('sha256=', '');
const expected = crypto
  .createHmac('sha256', 'YOUR_SECRET_KEY')
  .update(JSON.stringify(req.body))
  .digest('hex');

if (signature !== expected) {
  return res.status(401).send('Invalid signature');
}
```

### How to verify (PHP)

```php
$signature = str_replace('sha256=', '', $_SERVER['HTTP_X_CRM_SIGNATURE']);
$expected = hash_hmac('sha256', json_encode($payload), 'YOUR_SECRET_KEY');

if (!hash_equals($expected, $signature)) {
  http_response_code(401);
  exit('Invalid signature');
}
```

---

## Backend Setup (For Developers)

### 1. Database Table

Run this SQL:

```sql
CREATE TABLE webhooks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    type ENUM('push', 'pull') DEFAULT 'push',
    events JSON NOT NULL,
    secret VARCHAR(255) NULL,
    active TINYINT(1) DEFAULT 1,
    last_triggered_at TIMESTAMP NULL,
    last_status INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

### 2. API Endpoints Required

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/webhooks` | List all webhooks (paginated) |
| POST | `/api/v1/webhooks` | Create new webhook |
| PUT | `/api/v1/webhooks/{id}` | Update webhook |
| DELETE | `/api/v1/webhooks/{id}` | Delete webhook |
| POST | `/api/v1/webhooks/{id}/test` | Send test payload |

### 3. Permissions to Add

- `webhooks-view`
- `webhooks-create`
- `webhooks-edit`
- `webhooks-delete`

### 4. Event Dispatcher Logic

When a lead event occurs:

1. Find all **active** webhooks subscribed to that event
2. For each webhook:
   - Build the JSON payload
   - If secret exists, generate HMAC-SHA256 signature
   - Send POST request with headers
   - Log the response status

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-----------|-----|
| Webhook not firing | Status is Inactive or event not selected | Edit webhook, set Active, check events |
| Test button shows timeout | URL unreachable from server | Check firewall, ensure URL is public |
| Signature error | Secret key mismatch | Copy-paste exact same key on both sides |
| 404 error | Wrong URL | Verify the endpoint exists and accepts POST |
| Empty payload received | Wrong Content-Type | Parse body as `application/json` |

---

## Quick Checklist

- [ ] Create database table
- [ ] Add 4 webhook permissions to roles
- [ ] Build 5 API endpoints
- [ ] Hook event dispatcher into lead create/update/delete/assign
- [ ] Test with the frontend Test button
