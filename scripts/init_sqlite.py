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
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (studentId) REFERENCES UserProfile(id) ON DELETE CASCADE,
            FOREIGN KEY (alumniId) REFERENCES UserProfile(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS ForumPost (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'General',
            authorId TEXT NOT NULL,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (authorId) REFERENCES UserProfile(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS ForumReply (
            id TEXT PRIMARY KEY,
            postId TEXT NOT NULL,
            authorId TEXT NOT NULL,
            content TEXT NOT NULL,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (postId) REFERENCES ForumPost(id) ON DELETE CASCADE,
            FOREIGN KEY (authorId) REFERENCES UserProfile(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS Event (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            eventType TEXT NOT NULL DEFAULT 'Online',
            location TEXT,
            eventDate DATETIME NOT NULL,
            link TEXT,
            createdById TEXT NOT NULL,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (createdById) REFERENCES UserProfile(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS ChatMessage (
            id TEXT PRIMARY KEY,
            senderId TEXT NOT NULL,
            receiverId TEXT NOT NULL,
            content TEXT NOT NULL,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (senderId) REFERENCES UserProfile(id) ON DELETE CASCADE,
            FOREIGN KEY (receiverId) REFERENCES UserProfile(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS MentorshipRequest_studentId_status_idx
            ON MentorshipRequest(studentId, status);

        CREATE INDEX IF NOT EXISTS MentorshipRequest_alumniId_status_idx
            ON MentorshipRequest(alumniId, status);

        CREATE INDEX IF NOT EXISTS ForumPost_category_createdAt_idx
            ON ForumPost(category, createdAt);

        CREATE INDEX IF NOT EXISTS ForumReply_postId_createdAt_idx
            ON ForumReply(postId, createdAt);

        CREATE INDEX IF NOT EXISTS Event_eventDate_idx
            ON Event(eventDate);

        CREATE INDEX IF NOT EXISTS ChatMessage_senderId_receiverId_createdAt_idx
            ON ChatMessage(senderId, receiverId, createdAt);

        CREATE INDEX IF NOT EXISTS ChatMessage_receiverId_senderId_createdAt_idx
            ON ChatMessage(receiverId, senderId, createdAt);
        """
    )

    connection.commit()
    connection.close()
    print(f"Initialized SQLite database at {DB_PATH}")


if __name__ == "__main__":
    main()
