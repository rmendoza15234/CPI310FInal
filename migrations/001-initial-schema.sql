-- Up
CREATE TABLE Messages (
    id INTEGER PRIMARY KEY,
    authorId INTEGER,
    content STRING,
    FOREIGN KEY (authorId) REFERENCES Users (id)
);

CREATE TABLE Scores (
    id INTEGER PRIMARY KEY,
    playerId INTEGER,
    score STRING,
    FOREIGN KEY (playerId) REFERENCES Users (id)
);

CREATE TABLE Users (
    id INTEGER PRIMARY KEY,
    email STRING UNIQUE,
    username STRING,
    password STRING
);

CREATE TABLE AuthTokens (
    id INTEGER PRIMARY KEY,
    token STRING,
    userId INTEGER,
    FOREIGN KEY (userId) REFERENCES Users (id)
);

-- Down
DROP TABLE Messages;
DROP TABLE Scores;
DROP TABLE Users;
DROP TABLE AuthTokens;
