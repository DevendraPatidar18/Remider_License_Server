-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR UNIQUE NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  password_hash TEXT, -- nullable: OTP-only users won't have a password
  user_name VARCHAR(255),
  role VARCHAR(20) CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  status VARCHAR(20) CHECK (status IN ('active', 'blocked')) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Devices Table
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_fingerprint TEXT UNIQUE NOT NULL,
  model TEXT,
  android_version TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- License Requests Table
CREATE TABLE IF NOT EXISTS license_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP
);

-- Licenses Table
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  license_key TEXT UNIQUE NOT NULL,
  signed_payload TEXT NOT NULL,
  status VARCHAR(20) CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  transfer_count INT DEFAULT 0
);

-- License Transfers Table
CREATE TABLE IF NOT EXISTS license_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  old_device_id UUID REFERENCES devices(id),
  new_device_id UUID REFERENCES devices(id),
  status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP
);

-- Applications Table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  version VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OTP Codes Table (for email OTP login)
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);
