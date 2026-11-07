
-- 1. Insert passengers
INSERT INTO passengers (name, phone)
VALUES
('Rahul', '9876543210'),
('Anjali', '9876543211'),
('Arjun', '9876543212');


-- 2. Insert buses
INSERT INTO buses (bus_number, capacity)
VALUES
('TN01AB1234', 40),
('TN02CD5678', 35),
('TN03EF9012', 30);


-- 3. Insert routes
INSERT INTO routes (source, destination)
VALUES
('Chennai', 'Bangalore'),
('Chennai', 'Coimbatore'),
('Chennai', 'Madurai'),
('Bangalore', 'Chennai');


-- 4. Insert trips
INSERT INTO trips
(bus_id, route_id, travel_date, departure_time, fare)
VALUES
(1, 1, '2026-11-20', '08:00', 650),
(2, 2, '2026-11-20', '21:00', 900),
(3, 3, '2026-11-21', '07:30', 700),
(1, 4, '2026-11-22', '16:00', 650),
(2, 1, '2026-11-21', '08:00', 600);


-- 5. Insert sample bookings
INSERT INTO bookings
(passenger_id, trip_id, seat_number, status)
VALUES
(1, 1, 5, 'BOOKED'),
(2, 1, 6, 'BOOKED'),
(3, 2, 1, 'CANCELLED'),
(1, 3, 10, 'BOOKED');
