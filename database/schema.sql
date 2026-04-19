CREATE DATABASE pillway;
USE pillway;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  password VARCHAR(255)
);

CREATE TABLE requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  service_type VARCHAR(50),
  pharmacy_name VARCHAR(255),
  address VARCHAR(255),
  lat DECIMAL(10,6),
  lng DECIMAL(10,6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO users (name, email, password) VALUES ('Test User','test@test.com', 'hashed_password');
INSERT INTO requests (user_id, service_type, pharmacy_name, address, lat, lng)
VALUES
(23, 'transfer', 'Shoppers Drug Mart', 'cxxxxx', x, y);
