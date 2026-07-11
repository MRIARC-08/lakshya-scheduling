import os
import re

def extract_files(md_file_path):
    with open(md_file_path, 'r') as f:
        content = f.read()
    
    # Match headers like `### `filename`` or `### Updated `filename``
    # Followed by ```python ... ```
    pattern = re.compile(r'###\s+(?:Updated\s+)?(?:Full\s+)?(?:Neon Version\s+)?(?:Postgres Checkpointer\s+)?`([^`]+)`.*?\n.*?```(?:python|txt|bash)?\n(.*?)```', re.DOTALL)
    
    matches = pattern.findall(content)
    for filename, code in matches:
        if filename in ["requirements.txt", ".env", "config.py", "database/db_manager.py"]:
            continue
        if not filename.endswith('.py') and not filename.endswith('.txt'):
            continue
        print(f"Creating {filename}")
        os.makedirs(os.path.dirname(filename) or '.', exist_ok=True)
        with open(filename, 'w') as out_f:
            out_f.write(code.strip() + '\n')

extract_files('../../Phase 2: Python Agent (FastAPI + LangGraph).md')
extract_files('../../pythonagent_with_neon_db.md')
