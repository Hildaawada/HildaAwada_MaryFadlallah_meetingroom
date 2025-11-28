Review Service Documentation
============================

The **Review Service** manages room reviews, moderation, flagging,
hiding, and rating analytics. It also validates rooms through
inter-service communication.

.. contents::
   :depth: 2
   :local:

Overview
--------

This microservice supports:

- Submitting room reviews
- Updating personal reviews
- Deleting personal reviews
- Admin deletion
- Flagging inappropriate reviews
- Hiding and un-hiding reviews
- Fetching room rating summary (average score)

Technology Stack
----------------

- Node.js / Express
- MongoDB / Mongoose
- Axios (used for verifying room existence)
- Moderation logic

Endpoints
---------

Submit Review
~~~~~~~~~~~~~

**POST /api/v1/review**

Validates room existence via Room Service before submission.

Request Example:

.. code-block:: json

    {
        "roomID": "OXY-1",
        "rating": 5,
        "comment": "Very clean and well equipped!"
    }

Get My Reviews
~~~~~~~~~~~~~~

**GET /api/v1/review/me**

Returns all reviews submitted by the logged user.

Update My Review
~~~~~~~~~~~~~~~~

**PUT /api/v1/review/:reviewID**

Update rating and/or comment.

Delete My Review
~~~~~~~~~~~~~~~~

**DELETE /api/v1/review/:reviewID**

Deletes a personal review.


Get Room Reviews
~~~~~~~~~~~~~~~~

**GET /api/v1/review/room/:roomID**

Normal users see only unhidden reviews.  
Admins, auditors, moderators see **all** reviews.

Flag Review
~~~~~~~~~~~

**POST /api/v1/review/:reviewID/flag**

Marks a review as inappropriate.

Hide Review
~~~~~~~~~~~

**POST /api/v1/review/:reviewID/hide**

Makes a review invisible to regular users.

Unhide Review
~~~~~~~~~~~~~

**POST /api/v1/review/:reviewID/unhide**

Undo hiding.

Get Flagged Reviews
~~~~~~~~~~~~~~~~~~~

**GET /api/v1/review/flagged**

Used for moderation dashboards.

Internal Rating Summary
~~~~~~~~~~~~~~~~~~~~~~~

**GET /api/v1/review/internal/:roomID**

Returns:

- number of reviews  
- average rating  
- list of visible reviews  

Example Response:

.. code-block:: json

    {
        "roomID": "OXY-1",
        "x": 4,
        "averageRating": 4.5,
        "reviews": [ ... ]
    }
