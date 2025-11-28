Room Service Documentation
==========================

The **Room Service** manages meeting rooms, their availability,
status updates, and advanced searching. It also exposes internal
endpoints for other services.

.. contents::
   :depth: 2
   :local:

Overview
--------

This microservice handles:

- Adding rooms
- Updating room information
- Deleting rooms (admin only)
- Searching rooms by filters
- Caching for performance optimization
- Internal APIs used by Bookings Service

Technology Stack
----------------

- Node.js, Express
- MongoDB / Mongoose
- In-memory Caching
- Internal service authorization

Endpoints
---------

Add Room (Admin/Manager)
~~~~~~~~~~~~~~~~~~~~~~~~

**POST /api/v1/rooms**

Adds a new meeting room.

**Request Example**

.. code-block:: json

    {
        "roomID": "OXY-1",
        "name": "OXY 1",
        "capacity": 20,
        "equipment": ["Projector", "Whiteboard"],
        "location": "OXY Building"
    }

Get All Rooms
~~~~~~~~~~~~~

**GET /api/v1/rooms**

Returns the list of all rooms.  
Cache is used to reduce DB load.

**Response**

.. code-block:: json

    {
        "success": true,
        "source": "cache",
        "rooms": [ ... ]
    }


Get Room by ID
~~~~~~~~~~~~~~

**GET /api/v1/rooms/:id**


Search Rooms
~~~~~~~~~~~~

**GET /api/v1/rooms/search**

Supported filters:

- capacity >= X  
- location  
- equipment (comma-separated)  
- status  

Example:

Change Room Status (Admin/Manager)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**PATCH /api/v1/rooms/:id/status**

Used by Bookings Service.

Internal API — Check Room Exists
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**GET /api/v1/rooms/internal/:roomID**

Used internally for service-to-service validation.

**Response Example**

.. code-block:: json

    {
        "success": true,
        "exists": true,
        "room": { ... }
    }
