"""
AI layer for Where V2.
Handles: parse new entry, answer spatial queries, generate AI voice response.
Uses Claude Haiku — cheapest model, fast enough for real-time use.
Falls back to rule-based parsing if API key is not set.
"""
import json
import re
from datetime import datetime, timedelta
from django.conf import settings


def _rule_based_parse(raw_text: str) -> dict:
    """Fallback parser when no API key is configured."""
    text = raw_text.lower()
    if any(w in text for w in ['remind', 'birthday', 'meeting', 'event', 'appointment']):
        category = 'event'
    elif any(w in text for w in ['placed', 'kept', 'put', 'left', 'stored']):
        category = 'object'
    elif any(w in text for w in ['do', 'complete', 'finish', 'buy', 'call', 'submit', 'task']):
        category = 'task'
    elif any(w in text for w in ['where', 'find', 'seen', 'last']):
        category = 'query'
    else:
        category = 'reminder'

    if any(w in text for w in ['urgent', 'asap', 'critical', 'must', 'deadline']):
        importance = 5
    elif any(w in text for w in ['soon', 'today', 'tonight']):
        importance = 4
    elif any(w in text for w in ['tomorrow', 'next']):
        importance = 3
    else:
        importance = 2

    today = datetime.now()
    parsed_when = None
    if 'today' in text:
        parsed_when = today.replace(hour=18, minute=0, second=0, microsecond=0)
    elif 'tomorrow' in text:
        parsed_when = (today + timedelta(days=1)).replace(hour=9, minute=0, second=0, microsecond=0)
    elif 'next week' in text:
        parsed_when = (today + timedelta(days=7)).replace(hour=9, minute=0, second=0, microsecond=0)

    what = raw_text.split('.')[0].strip()[:200]
    where_match = re.search(r'(?:in|on|at|inside|under|behind|near)\s+(.{3,60}?)(?:\.|,|$)', text)
    parsed_where = where_match.group(1).strip() if where_match else ''

    confirmation_map = {
        'event': f"Got it. I will remind you about: {what}",
        'object': f"Stored. {what}",
        'task': f"On the list. {what}",
        'query': f"Let me check what I know about that.",
        'reminder': f"Noted. {what}",
    }

    return {
        'parsed_what': what,
        'parsed_when': parsed_when.isoformat() if parsed_when else None,
        'parsed_where': parsed_where,
        'category': category,
        'importance': importance,
        'ai_response': confirmation_map.get(category, f"Got it. {what}"),
    }


def parse_entry(raw_text: str, user_lifestyle: str = 'other', history: list = None) -> dict:
    """
    Main entry point. Parses a user's brain dump.
    Returns: parsed_what, parsed_when, parsed_where, category, importance, ai_response
    """
    if not settings.ANTHROPIC_API_KEY:
        return _rule_based_parse(raw_text)

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        today_str = datetime.now().strftime('%A, %d %B %Y, %H:%M')
        history_text = ''
        if history:
            history_text = '\n'.join([
                f"- [{e['category']}] {e['parsed_what']} (stored {e['created_at'][:10]})"
                for e in history[-20:]
            ])

        system = f"""You are Help — a memory assistant inside the "Where" app.
Today is {today_str}.
User lifestyle: {user_lifestyle}.

Your job: analyse the user's input and return ONLY a valid JSON object.

Rules:
1. If the user is STORING something (a location, reminder, task, event) → category is object/task/event/reminder
2. If the user is QUERYING something (asking where they put something, asking what they told you) → category is "query"
3. For queries, use the stored history to form a helpful answer in ai_response
4. ai_response must sound like a friendly assistant, not a robot. Keep it under 2 sentences.
5. parsed_when must be ISO 8601 format or null
6. importance: 1=low, 5=critical. Infer from context.

Stored history (what the user has told you before):
{history_text if history_text else "Nothing stored yet."}

Return ONLY this JSON, no extra text:
{{
  "parsed_what": "short summary of what was said",
  "parsed_when": "ISO datetime or null",
  "parsed_where": "location if mentioned, else empty string",
  "category": "object|task|event|reminder|query|other",
  "importance": 1-5,
  "ai_response": "what Help says back to the user"
}}"""

        response = client.messages.create(
            model='claude-haiku-4-5-20251001',
            max_tokens=300,
            system=system,
            messages=[{'role': 'user', 'content': raw_text}],
        )

        text = response.content[0].text.strip()
        # Strip markdown code fences if present
        text = re.sub(r'^```(?:json)?\s*|\s*```$', '', text, flags=re.MULTILINE).strip()
        result = json.loads(text)

        # Validate keys
        required = ['parsed_what', 'parsed_when', 'parsed_where', 'category', 'importance', 'ai_response']
        for k in required:
            if k not in result:
                result[k] = '' if k != 'importance' else 3

        return result

    except Exception as e:
        print(f"[AI parse error] {e} — falling back to rule-based")
        return _rule_based_parse(raw_text)