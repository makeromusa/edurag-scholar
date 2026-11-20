import logging
from datetime import datetime, timezone
import pytz
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from app.core.config import settings
from app.core.database import get_supabase_admin_client
from app.core.mongodb import get_briefing_archives_collection
from app.agents.rag_router import rag_router

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()

# Cache to prevent LLM rate limit exhaustion when multiple scholars request briefings
_DAILY_BRIEFING_CACHE: dict = {}


def _build_html_email(briefing_markdown: str, date_str: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #040711; color: #e2e8f0; margin: 0; padding: 24px; }}
        .container {{ max-width: 680px; margin: 0 auto; background-color: #090d19; border: 1px solid #1e293b; border-radius: 12px; padding: 32px; }}
        .header {{ border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 24px; }}
        .brand {{ font-size: 13px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; }}
        h1 {{ font-size: 24px; font-weight: 800; color: #ffffff; margin-top: 8px; margin-bottom: 0; }}
        .date {{ font-size: 13px; color: #94a3b8; margin-top: 4px; }}
        .content {{ font-size: 14px; line-height: 1.7; color: #cbd5e1; white-space: pre-wrap; font-family: inherit; }}
        .footer {{ border-top: 1px solid #1e293b; margin-top: 32px; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">EduRAG Scholar • Academic Intelligence</div>
          <h1>🌅 Morning Academic Reader</h1>
          <div class="date">{date_str}</div>
        </div>
        <div class="content">{briefing_markdown}</div>
        <div class="footer">
          EduRAG Scholar • Autonomous University RAG & Web-Agent System • Verified Syllabus Grounding
        </div>
      </div>
    </body>
    </html>
    """


async def get_or_generate_briefing_content(unit_codes: list = None) -> str:
    """Generates or fetches cached in-depth daily study dossier."""
    nairobi_tz = pytz.timezone(settings.TIMEZONE)
    now_nairobi = datetime.now(nairobi_tz)
    today_str = now_nairobi.strftime("%Y-%m-%d")
    cache_key = f"{today_str}_{','.join(sorted(unit_codes or []))}"

    if cache_key in _DAILY_BRIEFING_CACHE:
        return _DAILY_BRIEFING_CACHE[cache_key]

    target_units_text = ", ".join(unit_codes) if unit_codes else "SCS 3201 (Software Engineering), SCS 3207 (Operating Systems), SCS 3209 (Distributed Networks)"
    briefing_prompt = f"""You are the EduRAG Academic Morning Reader & Abstractor for university scholars.
Synthesize an IN-DEPTH, HIGH-IMPACT ACADEMIC STUDY DOSSIER for today ({now_nairobi.strftime('%A, %d %B %Y')}).
Target Units: {target_units_text}.

Do NOT merely list topics or bullet points of 'what to cover'. Instead, write the ACTUAL READABLE NOTES, EXPLANATIONS, AND STEP-BY-STEP PROOFS directly into this document so the student can read and learn the core curriculum on their phone or laptop.

CRITICAL MATHEMATICS & TYPESETTING RULES:
- Format ALL mathematical, calculus, and scientific expressions in standard LaTeX:
  * Wrap display formulas in `$$ ... $$` on their own lines.
  * Wrap inline symbols and variables in `$ ... $`.
  * Never output bare backslashes without dollar delimiters.

STRUCTURE FOR THE DOSSIER:
# 🌅 EduRAG Daily Academic Reader & Abstractor — {now_nairobi.strftime('%A, %d %B %Y')}

## 📖 Part 1: Deep-Dive Core Concepts & First Principles
(Write an exhaustive explanation of the most critical theoretical foundations for today's units. Include precise definitions, architectural abstractions, mathematical formulations, or state models.)

## ⚙️ Part 2: Step-by-Step Derivation, Algorithm Trace or Code Blueprint
(Provide concrete code, step-by-step calculus proofs, or execution traces clarifying how the underlying mechanism functions.)

## ⚠️ Part 3: Examiner's Traps & University Grading Gotchas
(Highlight exact tricky questions, false assumptions students make, and model answers required to secure full marks in university papers.)

## 🧠 Part 4: High-Yield Micro-Drill (With Complete Model Answers)
(Provide 3 university exam questions on today's concepts followed immediately by rigorous, complete step-by-step model answers.)
"""
    content = await rag_router.generate_text(
        system_instruction="You are the EduRAG Autonomous Academic Professor and Curriculum Abstractor.",
        user_prompt=briefing_prompt
    )
    _DAILY_BRIEFING_CACHE[cache_key] = content
    return content


async def send_briefing_to_email(target_email: str, unit_codes: list = None) -> dict:
    """Dispatches in-depth study notes directly to the requested scholar's email."""
    if not settings.SENDGRID_API_KEY:
        return {"status": "error", "message": "SendGrid API Key not configured on server."}

    nairobi_tz = pytz.timezone(settings.TIMEZONE)
    now_nairobi = datetime.now(nairobi_tz)
    content = await get_or_generate_briefing_content(unit_codes)
    html_body = _build_html_email(content, now_nairobi.strftime('%A, %d %B %Y'))

    try:
        message = Mail(
            from_email=settings.SENDGRID_FROM_EMAIL or "scholar@edurag.tech",
            to_emails=target_email,
            subject=f"🌅 [EduRAG Morning Reader] In-Depth Academic Notes: {now_nairobi.strftime('%A, %d %B')}",
            html_content=html_body
        )
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        sg.send(message)
        logger.info(f"Morning academic reader email dispatched to {target_email}.")
        return {"status": "success", "message": f"Daily Academic Reader dispatched to {target_email}."}
    except Exception as e:
        logger.error(f"Failed to dispatch SendGrid email to {target_email}: {e}")
        return {"status": "error", "message": f"SendGrid dispatch error: {str(e)}"}



async def run_nightly_abstraction_job():
    """
    Executes at 3:00 AM EAT.
    1. Looks up today's timetable units.
    2. Gathers recent student weaknesses.
    3. Synthesizes a Morning Briefing.
    4. Sends SendGrid email + saves to database.
    """
    logger.info("Executing 3 AM Nightly Abstractor job...")
    client = get_supabase_admin_client()
    nairobi_tz = pytz.timezone(settings.TIMEZONE)
    now_nairobi = datetime.now(nairobi_tz)
    day_of_week = now_nairobi.isoweekday()  # 1 = Mon, 7 = Sun
    today_str = now_nairobi.strftime("%Y-%m-%d")

    # 1. Fetch scheduled units for today
    timetable_res = client.table("timetable_slots").select("unit_code, start_time, end_time, venue, units(name, lecturer)").eq("day_of_week", day_of_week).order("start_time").execute()
    slots = timetable_res.data or []

    scheduled_units = [s["unit_code"] for s in slots]
    logger.info(f"Today's scheduled units: {scheduled_units}")

    # 2. Fetch unresolved weaknesses for these units
    weakness_res = client.table("weakness_logs").select("unit_code, topic_name, error_pattern").in_("unit_code", scheduled_units).eq("is_resolved", False).limit(5).execute()
    weaknesses = weakness_res.data or []

    # 3. Synthesize In-Depth Morning Academic Reader using LLM (Directly readable notes, not just an outline)
    schedule_summary = []
    for s in slots:
        unit_meta = s.get("units", {}) or {}
        name = unit_meta.get("name", s["unit_code"])
        lecturer = unit_meta.get("lecturer", "Lecturer")
        schedule_summary.append(f"- {s['start_time']} - {s['end_time']}: **{s['unit_code']} - {name}** ({lecturer}, {s['venue']})")

    schedule_text = "\n".join(schedule_summary) if schedule_summary else "Core Degree Revision (Systems Architecture, Operating Systems, Networks, Software Engineering)."

    weakness_summary = []
    for w in weaknesses:
        weakness_summary.append(f"- {w['unit_code']}: {w['topic_name']} ({w.get('error_pattern', 'Need revision')})")
    weakness_text = "\n".join(weakness_summary) if weakness_summary else "General high-yield exam traps and system abstractions."

    briefing_prompt = f"""You are the EduRAG Academic Morning Reader & Abstractor for university scholars.
Synthesize an IN-DEPTH, FULL-CONTENT ACADEMIC STUDY DOSSIER for today ({now_nairobi.strftime('%A, %d %B %Y')}).
Do NOT merely list topics or bullet points of 'what to cover'. Instead, write the ACTUAL READABLE NOTES, EXPLANATIONS, AND PROOFS directly into this document so the student can read and learn the core curriculum directly in their email!

TODAY'S SCHEDULED UNITS:
{schedule_text}

STUDENT'S KNOWN WEAK SPOTS:
{weakness_text}

STRUCTURE FOR THE EMAIL:
# 🌅 EduRAG Daily Academic Reader — {now_nairobi.strftime('%A, %d %B %Y')}

## 📖 Part 1: Deep-Dive Core Concept & First Principles
(Write an exhaustive, thorough explanation of the most critical theoretical foundation for today's units. Include definitions, architectural abstractions, memory models, mathematical formulations, or state machines. Make it fully readable study notes.)

## ⚙️ Part 2: Mechanical Trace, Algorithm or Code Blueprint
(Provide concrete code, step-by-step mathematical proof, or execution trace clarifying how the underlying mechanism functions.)

## ⚠️ Part 3: Examiner's Traps & University Grading Gotchas
(Highlight exact tricky questions, false assumptions students make, and model answers required to secure full marks in university papers.)

## 🧠 Part 4: High-Yield Micro-Drill (With Complete Model Answers)
(Provide 3 university exam questions on today's concepts followed immediately by rigorous, complete model answers.)
"""

    briefing_markdown = ""
    try:
        sys_inst = "You are the EduRAG Academic Morning Reader for university scholars. Provide dense, rigorous, directly readable academic study material."
        briefing_markdown = await rag_router.generate_text(sys_inst, briefing_prompt)
    except Exception as e:
        logger.error(f"Error generating morning briefing: {e}")
        briefing_markdown = f"# 🌅 EduRAG Morning Reader\n\n### Today's Focus Units:\n{schedule_text}\n\nReview your course notes and slide archives in EduRAG Scholar."

    # 4. Save to daily_briefings (Supabase & MongoDB)
    try:
        profile_res = client.table("profiles").select("id").eq("is_admin", True).limit(1).execute()
        user_id = profile_res.data[0]["id"] if profile_res.data else None

        if user_id:
            client.table("daily_briefings").upsert({
                "user_id": user_id,
                "briefing_date": today_str,
                "markdown_content": briefing_markdown,
                "scheduled_units": scheduled_units,
                "emailed": bool(settings.SENDGRID_API_KEY)
            }, on_conflict="user_id,briefing_date").execute()

        # Archive into MongoDB Atlas
        mongo_col = get_briefing_archives_collection()
        await mongo_col.insert_one({
            "briefing_date": today_str,
            "markdown_content": briefing_markdown,
            "scheduled_units": scheduled_units,
            "emailed": bool(settings.SENDGRID_API_KEY),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Error saving daily briefing: {e}")

    # 5. SendGrid Email Dispatch (Formatted HTML Academic Reader)
    recipient_emails = []
    if settings.STUDENT_ALERT_EMAIL:
        recipient_emails.append(settings.STUDENT_ALERT_EMAIL)
    if "makeromusa17@gmail.com" not in recipient_emails:
        recipient_emails.append("makeromusa17@gmail.com")

    if settings.SENDGRID_API_KEY and recipient_emails:
        html_body = _build_html_email(briefing_markdown, now_nairobi.strftime('%A, %d %B %Y'))
        for to_email in recipient_emails:
            try:
                message = Mail(
                    from_email=settings.SENDGRID_FROM_EMAIL or "scholar@edurag.tech",
                    to_emails=to_email,
                    subject=f"🌅 [EduRAG Morning Reader] In-Depth Academic Notes: {now_nairobi.strftime('%A, %d %B')}",
                    html_content=html_body
                )
                sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
                sg.send(message)
                logger.info(f"Morning academic reader email dispatched to {to_email}.")
            except Exception as e:
                logger.error(f"Failed to dispatch SendGrid email to {to_email}: {e}")


def start_scheduler():
    """Starts the 3 AM background cron scheduler."""
    scheduler.add_job(
        run_nightly_abstraction_job,
        trigger="cron",
        hour=settings.ABSTRACT_CRON_HOUR,
        minute=settings.ABSTRACT_CRON_MINUTE,
        timezone=pytz.timezone(settings.TIMEZONE),
        id="nightly_abstractor",
        replace_existing=True
    )
    scheduler.start()
    logger.info(f"Nightly Abstractor scheduler started. Scheduled for {settings.ABSTRACT_CRON_HOUR}:{settings.ABSTRACT_CRON_MINUTE:02d} {settings.TIMEZONE}.")
