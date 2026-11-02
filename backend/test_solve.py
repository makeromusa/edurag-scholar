import urllib.request
import fitz
import sys

print("1. Creating test PDF...", flush=True)
doc = fitz.open()
page = doc.new_page()
page.insert_text((50, 72), "SMA 2114: Differential and Integral Calculus\nQuestion 1 (8 Marks):\nEvaluate the integral of x * exp(2x) dx using integration by parts. Show all working clearly.")
test_bytes = doc.tobytes()
doc.close()

boundary = "boundary123456789"
data = []
data.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"unit_code\"\r\n\r\nSMA 2114\r\n".encode("utf-8"))
data.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"Calculus_Q1.pdf\"\r\nContent-Type: application/pdf\r\n\r\n".encode("utf-8"))
data.append(test_bytes)
data.append(f"\r\n--{boundary}--\r\n".encode("utf-8"))
payload = b"".join(data)

req = urllib.request.Request(
    "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net/api/v1/exams/solve-paper",
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    data=payload
)

try:
    print("2. Calling live /api/v1/exams/solve-paper on Azure...", flush=True)
    res = urllib.request.urlopen(req, timeout=60)
    out = res.read()
    print("3. SUCCESS! STATUS:", res.status, "Content-Type:", res.headers.get("Content-Type"), "Bytes:", len(out), flush=True)
    with open("solved_camscanner_output.pdf", "wb") as f:
        f.write(out)
    print("4. Wrote solved_camscanner_output.pdf successfully!", flush=True)
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code, e.read().decode(), flush=True)
except Exception as e:
    print("ERROR:", e, flush=True)
