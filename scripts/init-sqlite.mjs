import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "..", "prisma", "dev.db");

fs.rmSync(dbPath, { force: true });

const database = new DatabaseSync(dbPath);

database.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS UserProfile (
    id TEXT PRIMARY KEY,
    clerkUserId TEXT UNIQUE,
    email TEXT UNIQUE,
    role TEXT NOT NULL,
    fullName TEXT NOT NULL,
    rollNumber TEXT NOT NULL UNIQUE,
    batchYear INTEGER,
    branch TEXT,
    company TEXT,
    packageLpa REAL,
    drivesAttended INTEGER,
    backlogs TEXT,
    internship TEXT,
    mentorAreas TEXT,
    bio TEXT,
    acceptedGuidelines INTEGER NOT NULL DEFAULT 0,
    isMentorActive INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS MentorshipRequest (
    id TEXT PRIMARY KEY,
    studentId TEXT NOT NULL,
    alumniId TEXT NOT NULL,
    subject TEXT NOT NULL,
    goals TEXT NOT NULL,
    message TEXT NOT NULL,
    preferredMode TEXT NOT NULL,
    availability TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    alumniResponseMessage TEXT,
    FOREIGN KEY (studentId) REFERENCES UserProfile(id) ON DELETE CASCADE,
    FOREIGN KEY (alumniId) REFERENCES UserProfile(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS MentorshipRequest_studentId_status_idx
    ON MentorshipRequest(studentId, status);

  CREATE INDEX IF NOT EXISTS MentorshipRequest_alumniId_status_idx
    ON MentorshipRequest(alumniId, status);
`);

database.close();

console.log(`Initialized SQLite database at ${dbPath}`);
