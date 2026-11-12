"""
Post-deploy verification suite for EduRAG Scholar.
Tests all previously-500 endpoints to confirm all fixes are live.
"""
import asyncio
import httpx
import json
import sys

BASE = "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net"
TIMEOUT = 60

results = []

def log(emoji, label, status, detail=""):
    line = f"{emoji} [{status}] {label}"
    if detail:
        line += f" — {detail}"
    print(line)
    results.append((emoji, label, status, detail))

async def run():
    async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as c:
        # 1. Health
        try:
            r = await c.get(f"{BASE}/api/health")
            log("✅" if r.status_code == 200 else "❌", "GET /api/health", r.status_code)
        except Exception as e:
            log("❌", "GET /api/health", "ERR", str(e))

        # 2. Units
        try:
            r = await c.get(f"{BASE}/api/units")
            log("✅" if r.status_code == 200 else "❌", "GET /api/units", r.status_code)
        except Exception as e:
            log("❌", "GET /api/units", "ERR", str(e))

        # 3. Documents
        try:
            r = await c.get(f"{BASE}/api/documents")
            data = r.json()
            docs = data.get("data", data.get("documents", []))
            doc_id = docs[0].get("id") if docs else None
            log("✅" if r.status_code == 200 else "❌", "GET /api/documents", r.status_code, f"{len(docs)} docs")
        except Exception as e:
            log("❌", "GET /api/documents", "ERR", str(e))
            doc_id = None

        # 4. Chat (was 500 due to SlowAPI)
        try:
            r = await c.post(f"{BASE}/api/chat", json={
                "query": "What is virtual memory?",
                "unit_code": "SCS 3207",
                "conversation_id": "deploy-test-001"
            })
            detail = ""
            try:
                detail = r.json().get("answer", r.text[:80])
            except Exception:
                detail = r.text[:80]
            log("✅" if r.status_code == 200 else "❌", "POST /api/chat", r.status_code, detail[:100])
        except Exception as e:
            log("❌", "POST /api/chat", "ERR", str(e))

        # 5. Flashcards (was 500 due to SlowAPI)
        try:
            r = await c.post(f"{BASE}/api/flashcards/generate", json={
                "unit_code": "SCS 3207",
                "topic": "Virtual Memory",
                "num_cards": 3
            })
            log("✅" if r.status_code == 200 else "❌", "POST /api/flashcards/generate", r.status_code)
        except Exception as e:
            log("❌", "POST /api/flashcards/generate", "ERR", str(e))

        # 6. Past papers analyze (was 500 due to SlowAPI)
        try:
            r = await c.post(f"{BASE}/api/past-papers/analyze", json={
                "unit_code": "SCS 3207",
                "year": "2023"
            })
            log("✅" if r.status_code == 200 else "❌", "POST /api/past-papers/analyze", r.status_code)
        except Exception as e:
            log("❌", "POST /api/past-papers/analyze", "ERR", str(e))

        # 7. Mock exam generate
        exam_id = None
        try:
            r = await c.post(f"{BASE}/api/mock-exams/generate", json={
                "unit_code": "SCS 3207",
                "difficulty": "medium",
                "num_questions": 3
            })
            if r.status_code == 200:
                res_data = r.json()
                exam_id = (
                    res_data.get("exam", {}).get("_id")
                    or res_data.get("exam_id")
                    or res_data.get("data", {}).get("exam_id")
                )
            log("✅" if r.status_code == 200 else "❌", "POST /api/mock-exams/generate", r.status_code, f"exam_id={exam_id}")
        except Exception as e:
            log("❌", "POST /api/mock-exams/generate", "ERR", str(e))

        # 8. Mock exam evaluate (was 500 due to ObjectId mismatch)
        if exam_id:
            try:
                r = await c.post(f"{BASE}/api/mock-exams/evaluate", json={
                    "exam_id": exam_id,
                    "answers": {"q1": "Virtual memory allows processes to use more memory than physically available."}
                })
                log("✅" if r.status_code == 200 else "❌", "POST /api/mock-exams/evaluate", r.status_code)
            except Exception as e:
                log("❌", "POST /api/mock-exams/evaluate", "ERR", str(e))
        else:
            log("⚠️", "POST /api/mock-exams/evaluate", "SKIP", "no exam_id from generate")

        # 9. Exam simulate (v1)
        sim_id = None
        try:
            r = await c.post(f"{BASE}/api/v1/exams/simulate", json={
                "unit_code": "SCS 3207",
                "difficulty": "medium",
                "question_count": 3
            })
            if r.status_code in (200, 202):
                sim_id = r.json().get("exam_id") or r.json().get("simulation_id")
            log("✅" if r.status_code in (200, 202) else "❌", "POST /api/v1/exams/simulate", r.status_code, f"sim_id={sim_id}")
        except Exception as e:
            log("❌", "POST /api/v1/exams/simulate", "ERR", str(e))

        # 10. Professor syllabus (requires doc_id)
        if doc_id:
            try:
                r = await c.get(f"{BASE}/api/professor/document/{doc_id}/syllabus")
                log("✅" if r.status_code == 200 else "❌", f"GET /professor/document/{{id}}/syllabus", r.status_code)
            except Exception as e:
                log("❌", "GET /professor/document/{id}/syllabus", "ERR", str(e))

            # 11. slide/{N} — existing route
            try:
                r = await c.get(f"{BASE}/api/professor/document/{doc_id}/slide/1")
                log("✅" if r.status_code == 200 else "❌", "GET /professor/document/{id}/slide/1", r.status_code)
            except Exception as e:
                log("❌", "GET /professor/document/{id}/slide/1", "ERR", str(e))

            # 12. slide-raw?page_number=1 — NEW compat route (was 404)
            try:
                r = await c.get(f"{BASE}/api/professor/document/{doc_id}/slide-raw?page_number=1")
                log("✅" if r.status_code == 200 else "❌", "GET /professor/document/{id}/slide-raw?page_number=1 [NEW]", r.status_code)
            except Exception as e:
                log("❌", "GET /professor/document/{id}/slide-raw?page_number=1 [NEW]", "ERR", str(e))

        else:
            log("⚠️", "Professor routes", "SKIP", "no doc_id available")

        # Summary
        print("\n" + "="*60)
        print("SUMMARY")
        print("="*60)
        passed = sum(1 for e, _, s, _ in results if e == "✅")
        failed = sum(1 for e, _, s, _ in results if e == "❌")
        skipped = sum(1 for e, _, s, _ in results if e == "⚠️")
        print(f"✅ Passed: {passed}  ❌ Failed: {failed}  ⚠️ Skipped: {skipped}")
        print("="*60)

        if failed > 0:
            print("\nFAILED ENDPOINTS:")
            for e, label, status, detail in results:
                if e == "❌":
                    print(f"  ❌ {label} [{status}] {detail}")
            sys.exit(1)
        else:
            print("\n🎉 ALL ENDPOINTS PASSED!")

asyncio.run(run())
