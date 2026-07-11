import psycopg2
import os
from config import config
from dotenv import load_dotenv

load_dotenv()

# We might need to manually get the DB url if config fails to load without fastAPI context
url = os.environ.get("DATABASE_URL_POOLED", config.DATABASE_URL_POOLED if hasattr(config, "DATABASE_URL_POOLED") else None)

if not url:
    print("No database url found")
    exit(1)

conn = psycopg2.connect(url)
cur = conn.cursor()
try:
    cur.execute("TRUNCATE checkpoints CASCADE;")
    cur.execute("TRUNCATE checkpoint_blobs CASCADE;")
    cur.execute("TRUNCATE checkpoint_writes CASCADE;")
    conn.commit()
    print("✅ All LangGraph memory cleared!")
except Exception as e:
    print(f"Error: {e}")
finally:
    cur.close()
    conn.close()
