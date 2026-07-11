import psycopg
from config import config

conn = psycopg.connect(config.DATABASE_URL)
cur = conn.cursor()
cur.execute("SELECT thread_id, checkpoint FROM checkpoints ORDER BY thread_id DESC LIMIT 5;")
rows = cur.fetchall()
for r in rows:
    print(f"Thread: {r[0]}")
