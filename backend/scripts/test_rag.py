import requests

url = 'http://127.0.0.1:8000/chat/rag'
payload = {
    'url': 'http://arxiv.org/pdf/2510.20818v1.pdf',
    'question': 'Summarize the main contribution in one sentence',
    'chunk_size': 3000,
    'chunk_overlap': 300,
    'rebuild_index': False,
    'k': 4
}

try:
    r = requests.post(url, json=payload, timeout=120)
    print('Status:', r.status_code)
    try:
        print('JSON:', r.json())
    except Exception:
        print('Response text:', r.text)
except Exception as e:
    print('Request failed:', e)
