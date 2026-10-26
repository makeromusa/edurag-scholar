import math
from datetime import datetime, timedelta, timezone
from typing import Dict, Any


def calculate_sm2_review(
    quality: int,
    repetitions: int = 0,
    ease_factor: float = 2.5,
    previous_interval_days: int = 0
) -> Dict[str, Any]:
    """
    SuperMemo-2 (SM-2) Spaced Repetition Algorithm.
    Used by EduRAG Scholar to combat the Ebbinghaus forgetting curve across 7 heavy units.

    Quality scale:
    5 - Perfect response (instant recall)
    4 - Correct response after hesitation
    3 - Correct response recalled with serious difficulty
    2 - Incorrect response; where the correct one seemed easy to recall
    1 - Incorrect response; the correct one remembered
    0 - Complete blackout

    Returns updated repetitions, ease_factor, interval_days, and next_review_at.
    """
    quality = max(0, min(5, quality))

    # Calculate new ease factor
    # EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    new_ef = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    new_ef = max(1.3, new_ef)  # Minimum ease factor bound

    if quality >= 3:
        # Successful recall
        if repetitions == 0:
            new_interval = 1
        elif repetitions == 1:
            new_interval = 6
        else:
            new_interval = math.ceil(previous_interval_days * new_ef)
        new_repetitions = repetitions + 1
    else:
        # Failure: restart cycle for this concept
        new_repetitions = 0
        new_interval = 1

    next_review = datetime.now(timezone.utc) + timedelta(days=new_interval)

    return {
        "repetitions": new_repetitions,
        "ease_factor": round(new_ef, 3),
        "interval_days": new_interval,
        "next_review_at": next_review.isoformat(),
        "is_mastered": new_repetitions >= 4
    }
