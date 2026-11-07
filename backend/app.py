
import os
import psycopg2
from flask import Flask, render_template, request, redirect, url_for, flash
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "local-demo-only")


# Database connection
def get_db():
    if os.getenv("DATABASE_URL"):
        return psycopg2.connect(os.getenv("DATABASE_URL"))

    return psycopg2.connect(
        host="localhost",
        database="RouteMate",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )


# Home page - Search buses
@app.route("/")
def home():
    trips = []
    searched = request.args.get("search") == "1"

    source = request.args.get("source", "").strip()
    destination = request.args.get("destination", "").strip()
    travel_date = request.args.get("date", "")

    if searched:
        if source and destination and travel_date:
            conn = get_db()
            cur = conn.cursor()

            cur.execute("""
                SELECT t.trip_id, b.bus_number, b.capacity,
                       r.source, r.destination, t.travel_date,
                       t.departure_time, t.fare
                FROM trips t
                JOIN buses b ON t.bus_id = b.bus_id
                JOIN routes r ON t.route_id = r.route_id
                WHERE LOWER(r.source) = LOWER(%s)
                  AND LOWER(r.destination) = LOWER(%s)
                  AND t.travel_date = %s
                  AND t.travel_date >= CURRENT_DATE
                ORDER BY t.departure_time
            """, (source, destination, travel_date))

            trips = cur.fetchall()
            cur.close()
            conn.close()
        else:
            flash("Please fill in all search fields.")

    return render_template("index.html",
                           trips=trips,
                           searched=searched,
                           source=source,
                           destination=destination,
                           travel_date=travel_date)


# Book ticket page
@app.route("/book/<int:trip_id>", methods=["GET", "POST"])
def book(trip_id):
    conn = get_db()
    cur = conn.cursor()
    success = False

    try:
        cur.execute("""
            SELECT t.trip_id, b.bus_number, b.capacity,
                   r.source, r.destination, t.travel_date,
                   t.departure_time, t.fare
            FROM trips t
            JOIN buses b ON t.bus_id = b.bus_id
            JOIN routes r ON t.route_id = r.route_id
            WHERE t.trip_id = %s
              AND t.travel_date >= CURRENT_DATE
        """, (trip_id,))

        trip = cur.fetchone()

        if not trip:
            flash("Bus trip not found.")
            return redirect(url_for("home"))

        if request.method == "POST":
            name = request.form.get("name", "").strip()
            phone = request.form.get("phone", "").strip()
            email = request.form.get("email", "").strip() or None
            seat = request.form.get("seat_number", type=int)

            if (not name or not phone or not seat
                    or seat < 1 or seat > trip[2]):
                flash("Please enter valid booking details.")
            else:
                try:
                    cur.execute("""
                        INSERT INTO passengers (name, phone, email)
                        VALUES (%s, %s, %s)
                        RETURNING passenger_id
                    """, (name, phone, email))

                    passenger_id = cur.fetchone()[0]

                    cur.execute("""
                        INSERT INTO bookings
                        (passenger_id, trip_id, seat_number)
                        VALUES (%s, %s, %s)
                    """, (passenger_id, trip_id, seat))

                    conn.commit()
                    success = True

                except psycopg2.errors.UniqueViolation:
                    conn.rollback()
                    flash("Seat already booked!")

        cur.execute("""
            SELECT seat_number FROM bookings
            WHERE trip_id = %s AND status = 'BOOKED'
            ORDER BY seat_number
        """, (trip_id,))

        booked_seats = [row[0] for row in cur.fetchall()]

    finally:
        cur.close()
        conn.close()

    if success:
        flash("Ticket booked successfully!")
        return redirect(url_for("my_bookings"))

    return render_template("book.html",
                           trip=trip,
                           booked_seats=booked_seats)


# My Bookings page
@app.route("/my-bookings", methods=["GET", "POST"])
def my_bookings():
    bookings = []
    name = request.form.get("name", "").strip()
    contact = request.form.get("contact", "").strip()
    searched = False

    if request.method == "POST":
        if name and contact:
            searched = True

            conn = get_db()
            cur = conn.cursor()

            try:
                # Cancel a booking if requested
                if request.form.get("action") == "cancel":
                    booking_id = request.form.get(
                        "booking_id", type=int
                    )

                    cur.execute("""
                        UPDATE bookings
                        SET status = 'CANCELLED'
                        WHERE booking_id = %s
                          AND status = 'BOOKED'
                          AND passenger_id IN (
                              SELECT passenger_id
                              FROM passengers
                              WHERE LOWER(name) = LOWER(%s)
                                AND (
                                    phone = %s
                                    OR LOWER(email) = LOWER(%s)
                                )
                          )
                    """, (booking_id, name, contact, contact))

                    cancelled = cur.rowcount
                    conn.commit()

                    if cancelled:
                        flash("Booking cancelled successfully!")
                    else:
                        flash("Booking could not be cancelled.")

                # View bookings
                cur.execute("""
                    SELECT bk.booking_id, p.name, b.bus_number,
                           r.source, r.destination, t.travel_date,
                           bk.seat_number, bk.status
                    FROM bookings bk
                    JOIN passengers p
                        ON bk.passenger_id = p.passenger_id
                    JOIN trips t ON bk.trip_id = t.trip_id
                    JOIN buses b ON t.bus_id = b.bus_id
                    JOIN routes r ON t.route_id = r.route_id
                    WHERE LOWER(p.name) = LOWER(%s)
                      AND (
                          p.phone = %s
                          OR LOWER(p.email) = LOWER(%s)
                      )
                    ORDER BY bk.booking_id DESC
                """, (name, contact, contact))

                bookings = cur.fetchall()

            finally:
                cur.close()
                conn.close()
        else:
            flash("Please enter your name and phone or email.")

    return render_template("my_bookings.html",
                           bookings=bookings,
                           name=name,
                           contact=contact,
                           searched=searched)


if __name__ == "__main__":
    app.run(debug=False)