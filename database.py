import sqlite3

class Database:
    def __init__(self, db_name='chat_history.db'):
        self.connection = sqlite3.connect(db_name)
        self.cursor = self.connection.cursor()
        self.create_tables()

    def create_tables(self):
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER,
                message TEXT NOT NULL,
                sender TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations (id)
            )
        ''')
        self.connection.commit()

    def add_conversation(self, user):
        self.cursor.execute('INSERT INTO conversations (user) VALUES (?)', (user,))
        self.connection.commit()

    def add_message(self, conversation_id, message, sender):
        self.cursor.execute('INSERT INTO messages (conversation_id, message, sender) VALUES (?, ?, ?)', 
                            (conversation_id, message, sender))
        self.connection.commit()

    def close(self):
        self.connection.close()