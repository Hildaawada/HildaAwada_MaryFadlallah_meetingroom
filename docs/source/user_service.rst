User Service Documentation
==========================

The **User Service** handles all user-related operations including
registration, authentication, account management, and retrieving
booking history from the Bookings Service.

.. contents::
   :depth: 2
   :local:

Overview
--------

This microservice includes:

- User registration  
- Secure password hashing  
- Login & JWT authentication  
- Fetching all users (Admin only)  
- Updating user profiles  
- Deleting users  
- Retrieving booking history via inter-service communication  

Technology Stack
----------------

- **Node.js / Express**
- **MongoDB / Mongoose**
- **JWT Authentication**
- **Axios (service-to-service communication)**

Endpoints
---------

Register User
~~~~~~~~~~~~~

**POST /api/v1/users/register**

Registers a new user.

**Request Body**

=================  =========  ===============================
Field              Type        Description
=================  =========  ===============================
name               String      Full name of the user
username           String      Unique username
email              String      Email address
password           String      Raw password (hashed internally)
role               String      Optional (user/admin/manager)
=================  =========  ===============================

**Response Example**

.. code-block:: json

    {
        "success": true,
        "message": "User registered successfully",
        "user": {
            "name": "Mary",
            "username": "mary_fad",
            "email": "mary@gmail.com",
            "role": "user"
        }
    }


Login User
~~~~~~~~~~

**POST /api/v1/users/login**

Authenticates a user and returns a JWT token.

**Response Example**

.. code-block:: json

    {
        "success": true,
        "message": "Login successful",
        "token": "eyJhbGciOiJIUzI1NiIsInR...",
        "role": "admin"
    }


Get All Users (Admin)
~~~~~~~~~~~~~~~~~~~~~

**GET /api/v1/users**

Returns a list of all registered users.  
Requires admin privileges.

Get Single User
~~~~~~~~~~~~~~~

**GET /api/v1/users/:username**

Fetches details about a specific user.


Update User Profile
~~~~~~~~~~~~~~~~~~~

**PUT /api/v1/users/:username**

Updates a user's profile.  
Passwords are automatically hashed when updated.

Delete User
~~~~~~~~~~~

**DELETE /api/v1/users/:username**

Removes a user account permanently.


Get User Booking History
~~~~~~~~~~~~~~~~~~~~~~~~

**GET /api/v1/users/history/:username**

Fetches booking history from Bookings Service using Axios.

**Response Example**

.. code-block:: json

    {
        "username": "mary_fad",
        "bookings": [ ... ]
    }
