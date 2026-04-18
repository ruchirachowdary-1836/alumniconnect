from pathlib import Path
import sqlite3


ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "prisma" / "dev.db"


def main() -> None:
    DB_PATH.unlink(missing_ok=True)
    connection = sqlite3.connect(DB_PATH)
    cursor = connection.cursor()

    cursor.executescript(
        """
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
            acceptedGuidelines BOOLEAN NOT NULL DEFAULT 0,
            isMentorActive BOOLEAN NOT NULL DEFAULT 0
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
        """
    )

    connection.commit()
    connection.close()
    print(f"Initialized SQLite database at {DB_PATH}")


if __name__ == "__main__":
    main()
