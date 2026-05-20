# Trimly API Documentation for AI Agents

Welcome to the Trimly API reference. This document is optimized for AI Agents, LLMs, and developers to quickly understand the endpoints, models, security requirements, and data flows of the Trimly Barbershop SaaS platform.

---

## 1. Overview & Connection Details

*   **Base URL**: `/api/v1` (relative to host)
*   **Protocol**: HTTPS
*   **Media Types**: `application/json` (Request & Response)
*   **API Format**: OpenAPI v3.0.0 compliant

---

## 2. Authentication & Authorization

The API uses two distinct authentication tokens, which must be passed in the `Authorization` header as a Bearer token:

`Authorization: Bearer <TOKEN>`

| Authentication Type | Header Token Type | Target Audience | Description |
| :--- | :--- | :--- | :--- |
| **`ClerkAuth`** | JWT (Clerk) | Barbers / Shop Owners (B2B) | Clerk authentication token for B2B operations. |
| **`CustomerAuth`** | Custom JWT | Customers (B2C) | Custom JWT bearer token generated via OTP/credentials for customer booking and management. |

---

## 3. Data Models (Schemas)

All resource structures returned by or sent to the API.

### Common / Error Response
```json
{
  "success": false,
  "error": "Error message description"
}
```

### BusinessHours
Represents the working hours of a barber for a single day of the week.
*   `day` (integer, `0` to `6`): Sunday is `0`, Monday is `1`, etc.
*   `open` (string, regex: `^\d{2}:\d{2}$`): Opening time in 24-hour format (e.g., `"09:00"`).
*   `close` (string, regex: `^\d{2}:\d{2}$`): Closing time in 24-hour format (e.g., `"18:00"`).
*   `isClosed` (boolean): `true` if the barber is not working on this day.

```json
{
  "day": 1,
  "open": "09:00",
  "close": "18:00",
  "isClosed": false
}
```

### Barber
Represents a B2B user (barber or shop owner).
*   `id` (string, ObjectId): Internal database ID.
*   `clerkId` (string): Clerk authentication identifier.
*   `shopId` (string, ObjectId): The ID of the shop they belong to.
*   `role` (string, enum): `"OWNER"` or `"BARBER"`.
*   `name` (string): Full name.
*   `email` (string): Email address.
*   `shopName` (string): Name of their shop.
*   `slug` (string): URL-friendly unique slug for the shop.
*   `phone` (string): Contact phone number.
*   `address` (string): Street address of the shop.
*   `bio` (string): Profile biography.
*   `businessHours` (array of `BusinessHours`): Weekly schedule.

```json
{
  "id": "60d0fe4f5311236168a109ca",
  "clerkId": "user_2xyz...",
  "shopId": "60d0fe4f5311236168a109c9",
  "role": "OWNER",
  "name": "John Doe",
  "email": "john@example.com",
  "shopName": "Doe Barbershop",
  "slug": "doe-barbershop",
  "phone": "+447000000000",
  "address": "123 Barber St, London",
  "bio": "Expert barber with 10 years experience.",
  "businessHours": [
    {
      "day": 1,
      "open": "09:00",
      "close": "18:00",
      "isClosed": false
    }
  ]
}
```

### Subscription
Represents a shop's Stripe subscription status. Only relevant to Shop Owners.
*   `plan` (string, enum): `"MONTHLY"`, `"YEARLY"`, or `"NONE"`.
*   `status` (string, enum): `"TRIALING"`, `"ACTIVE"`, `"PAST_DUE"`, `"CANCELLED"`, `"EXPIRED"`.
*   `stripeCustomerId` (string): Customer ID in Stripe.
*   `stripeSubscriptionId` (string): Subscription ID in Stripe.
*   `currentPeriodEnd` (string, date-time): End date/time of the current billing cycle.
*   `trialEndsAt` (string, date-time): End date/time of the free trial period.
*   `gracePeriodEndsAt` (string, date-time): End date/time of grace period if cancelled.

```json
{
  "plan": "MONTHLY",
  "status": "ACTIVE",
  "stripeCustomerId": "cus_abc...",
  "stripeSubscriptionId": "sub_xyz...",
  "currentPeriodEnd": "2026-06-20T20:00:00.000Z",
  "trialEndsAt": "2026-06-03T20:00:00.000Z",
  "gracePeriodEndsAt": null
}
```

### Shop
Represents a barbershop business.
*   `id` (string, ObjectId): Internal database ID.
*   `ownerId` (string): Clerk ID of the shop owner.
*   `name` (string): Business name.
*   `slug` (string): Unique URL-friendly slug.
*   `subscription` (`Subscription`): Active plan information.
*   `maxBarbersIncluded` (integer): Maximum number of barbers allowed in the current plan.

```json
{
  "id": "60d0fe4f5311236168a109c9",
  "ownerId": "user_2xyz...",
  "name": "Doe Barbershop",
  "slug": "doe-barbershop",
  "subscription": {
    "plan": "MONTHLY",
    "status": "ACTIVE",
    "stripeCustomerId": "cus_abc...",
    "stripeSubscriptionId": "sub_xyz..."
  },
  "maxBarbersIncluded": 5
}
```

### ShopWithBarbers
A wrapper returned when fetching a shop's details, including its team.
*   `shop` (`Shop`)
*   `barbers` (array of `Barber`)

```json
{
  "shop": {
    "id": "60d0fe4f5311236168a109c9",
    "ownerId": "user_2xyz...",
    "name": "Doe Barbershop",
    "slug": "doe-barbershop",
    "maxBarbersIncluded": 5
  },
  "barbers": [
    {
      "id": "60d0fe4f5311236168a109ca",
      "name": "John Doe",
      "role": "OWNER"
    }
  ]
}
```

### Customer
Represents a B2C client of the shops.
*   `id` (string, ObjectId)
*   `phone` (string): Phone number (used as primary or secondary auth).
*   `email` (string): Email address.
*   `name` (string): Full name.

```json
{
  "id": "60d0fe4f5311236168a109cb",
  "phone": "+447000000001",
  "email": "customer@example.com",
  "name": "Alice Smith"
}
```

### Service
Represents a haircut or grooming option offered by a specific barber.
*   `id` (string, ObjectId)
*   `barberId` (string): Clerk ID of the owning barber.
*   `name` (string): Title of service (e.g. "Men Haircut").
*   `price` (integer): Cost in pence/lowest currency unit (e.g., `2500` = £25.00).
*   `durationMinutes` (integer): How long the appointment takes.
*   `isActive` (boolean): Set to false for soft deletion / deactivation.

```json
{
  "id": "60d0fe4f5311236168a109cc",
  "barberId": "user_2xyz...",
  "name": "Men Haircut",
  "price": 2500,
  "durationMinutes": 30,
  "isActive": true
}
```

### Booking
Represents an appointment.
*   `id` (string, ObjectId)
*   `barberId` (string): Clerk ID of the barber performing the service.
*   `customerId` (string, ObjectId): ID of the customer (null/optional for manual bookings).
*   `serviceId` (string, ObjectId): ID of the selected service.
*   `serviceSnapshot` (object): Frozen service snapshot at the time of booking.
    *   `name` (string)
    *   `price` (integer)
    *   `durationMinutes` (integer)
*   `startTime` (string, date-time): Appointment start.
*   `endTime` (string, date-time): Appointment end.
*   `status` (string, enum): `"PENDING"`, `"CONFIRMED"`, `"CANCELLED"`, or `"COMPLETED"`.
*   `paymentStatus` (string, enum): `"PENDING"`, `"PAID"`, or `"REFUNDED"`.
*   `paymentIntentId` (string): Stripe Payment Intent ID (for online payments).
*   `type` (string, enum): `"ONLINE"` (self-booked) or `"MANUAL"` (barber walk-in).
*   `notes` (string): Customer or barber comments.

```json
{
  "id": "60d0fe4f5311236168a109cd",
  "barberId": "user_2xyz...",
  "customerId": "60d0fe4f5311236168a109cb",
  "serviceId": "60d0fe4f5311236168a109cc",
  "serviceSnapshot": {
    "name": "Men Haircut",
    "price": 2500,
    "durationMinutes": 30
  },
  "startTime": "2026-05-21T10:00:00.000Z",
  "endTime": "2026-05-21T10:30:00.000Z",
  "status": "CONFIRMED",
  "paymentStatus": "PAID",
  "paymentIntentId": "pi_3xyz...",
  "type": "ONLINE",
  "notes": "Customer wants a fade"
}
```

---

## 4. Endpoints Index & Routing

### 4.1. Authentication (B2C Customers)

#### **`POST /auth/customer/send-otp`**
*   **Summary**: Send OTP to Customer
*   **Auth Required**: None (Public)
*   **Description**: Sends a One-Time Password to the specified phone number via WhatsApp or SMS.
*   **Request Body**:
    ```json
    {
      "phone": "+447000000001"
    }
    ```
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "success": true,
          "message": "OTP sent successfully"
        }
        ```
    *   `400 Bad Request`: `ErrorResponse`

#### **`POST /auth/customer/verify-otp`**
*   **Summary**: Verify OTP
*   **Auth Required**: None (Public)
*   **Description**: Verifies the OTP sent to the customer and returns a JWT token.
*   **Request Body**:
    ```json
    {
      "phone": "+447000000001",
      "code": "123456"
    }
    ```
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "success": true,
          "data": {
            "customer": {
              "id": "60d0fe4f5311236168a109cb",
              "phone": "+447000000001",
              "email": "customer@example.com",
              "name": "Alice Smith"
            },
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "isNew": true
          }
        }
        ```
    *   `400 Bad Request`: `ErrorResponse`

#### **`POST /auth/customer/register`**
*   **Summary**: Register Customer (Email/Password)
*   **Auth Required**: None (Public)
*   **Description**: Registers a new customer using email, phone, and password.
*   **Request Body**:
    ```json
    {
      "phone": "+447000000001",
      "email": "customer@example.com",
      "password": "SecureP@ssw0rd",
      "name": "Alice Smith"
    }
    ```
*   **Responses**:
    *   `201 Created`:
        ```json
        {
          "success": true,
          "data": {
            "customer": {
              "id": "60d0fe4f5311236168a109cb",
              "phone": "+447000000001",
              "email": "customer@example.com",
              "name": "Alice Smith"
            },
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          }
        }
        ```
    *   `400 Bad Request`: `ErrorResponse`
    *   `409 Conflict`: `ErrorResponse`

#### **`POST /auth/customer/login`**
*   **Summary**: Login Customer (Email/Password)
*   **Auth Required**: None (Public)
*   **Description**: Logs in a customer using email or phone number and password.
*   **Request Body**:
    ```json
    {
      "identifier": "customer@example.com",
      "password": "SecureP@ssw0rd"
    }
    ```
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "success": true,
          "data": {
            "customer": {
              "id": "60d0fe4f5311236168a109cb",
              "phone": "+447000000001",
              "email": "customer@example.com",
              "name": "Alice Smith"
            },
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          }
        }
        ```
    *   `400 Bad Request`: `ErrorResponse`
    *   `401 Unauthorized`: `ErrorResponse`

---

### 4.2. Barbers (B2B Barbers)

#### **`POST /barbers/sync`**
*   **Summary**: Sync Barber Profile
*   **Auth Required**: `ClerkAuth` (Barber JWT)
*   **Description**: Syncs the barber profile from Clerk to the local database upon initial sign-in.
*   **Request Body**:
    ```json
    {
      "name": "John Doe",
      "email": "john@example.com"
    }
    ```
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "success": true,
          "data": {
            "id": "60d0fe4f5311236168a109ca",
            "clerkId": "user_2xyz...",
            "name": "John Doe",
            "email": "john@example.com"
          }
        }
        ```
    *   `401 Unauthorized`: `ErrorResponse`

#### **`GET /barbers/me`**
*   **Summary**: Get Barber Profile
*   **Auth Required**: `ClerkAuth` (Barber JWT)
*   **Description**: Retrieves the authenticated barber's profile details.
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "success": true,
          "data": { <Barber Object> }
        }
        ```
    *   `401 Unauthorized`: `ErrorResponse`
    *   `404 Not Found`: `ErrorResponse`

#### **`PUT /barbers/me`**
*   **Summary**: Update Barber Profile
*   **Auth Required**: `ClerkAuth` (Barber JWT)
*   **Description**: Updates the authenticated barber's profile fields, including business hours.
*   **Request Body**:
    ```json
    {
      "shopName": "Doe Barbershop",
      "phone": "+447000000000",
      "address": "123 Barber St, London",
      "bio": "Expert barber with 10 years experience.",
      "businessHours": [
        {
          "day": 1,
          "open": "09:00",
          "close": "18:00",
          "isClosed": false
        }
      ]
    }
    ```
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "success": true,
          "data": { <Barber Object> }
        }
        ```
    *   `400 Bad Request`: `ErrorResponse`
    *   `401 Unauthorized`: `ErrorResponse`

---

### 4.3. Services

#### **`POST /services`**
*   **Summary**: Create Service
*   **Auth Required**: `ClerkAuth` (Barber JWT)
*   **Description**: Creates a new service for the authenticated barber.
*   **Request Body**:
    ```json
    {
      "name": "Men Haircut",
      "price": 2500,
      "durationMinutes": 30
    }
    ```
*   **Responses**:
    *   `201 Created`:
        ```json
        {
          "success": true,
          "data": { <Service Object> }
        }
        ```
    *   `400 Bad Request`: `ErrorResponse`
    *   `401 Unauthorized`: `ErrorResponse`

#### **`GET /services/barber/{clerkId}`**
*   **Summary**: Get Barber Services
*   **Auth Required**: None (Public)
*   **Description**: Retrieves all active services for a specific barber. Used on booking page.
*   **Path Parameters**:
    *   `clerkId` (string, required): The Clerk ID of the barber.
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "success": true,
          "data": [
             { <Service Object> },
             { <Service Object> }
          ]
        }
        ```
    *   `400 Bad Request`: `ErrorResponse`

#### **`PUT /services/{id}`**
*   **Summary**: Update Service
*   **Auth Required**: `ClerkAuth` (Barber JWT)
*   **Description**: Updates an existing service. The authenticated barber must own the service.
*   **Path Parameters**:
    *   `id` (string, required): The service ID.
*   **Request Body**:
    ```json
    {
      "name": "Men Haircut and Beard",
      "price": 3500,
      "durationMinutes": 45
    }
    ```
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "success": true,
          "data": { <Service Object> }
        }
        ```
    *   `400 Bad Request`: `ErrorResponse`
    *   `401 Unauthorized`: `ErrorResponse`
    *   `403 Forbidden`: `ErrorResponse` (if barber is not the owner)
    *   `404 Not Found`: `ErrorResponse`

#### **`DELETE /services/{id}`**
*   **Summary**: Delete Service
*   **Auth Required**: `ClerkAuth` (Barber JWT)
*   **Description**: Soft deletes a service. The authenticated barber must own the service.
*   **Path Parameters**:
    *   `id` (string, required): The service ID.
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "success": true,
          "message": "Service deleted"
        }
        ```
    *   `401 Unauthorized`: `ErrorResponse`
    *   `403 Forbidden`: `ErrorResponse`
    *   `404 Not Found`: `ErrorResponse`

---

### 4.4. Bookings

#### **`GET /bookings/barber/{clerkId}/availability`**
*   **Summary**: Get Availability
*   **Auth Required**: None (Public)
*   **Description**: Calculates available 15-minute booking slots for a specific date and service.
*   **Path Parameters**:
    *   `clerkId` (string, required): The Clerk ID of the barber.
*   **Query Parameters**:
    *   `serviceId` (string, required): The ID of the service being booked.
    *   `date` (string, format: `YYYY-MM-DD`, required): The date to query.
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "success": true,
          "data": [
            "2026-05-21T09:00:00.000Z",
            "2026-05-21T09:15:00.000Z",
            "2026-05-21T09:30:00.000Z"
          ]
        }
        ```
    *   `400 Bad Request`: `ErrorResponse`
    *   `404 Not Found`: `ErrorResponse`

#### **`POST /bookings/online`**
*   **Summary**: Create Online Booking
*   **Auth Required**: `CustomerAuth` (Customer JWT)
*   **Description**: Creates a new online booking for a customer and returns a Stripe Payment Intent client secret to complete checkout.
*   **Request Body**:
    ```json
    {
      "barberId": "user_2xyz...",
      "serviceId": "60d0fe4f5311236168a109cc",
      "startTime": "2026-05-21T10:00:00.000Z"
    }
    ```
*   **Responses**:
    *   `201 Created`:
        ```json
        {
          "success": true,
          "data": {
            "booking": { <Booking Object> },
            "clientSecret": "pi_3xyz_secret_abc..."
          }
        }
        ```
    *   `400 Bad Request`: `ErrorResponse`
    *   `401 Unauthorized`: `ErrorResponse`
    *   `409 Conflict`: `ErrorResponse` (e.g., if slot is already booked - race condition)

#### **`POST /bookings/manual`**
*   **Summary**: Create Manual Booking
*   **Auth Required**: `ClerkAuth` (Barber JWT)
*   **Description**: Creates a manual walk-in booking by the barber directly in the shop calendar.
*   **Request Body**:
    ```json
    {
      "serviceId": "60d0fe4f5311236168a109cc",
      "startTime": "2026-05-21T11:00:00.000Z",
      "customerName": "Walk-in Customer",
      "customerPhone": "+447000000002",
      "notes": "Requires quick trim"
    }
    ```
*   **Responses**:
    *   `210 Created` / `201 Created`:
        ```json
        {
          "success": true,
          "data": { <Booking Object> }
        }
        ```
    *   `400 Bad Request`: `ErrorResponse`
    *   `401 Unauthorized`: `ErrorResponse`
    *   `409 Conflict`: `ErrorResponse`

#### **`GET /bookings/me/barber`**
*   **Summary**: Get Barber Bookings
*   **Auth Required**: `ClerkAuth` (Barber JWT)
*   **Description**: Retrieves all non-cancelled bookings for the authenticated barber.
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "success": true,
          "data": [
            { <Booking Object> }
          ]
        }
        ```
    *   `401 Unauthorized`: `ErrorResponse`

#### **`GET /bookings/me/customer`**
*   **Summary**: Get Customer Bookings
*   **Auth Required**: `CustomerAuth` (Customer JWT)
*   **Description**: Retrieves all bookings for the authenticated customer.
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "success": true,
          "data": [
            { <Booking Object> }
          ]
        }
        ```
    *   `401 Unauthorized`: `ErrorResponse`

#### **`PATCH /bookings/{id}/status`**
*   **Summary**: Update Booking Status
*   **Auth Required**: `ClerkAuth` (Barber JWT)
*   **Description**: Updates the status of a booking (e.g. to `"CANCELLED"` or `"COMPLETED"`). The barber must own the booking.
*   **Path Parameters**:
    *   `id` (string, required): The ID of the booking.
*   **Request Body**:
    ```json
    {
      "status": "COMPLETED"
    }
    ```
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "success": true,
          "data": { <Booking Object> }
        }
        ```
    *   `400 Bad Request`: `ErrorResponse`
    *   `401 Unauthorized`: `ErrorResponse`
    *   `403 Forbidden`: `ErrorResponse`
    *   `404 Not Found`: `ErrorResponse`

---

### 4.5. Payments

#### **`POST /payments/webhook`**
*   **Summary**: Stripe Webhook
*   **Auth Required**: None (Public webhook, relies on signature verification)
*   **Description**: Receives asynchronous payment status updates from Stripe. Expects a raw request body and the `stripe-signature` header.
*   **Request Body**: Raw Stripe JSON event payload.
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "received": true
        }
        ```
    *   `400 Bad Request`: `ErrorResponse`

---

### 4.6. Shops

#### **`POST /shops`**
*   **Summary**: Create Shop
*   **Auth Required**: `ClerkAuth` (Barber JWT)
*   **Description**: Creates a new barbershop profile. The authenticated barber becomes the shop `OWNER`.
*   **Request Body**:
    ```json
    {
      "name": "Doe Barbershop"
    }
    ```
*   **Responses**:
    *   `201 Created`:
        ```json
        {
          "success": true,
          "data": { <Shop Object> }
        }
        ```
    *   `401 Unauthorized`: `ErrorResponse`
    *   `409 Conflict`: `ErrorResponse`

#### **`GET /shops/me`**
*   **Summary**: Get My Shop
*   **Auth Required**: `ClerkAuth` (Barber JWT)
*   **Description**: Retrieves the authenticated barber's shop details, including the full list of barbers working there.
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "success": true,
          "data": { <ShopWithBarbers Object> }
        }
        ```
    *   `401 Unauthorized`: `ErrorResponse`
    *   `404 Not Found`: `ErrorResponse`

#### **`POST /shops/me/barbers`**
*   **Summary**: Add Barber to Shop
*   **Auth Required**: `ClerkAuth` (Barber JWT - Shop OWNER only)
*   **Description**: Adds a new barber to the shop. First 5 barbers are included in the base plan, then $3/month per additional barber.
*   **Request Body**:
    ```json
    {
      "barberName": "Jane Barber",
      "barberEmail": "jane@example.com",
      "barberPassword": "SecurePassword123"
    }
    ```
*   **Responses**:
    *   `201 Created`:
        ```json
        {
          "success": true,
          "data": { <Barber Object> }
        }
        ```
    *   `400 Bad Request`: `ErrorResponse`
    *   `401 Unauthorized`: `ErrorResponse`
    *   `403 Forbidden`: `ErrorResponse` (if caller is not OWNER)

#### **`GET /shops/{slug}`**
*   **Summary**: Get Shop by Slug
*   **Auth Required**: None (Public)
*   **Description**: Retrieves shop and barber details using the URL slug. Powering public customer-facing booking portals.
*   **Path Parameters**:
    *   `slug` (string, required): URL slug of the shop (e.g. `doe-barbershop`).
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "success": true,
          "data": { <ShopWithBarbers Object> }
        }
        ```
    *   `404 Not Found`: `ErrorResponse`

---

### 4.7. Subscriptions

#### **`POST /shops/me/subscribe`**
*   **Summary**: Start Subscription Checkout
*   **Auth Required**: `ClerkAuth` (Barber JWT - Shop OWNER only)
*   **Description**: Creates a Stripe Checkout Session for subscription signups. Plans: Monthly ($29/mo) or Yearly ($23/mo = $276/yr). The first subscription includes a 14-day free trial.
*   **Request Body**:
    ```json
    {
      "plan": "MONTHLY"
    }
    ```
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "success": true,
          "data": {
            "sessionUrl": "https://checkout.stripe.com/c/pay/cs_test_..."
          }
        }
        ```
    *   `401 Unauthorized`: `ErrorResponse`
    *   `403 Forbidden`: `ErrorResponse`
    *   `404 Not Found`: `ErrorResponse`

#### **`POST /shops/me/billing-portal`**
*   **Summary**: Open Billing Portal
*   **Auth Required**: `ClerkAuth` (Barber JWT - Shop OWNER only)
*   **Description**: Creates a Stripe Billing Customer Portal session URL. The owner can manage payments, plan upgrades/downgrades, or cancel.
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "success": true,
          "data": {
            "portalUrl": "https://billing.stripe.com/p/session/..."
          }
        }
        ```
    *   `401 Unauthorized`: `ErrorResponse`
    *   `403 Forbidden`: `ErrorResponse`
    *   `404 Not Found`: `ErrorResponse`

---

### 4.8. Statistics

#### **`GET /statistics/shop`**
*   **Summary**: Get Shop Statistics
*   **Auth Required**: `ClerkAuth` (Barber JWT - Shop OWNER only)
*   **Description**: Retrieves aggregated booking statistics for the entire shop.
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "success": true,
          "data": {
            "totalBookings": 120,
            "completedBookings": 100,
            "upcomingBookings": 15,
            "cancelledBookings": 5,
            "totalBarbers": 3
          }
        }
        ```
    *   `401 Unauthorized`: `ErrorResponse`
    *   `403 Forbidden`: `ErrorResponse`

#### **`GET /statistics/barber/{barberId}`**
*   **Summary**: Get Barber Statistics
*   **Auth Required**: `ClerkAuth` (Barber JWT)
*   **Description**: Retrieves booking statistics for a specific barber. Barbers can only retrieve their own stats. The shop `OWNER` can view stats for any barber in the shop.
*   **Path Parameters**:
    *   `barberId` (string, optional): The Clerk ID of the barber. Optional if a barber is fetching their own stats.
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "success": true,
          "data": {
            "totalBookings": 40,
            "completedBookings": 35,
            "upcomingBookings": 4,
            "cancelledBookings": 1
          }
        }
        ```
    *   `401 Unauthorized`: `ErrorResponse`
    *   `403 Forbidden`: `ErrorResponse`
