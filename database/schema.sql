
-- 1. Passenger table
CREATE TABLE passengers (
    passenger_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL
);

-- 2. Bus table
CREATE TABLE buses (
    bus_id SERIAL PRIMARY KEY,
    bus_number VARCHAR(20) UNIQUE NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0)
);

-- 3. Route table
CREATE TABLE routes (
    route_id SERIAL PRIMARY KEY,
    source VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL
);

-- 4. Trip table
CREATE TABLE trips (
    trip_id SERIAL PRIMARY KEY,
    bus_id INT REFERENCES buses(bus_id),
    route_id INT REFERENCES routes(route_id),
    travel_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    fare DECIMAL(8,2) NOT NULL CHECK (fare > 0)
);

-- 5. Booking table
CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    passenger_id INT REFERENCES passengers(passenger_id),
    trip_id INT REFERENCES trips(trip_id),
    seat_number INT NOT NULL CHECK (seat_number > 0),
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'BOOKED'
        CHECK (status IN ('BOOKED', 'CANCELLED'))
);

-- Prevent double booking of active seats
CREATE UNIQUE INDEX unique_booked_seat
ON bookings(trip_id, seat_number)
WHERE status = 'BOOKED';