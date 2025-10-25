sqlite3 "$DB_FILE" <<SQL
DROP TABLE IF EXISTS qbits;
CREATE TABLE qbits (
    hash TEXT PRIMARY KEY,
    token TEXT NOT NULL,
    agent TEXT,
    model TEXT,
    layer INTEGER,
    corner INTEGER,
    strain INTEGER,
    sector INTEGER,
    amplitude REAL,
    phase REAL,
    ts TEXT
);
SQL
