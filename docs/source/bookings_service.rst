Bookings Service Documentation
==============================

The **Bookings Service** manages reservation scheduling, blocking
rooms, cancellation logic, date conflict detection, and synchronization
with the Room Service for live status updates.

.. contents::
   :depth: 2
   :local:

Overview
--------

This service provides:

- Standard bookings
- Updating and cancelling bookings
- Checking room availability
- Blocking rooms (admin/manager)
- Automatically updating room status
- Circuit breaker for Room Service communication
- Internal APIs for cross-service queries

Technology Stack
----------------

- Node.js / Express
- MongoDB / Mongoose
- Axios + Circuit Breaker Pattern
- Inter-service authenticated requests

Endpoints
---------

Create Booking
~~~~~~~~~~~~~~

**POST /api/v1/bookings**

Validates:

- Room exists (via Room Service)
- Date format
- No time overlap

Example Request:

.. code-block:: json

    {
        "roomID": "OXY-1",
        "checkin": "2026-01-10T10:00:00Z",
        "checkout": "2026-01-10T12:00:00Z"
    }

Cancel My Booking
~~~~~~~~~~~~~~~~~

**DELETE /api/v1/bookings/:bookingID**

User-specific cancellation.

Admin Cancel Booking
~~~~~~~~~~~~~~~~~~~~

**DELETE /api/v1/bookings/admin/:bookingID**

Forced cancellation + room status update.

Block Room (Admin/Manager)
~~~~~~~~~~~~~~~~~~~~~~~~~~

**POST /api/v1/bookings/admin/block-room**

Used to mark a room unavailable.

Example:

.. code-block:: json

    {
        "roomID": "OXY-1",
        "checkin": "2026-03-10T10:00:00Z",
        "checkout": "2026-03-10T13:00:00Z",
        "blockReason": "Maintenance"
    }

Unblock Room
~~~~~~~~~~~~

**DELETE /api/v1/bookings/admin/block-room/:blockID**


Check Availability
~~~~~~~~~~~~~~~~~~

**GET /api/v1/bookings/availability?roomID=...**

Returns:

.. code-block:: json

    {
        "roomID": "OXY-1",
        "available": true
    }


Get All Bookings
~~~~~~~~~~~~~~~~

**GET /api/v1/bookings**

Admins only.

Internal — Get Bookings by User
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**GET /api/v1/bookings/history/user/:username**

Used by User Service.

Internal — Get Bookings by Room
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**GET /api/v1/bookings/rooms/:roomID**
