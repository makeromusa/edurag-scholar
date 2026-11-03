import urllib.request
import json
import time

BASE_URL = "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net"

print("1. Pinging /api/health...", flush=True)
for attempt in range(1, 10):
    try:
        res = urllib.request.urlopen(f"{BASE_URL}/api/health", timeout=30)
        data = json.loads(res.read())
        print(f"   SUCCESS (Attempt {attempt}):", data, flush=True)
        break
    except Exception as e:
        print(f"   Waiting for container warm-up (Attempt {attempt}): {e}", flush=True)
        time.sleep(5)

print("\n2. Testing /api/mock-exams/generate with authentic UON marks and calculus rigor...", flush=True)
try:
    req = urllib.request.Request(
        f"{BASE_URL}/api/mock-exams/generate",
        headers={"Content-Type": "application/json"},
        data=json.dumps({
            "unit_code": "SMA 2114",
            "difficulty": "Chiromo Standard (Balanced)",
            "exam_type": "Final University Exam (70 Marks)",
            "include_answers": True
        }).encode()
    )
    res = urllib.request.urlopen(req, timeout=90)
    data = json.loads(res.read().decode())
    exam_data = data.get("exam", {}).get("exam_data", {})
    print(f"   Exam Title: {exam_data.get('unit_code')} - {exam_data.get('unit_name')}", flush=True)
    print(f"   Instructions: {exam_data.get('instructions')}", flush=True)
    for q in exam_data.get("questions", []):
        print(f"\n   {q.get('question_number')} (Total: {q.get('total_marks')} Marks):", flush=True)
        for s in q.get("sub_questions", []):
            m = s.get("marks")
            t = (s.get("text") or "")[:60]
            print(f"     * {s.get('label')} [{m} Marks]: {t}...", flush=True)
except Exception as e:
    print(f"   Mock exam generation error: {e}", flush=True)
