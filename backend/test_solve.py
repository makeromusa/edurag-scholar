import urllib.request
import fitz

doc = fitz.open()
page = doc.new_page()
page.insert_text((50, 72), "SMA 2114: Differential and Integral Calculus\nQuestion 1: Evaluate the integral of x*exp(2x) dx using integration by parts.")
pdf_bytes = doc.tobytes()
doc.close()

boundary = "boundary123456789"
data = []
data.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"unit_code\"\r\n\r\nSMA 2114\r\n".encode("utf-8"))
data.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"test_paper.pdf\"\r\nContent-Type: application/pdf\r\n\r\n".encode("utf-8"))
data.append(pdf_bytes)
data.append(f"\r\n--{boundary}--\r\n".encode("utf-8"))
payload = b"".join(data)

req = urllib.request.Request(
    "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net/api/v1/exams/solve-paper",
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    data=payload
)

try:
    print("Sending request to /api/v1/exams/solve-paper...")
    res = urllib.request.urlopen(req, timeout=90)
    out = res.read()
    print("STATUS:", res.status, "Content-Type:", res.headers.get("Content-Type"), "Bytes:", len(out))
    with open("solved_output_test.pdf", "wb") as f:
        f.write(out)
    print("Wrote solved_output_test.pdf successfully!")
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code, e.read().decode())
except Exception as e:
    print("ERROR:", e)
