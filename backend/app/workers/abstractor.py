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

    # 3. Synthesize Morning Briefing using LLM
    schedule_summary = []
    for s in slots:
        unit_meta = s.get("units", {}) or {}
        name = unit_meta.get("name", s["unit_code"])
        lecturer = unit_meta.get("lecturer", "Lecturer")
        schedule_summary.append(f"- {s['start_time']} - {s['end_time']}: **{s['unit_code']} - {name}** ({lecturer}, {s['venue']})")

    schedule_text = "\n".join(schedule_summary) if schedule_summary else "No formal lectures scheduled for today (Study/Project day)."

    weakness_summary = []
    for w in weaknesses:
        weakness_summary.append(f"- {w['unit_code']}: {w['topic_name']} ({w.get('error_pattern', 'Need revision')})")
    weakness_text = "\n".join(weakness_summary) if weakness_summary else "No recorded weaknesses! All caught up."

    briefing_prompt = f"""You are the UoN Chiromo Academic 3 AM Nightly Abstractor for Asman Makero Musa.
Synthesize a crisp, highly motivational, structured Morning Briefing for today ({now_nairobi.strftime('%A, %d %B %Y')}).

TODAY'S TIMETABLE:
{schedule_text}

STUDENT'S KNOWN WEAK SPOTS FROM RECENT CHATS/QUIZZES:
{weakness_text}

OUTPUT FORMAT (Markdown):
# 🌅 Chiromo Morning Briefing - {now_nairobi.strftime('%A, %d %B')}
## 🎯 Today's Lecture Objectives & Timeline
(List lectures and the primary conceptual challenges to anticipate in class)

## ⚡ 5-Minute Weakness Remediation Drill
(Give 3 rapid-fire questions/definitions targeting the student's recorded weak spots)

## 💡 Quote / Exam Tactical Tip of the Day
(A short, punchy computer science or study habit tip)
"""

    briefing_markdown = ""
    try:
        sys_inst = "You are the UoN Chiromo Academic 3 AM Nightly Abstractor for Asman Makero Musa."
        briefing_markdown = await rag_router.generate_text(sys_inst, briefing_prompt)
    except Exception as e:
        logger.error(f"Error generating morning briefing: {e}")
        briefing_markdown = f"# 🌅 Chiromo Morning Briefing\n\n### Today's Schedule:\n{schedule_text}"

    # 4. Save to daily_briefings (Supabase & MongoDB)
    try:
        # Get primary user id (admin)
        profile_res = client.table("profiles").select("id").eq("role", "admin_owner").limit(1).execute()
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

    # 5. SendGrid Email Dispatch
    if settings.SENDGRID_API_KEY and settings.STUDENT_ALERT_EMAIL:
        try:
            message = Mail(
                from_email=settings.SENDGRID_FROM_EMAIL,
                to_emails=settings.STUDENT_ALERT_EMAIL,
                subject=f"🌅 [EduRAG 3 AM Briefing] Ready for Chiromo: {now_nairobi.strftime('%A, %d %B')}",
                html_content=f"<pre style='font-family: sans-serif; white-space: pre-wrap;'>{briefing_markdown}</pre>"
            )
            sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
            sg.send(message)
            logger.info("Morning briefing email successfully dispatched.")
        except Exception as e:
            logger.error(f"Failed to dispatch SendGrid email: {e}")


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
