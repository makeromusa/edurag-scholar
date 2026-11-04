import re
import io
import logging
from typing import AsyncGenerator, Dict, Any, Optional
import edge_tts
from app.agents.rag_router import rag_router

logger = logging.getLogger(__name__)

AVAILABLE_PROFESSOR_VOICES = {
    "british_professor": {
        "id": "en-GB-RyanNeural",
        "name": "Prof. Sterling (British Senior Scholar)",
        "gender": "Male"
    },
    "american_lecturer": {
        "id": "en-US-ChristopherNeural",
        "name": "Prof. Miller (Deep American Lecturer)",
        "gender": "Male"
    },
    "kenyan_professor": {
        "id": "en-KE-ChilembaNeural",
        "name": "Prof. Omondi (UoN Chiromo Resident Voice)",
        "gender": "Male"
    },
    "distinguished_female": {
        "id": "en-GB-SoniaNeural",
        "name": "Prof. Catherine (Distinguished Academic)",
        "gender": "Female"
    }
}

DEFAULT_VOICE = "en-GB-RyanNeural"


def clean_markdown_for_speech(text: str) -> str:
    """
    Cleans markdown formatting, emojis, tables, and code symbols so the text-to-speech
    engine speaks smoothly like a natural lecturer rather than reading symbols.
    """
    if not text:
        return ""

    # Remove code blocks with backticks
    # Replace ```c ... ``` with spoken transition
    text = re.sub(r"```[a-zA-Z]*\n([\s\S]*?)```", r"Here is the implementation: \1", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)

    # Remove markdown headers (#, ##, ###)
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.MULTILINE)

    # Remove bold, italics, strikethrough (*, _, ~)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"\*([^*]+)\*", r"\1", text)
    text = re.sub(r"__([^_]+)__", r"\1", text)
    text = re.sub(r"_([^_]+)_", r"\1", text)
    text = re.sub(r"~~([^~]+)~~", r"\1", text)

    # Remove URLs and markdown links [text](url) -> text
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)

    # Replace common technical / mathematical symbols with spoken words
    replacements = [
        (r"->", " points to "),
        (r"=>", " implies that "),
        (r"!=", " is not equal to "),
        (r"==", " equals "),
        (r">=", " is greater than or equal to "),
        (r"<=", " is less than or equal to "),
        (r"\bO\(", " Big O of "),
        (r"\bUoN\b", " University of Nairobi "),
        (r"\bOS\b", " operating system "),
        (r"\bCPU\b", " C P U "),
        (r"\bRAM\b", " ram "),
        (r"\bTLB\b", " T L B "),
        (r"\bFIFO\b", " fifo "),
        (r"\bLRU\b", " least recently used "),
        (r"&", " and "),
        (r"%", " percent "),
        (r"\$", ""),  # Strip LaTeX dollar signs
    ]
    for pattern, replacement in replacements:
        text = re.sub(pattern, replacement, text)

    # Remove emojis and non-alphanumeric punctuation clutter
    text = re.sub(r"[^\w\s.,;:?!'\"()\-]", " ", text)

    # Normalize multiple whitespace and blank lines
    text = re.sub(r"\n{2,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)

    return text.strip()


class ProfessorVoiceService:
    def __init__(self):
        self.default_voice = DEFAULT_VOICE

    def get_available_voices(self) -> Dict[str, Any]:
        """Returns the list of high-fidelity professor voices."""
        return AVAILABLE_PROFESSOR_VOICES

    async def generate_conversational_script(
        self,
        lecture_content: str,
        unit_code: str,
        start_page: int,
        end_page: int
    ) -> str:
        """
        Transforms written markdown lecture notes into a fluid, warm, spoken lecture script
        optimized specifically for a student listening in the car or while multi-tasking.
        """
        system_prompt = f"""You are a distinguished Professor of Computer Science at the University of Nairobi delivering a live, natural oral masterclass on [{unit_code}].
Your student is listening to you teach in real-time (often hands-free, driving in the car, or multi-tasking).

ABSOLUTE PEDAGOGICAL DIRECTIVES:
1. Speak in first-person as an authoritative, engaging Senior Professor:
   "Welcome back. On this slide, we confront a pivotal systems engineering challenge..."
2. NEVER simply read or reverse-transcribe bullet points. YOUR JOB IS TO ACTIVELY TEACH:
   - Explain the underlying physical intuition: why does this mechanism exist? What architectural bottleneck forced its invention?
   - Walk through code and memory intuitively: "Notice what line 4 is doing: it performs bitwise masking on the high 12 bits to isolate the page table index..."
   - Warn the student about UoN Chiromo exam traps: "Keep this in mind for Dr. Miriti's Section B calculations — students constantly lose marks by forgetting..."
3. Use natural spoken cadence, vocal emphasis, and smooth pedagogical transitions.
4. Conclude your lecture naturally with a brief Socratic check:
   "Take a moment to absorb this concept, or ask me any question. If everything is clear, we will advance to the next section shortly."
5. Strip all markdown formatting, hashtags, asterisks, tables, and backticks. Output pure, fluid spoken prose ready for neural audio synthesis.
"""

        user_prompt = f"""UNIT: {unit_code}
SLIDE RANGE: Slides {start_page} to {end_page}

WRITTEN LECTURE NOTES:
{lecture_content[:3500]}

Generate the spoken lecture script for this audio masterclass:"""

        spoken_script = await rag_router.generate_text(
            system_instruction=system_prompt,
            user_prompt=user_prompt,
            max_tokens=1500
        )

        return clean_markdown_for_speech(spoken_script)

    async def synthesize_speech_bytes(
        self,
        text: str,
        voice: Optional[str] = None
    ) -> bytes:
        """
        Synthesizes text into high-fidelity MP3 neural audio bytes.
        """
        selected_voice = voice or self.default_voice
        cleaned = clean_markdown_for_speech(text)
        if not cleaned:
            cleaned = "No lecture notes found for this section."

        communicate = edge_tts.Communicate(
            text=cleaned,
            voice=selected_voice,
            rate="+0%",
            volume="+0%"
        )

        audio_buffer = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.write(chunk["data"])

        return audio_buffer.getvalue()

    async def stream_speech_chunks(
        self,
        text: str,
        voice: Optional[str] = None
    ) -> AsyncGenerator[bytes, None]:
        """
        Streams MP3 audio chunks in real-time as they are synthesized.
        """
        selected_voice = voice or self.default_voice
        cleaned = clean_markdown_for_speech(text)
        if not cleaned:
            cleaned = "No lecture notes available."

        communicate = edge_tts.Communicate(
            text=cleaned,
            voice=selected_voice,
            rate="+0%",
            volume="+0%"
        )

        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                yield chunk["data"]


professor_voice_service = ProfessorVoiceService()
