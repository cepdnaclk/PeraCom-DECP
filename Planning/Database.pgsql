-- USERS TABLE
CREATE TYPE user_role AS ENUM ('ADMIN', 'STUDENT', 'ALUMNI');

CREATE TABLE users (
  id UUID PRIMARY KEY,
  reg_number VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  google_id VARCHAR(255) UNIQUE,
  first_name VARCHAR(50) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(50) NOT NULL,
  residence VARCHAR(255),
  role user_role NOT NULL,
  profile_pic TEXT,
  header_img TEXT,
  headline VARCHAR(255),
  bio VARCHAR(1000),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);


-- SOCIAL LINKS TABLE
CREATE TYPE social_platform AS ENUM (
  'LinkedIn', 
  'GitHub', 
  'Portfolio', 
  'Personal', 
  'Facebook', 
  'Twitter', 
  'ResearchGate', 
  'Other'
);

CREATE TABLE social_links (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform social_platform NOT NULL,
  url TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_social_links_user_id ON social_links(user_id);


-- PROJECTS TABLE
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  start_date DATE,
  end_date DATE,
  description TEXT,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_user ON projects(user_id);


-- EXPERIENCE TABLE
CREATE TYPE employment_type AS ENUM ('Full-time', 'Part-time', 'Internship', 'Freelance', 'Contract', 'Other');

CREATE TABLE experiences (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  emp_type employment_type NOT NULL,
  company VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  location VARCHAR(255),
  description TEXT,

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_experiences_user ON experiences(user_id);


-- EDUCATION TABLE
CREATE TABLE educations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  institution VARCHAR(255) NOT NULL,
  degree VARCHAR(255),
  field_of_study VARCHAR(255),
  start_date DATE,
  end_date DATE,
  grade VARCHAR(80),

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_educations_user ON educations(user_id);


-- PUBLICATIONS TABLE
CREATE TABLE publications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  journal VARCHAR(255),
  published_date DATE,
  link TEXT,

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_publications_user ON publications(user_id);