from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt
import copy

# ── Brand colours ──────────────────────────────────────────────
AMAT_BLUE   = RGBColor(0x00, 0x47, 0xAB)   # deep AMAT blue
AMAT_DARK   = RGBColor(0x1A, 0x1A, 0x2E)   # near-black navy
ACCENT      = RGBColor(0x00, 0xB4, 0xD8)   # bright cyan accent
WHITE       = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT_GREY  = RGBColor(0xF0, 0xF4, 0xF8)
MID_GREY    = RGBColor(0x90, 0xA4, 0xAE)
GREEN       = RGBColor(0x2E, 0x7D, 0x32)
ORANGE      = RGBColor(0xE6, 0x5C, 0x00)

prs = Presentation()
prs.slide_width  = Inches(13.33)
prs.slide_height = Inches(7.5)

BLANK = prs.slide_layouts[6]   # completely blank layout

# ══════════════════════════════════════════════════════════════
# Helper utilities
# ══════════════════════════════════════════════════════════════

def add_rect(slide, l, t, w, h, fill=None, line_color=None, line_width=Pt(0)):
    shape = slide.shapes.add_shape(1, Inches(l), Inches(t), Inches(w), Inches(h))
    shape.line.width = line_width
    if fill:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill
    else:
        shape.fill.background()
    if line_color:
        shape.line.color.rgb = line_color
        shape.line.width = line_width if line_width else Pt(1)
    else:
        shape.line.fill.background()
    return shape

def add_textbox(slide, l, t, w, h, text, size=18, bold=False, color=WHITE,
                align=PP_ALIGN.LEFT, wrap=True, italic=False):
    txb = slide.shapes.add_textbox(Inches(l), Inches(t), Inches(w), Inches(h))
    txb.word_wrap = wrap
    tf = txb.text_frame
    tf.word_wrap = wrap
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    return txb

def add_para(tf, text, size=14, bold=False, color=WHITE, align=PP_ALIGN.LEFT,
             space_before=Pt(4), italic=False):
    from pptx.util import Pt as PPt
    p = tf.add_paragraph()
    p.alignment = align
    p.space_before = space_before
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    return p

def slide_bg(slide, color=AMAT_DARK):
    add_rect(slide, 0, 0, 13.33, 7.5, fill=color)

def top_bar(slide, title, subtitle=None):
    add_rect(slide, 0, 0, 13.33, 1.35, fill=AMAT_BLUE)
    add_rect(slide, 0, 1.35, 13.33, 0.06, fill=ACCENT)
    add_textbox(slide, 0.35, 0.12, 12.6, 0.7, title,
                size=32, bold=True, color=WHITE)
    if subtitle:
        add_textbox(slide, 0.35, 0.78, 12.6, 0.5, subtitle,
                    size=16, bold=False, color=RGBColor(0xBB, 0xDE, 0xFF))

def footer(slide, text="Applied Materials Israel  |  SecondLife  |  Confidential"):
    add_rect(slide, 0, 7.15, 13.33, 0.35, fill=AMAT_BLUE)
    add_textbox(slide, 0.3, 7.17, 12.7, 0.28, text,
                size=10, color=RGBColor(0xBB, 0xDE, 0xFF), align=PP_ALIGN.CENTER)

def card(slide, l, t, w, h, fill=RGBColor(0x0D, 0x1B, 0x3E),
         border_color=ACCENT, border_width=Pt(1.5)):
    add_rect(slide, l, t, w, h, fill=fill,
             line_color=border_color, line_width=border_width)


# ══════════════════════════════════════════════════════════════
# SLIDE 1 — Title
# ══════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
slide_bg(sl, AMAT_DARK)

# big gradient bar on left
add_rect(sl, 0, 0, 0.08, 7.5, fill=ACCENT)
add_rect(sl, 0.08, 0, 0.04, 7.5, fill=RGBColor(0x00, 0x80, 0xB0))

# decorative circles
for cx, cy, r, alpha_col in [
    (11.5, 1.2, 2.5, RGBColor(0x00, 0x47, 0x80)),
    (12.5, 5.5, 1.8, RGBColor(0x00, 0x30, 0x60)),
]:
    c = sl.shapes.add_shape(9, Inches(cx - r/2), Inches(cy - r/2),
                            Inches(r), Inches(r))
    c.fill.solid(); c.fill.fore_color.rgb = alpha_col
    c.line.fill.background()

add_textbox(sl, 0.6, 1.6, 11, 0.8,
            "SecondLife", size=48, bold=True, color=ACCENT)
add_textbox(sl, 0.6, 2.35, 11, 0.65,
            "Internal Asset Redistribution Marketplace",
            size=26, bold=False, color=WHITE)
add_textbox(sl, 0.6, 3.05, 9, 0.45,
            "Applied Materials Israel",
            size=20, bold=False, color=RGBColor(0xBB, 0xDE, 0xFF))

add_rect(sl, 0.6, 3.6, 5.5, 0.05, fill=ACCENT)

add_textbox(sl, 0.6, 3.8, 9, 0.4,
            "IT Manager Briefing  ·  May 2026",
            size=15, color=MID_GREY)

add_textbox(sl, 0.6, 4.4, 10, 1.4,
            "Presentation covers:\n"
            "  Part 1  —  Why This System Is Necessary\n"
            "  Part 2  —  What the System Does\n"
            "  Part 4  —  Technical Requirements",
            size=15, color=RGBColor(0xCC, 0xE5, 0xFF))

footer(sl)


# ══════════════════════════════════════════════════════════════
# SLIDE 2 — Part 1 : The Problem
# ══════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
slide_bg(sl, AMAT_DARK)
top_bar(sl, "Part 1  —  Why This System Is Necessary",
        "The problem we are solving")

# 3 problem cards
problems = [
    ("No Central Visibility",
     "When a department schedules an asset for disposal, no other department is automatically informed. Assets disappear silently."),
    ("Value Lost to Scrap",
     "Functional equipment worth tens of thousands of NIS is regularly discarded simply because no redistribution channel exists."),
    ("Manual Processes Fail",
     "Emails, WhatsApp, and spreadsheets have no photos, no workflow, no notifications, and no history. Coordination breaks down."),
]

for i, (title, body) in enumerate(problems):
    x = 0.35 + i * 4.32
    card(sl, x, 1.6, 4.1, 4.6)
    # icon number
    add_rect(sl, x + 0.18, 1.8, 0.55, 0.55, fill=ACCENT)
    add_textbox(sl, x + 0.18, 1.78, 0.55, 0.58,
                str(i + 1), size=22, bold=True, color=AMAT_DARK,
                align=PP_ALIGN.CENTER)
    add_textbox(sl, x + 0.18, 2.45, 3.7, 0.5,
                title, size=17, bold=True, color=ACCENT)
    add_textbox(sl, x + 0.18, 3.0, 3.72, 2.9,
                body, size=13, color=WHITE)

footer(sl)


# ══════════════════════════════════════════════════════════════
# SLIDE 3 — Part 1 : Why Existing Tools Fail
# ══════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
slide_bg(sl, AMAT_DARK)
top_bar(sl, "Why Existing Tools Are Not Enough",
        "Part 1 continued")

tools = [
    ("📧  Email",         "No central visibility · No tracking · Buried in inboxes · No photos"),
    ("💬  WhatsApp / Teams", "No history · No search · No formal workflow · Missed by latecomers"),
    ("📊  Shared Spreadsheet", "No photos · No notifications · No lifecycle tracking · Manual updates"),
    ("📋  Paper / Verbal",    "Zero traceability · No audit trail · Relies on knowing the right person"),
]

ROW_H = 0.9
for i, (tool, why) in enumerate(tools):
    y = 1.65 + i * (ROW_H + 0.18)
    # alternating row shade
    fill_c = RGBColor(0x0D, 0x1B, 0x3E) if i % 2 == 0 else RGBColor(0x12, 0x22, 0x4A)
    add_rect(sl, 0.35, y, 12.6, ROW_H, fill=fill_c,
             line_color=RGBColor(0x1E, 0x3A, 0x5F), line_width=Pt(1))
    add_textbox(sl, 0.55, y + 0.12, 3.2, 0.65,
                tool, size=15, bold=True, color=ACCENT)
    add_textbox(sl, 3.9, y + 0.12, 9.0, 0.65,
                why, size=14, color=WHITE)

# bottom callout
add_rect(sl, 0.35, 5.35, 12.6, 1.0, fill=RGBColor(0x00, 0x47, 0x80),
         line_color=ACCENT, line_width=Pt(1.5))
add_textbox(sl, 0.6, 5.42, 12.2, 0.8,
            "None of these tools support photos, automatic notifications, deadline tracking, "
            "or a formal pickup workflow — the minimum needed for reliable redistribution.",
            size=14, color=WHITE, italic=True)

footer(sl)


# ══════════════════════════════════════════════════════════════
# SLIDE 4 — Part 1 : 3 Business Benefits
# ══════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
slide_bg(sl, AMAT_DARK)
top_bar(sl, "3 Key Business Benefits",
        "Part 1 continued — the case for investment")

benefits = [
    ("💰", "Financial Savings",
     [
         "Assets with remaining useful life are redeployed internally",
         "Reduces purchase of replacement equipment",
         "Every item claimed = direct cost avoidance",
         "Conservative estimate: ₪400k–₪1M saved per year",
     ], ACCENT),
    ("⚙️", "Operational Efficiency",
     [
         "Departments search and subscribe to categories they need",
         "Automatic alerts when matching items are posted",
         "Formal pickup coordination — no more chasing people",
         "Full lifecycle audit trail per asset",
     ], RGBColor(0x4C, 0xC9, 0xF0)),
    ("🌱", "Sustainability / ESG",
     [
         "Reduces physical waste sent to disposal",
         "Supports AMAT corporate sustainability goals",
         "Items diverted from scrap = CO₂ and materials saved",
         "Measurable impact dashboard per employee",
     ], RGBColor(0x57, 0xCC, 0x99)),
]

for i, (icon, title, bullets, col) in enumerate(benefits):
    x = 0.35 + i * 4.32
    card(sl, x, 1.58, 4.1, 4.9, border_color=col)
    add_textbox(sl, x + 0.2, 1.72, 3.7, 0.55,
                f"{icon}  {title}", size=17, bold=True, color=col)
    add_rect(sl, x + 0.2, 2.3, 3.5, 0.04, fill=col)
    txb = sl.shapes.add_textbox(Inches(x + 0.2), Inches(2.42),
                                Inches(3.72), Inches(3.8))
    txb.word_wrap = True
    tf = txb.text_frame
    tf.word_wrap = True
    for j, b in enumerate(bullets):
        p = tf.paragraphs[0] if j == 0 else tf.add_paragraph()
        p.space_before = Pt(5)
        run = p.add_run()
        run.text = f"→  {b}"
        run.font.size = Pt(13)
        run.font.color.rgb = WHITE

footer(sl)


# ══════════════════════════════════════════════════════════════
# SLIDE 5 — Part 2 : System Overview
# ══════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
slide_bg(sl, AMAT_DARK)
top_bar(sl, "Part 2  —  What the System Does",
        "SecondLife — system overview")

features = [
    ("Post an Asset",
     "Any department can post surplus equipment with photos, specs, scrap deadline, and estimated value."),
    ("Browse & Search",
     "All employees can browse available items, filter by category, condition, and urgency."),
    ("Claim an Item",
     "A claimer reserves an item, triggering a formal pickup coordination workflow."),
    ("Watchlist Alerts",
     "Users save keyword searches and receive instant notifications when matching items are posted."),
    ("Analytics Dashboard",
     "Each user sees their personal impact: value rehomed, items posted/claimed, department ranking."),
]

for i, (title, desc) in enumerate(features):
    col = 0 if i < 3 else 1
    row = i if i < 3 else i - 3
    x = 0.35 + col * 6.6
    y = 1.62 + row * 1.72
    w = 6.25 if col == 0 else 6.25
    card(sl, x, y, 6.25, 1.55)
    # number bubble
    add_rect(sl, x + 0.15, y + 0.15, 0.45, 0.45, fill=ACCENT)
    add_textbox(sl, x + 0.15, y + 0.13, 0.45, 0.48,
                str(i + 1), size=16, bold=True,
                color=AMAT_DARK, align=PP_ALIGN.CENTER)
    add_textbox(sl, x + 0.72, y + 0.1, 5.3, 0.42,
                title, size=15, bold=True, color=ACCENT)
    add_textbox(sl, x + 0.72, y + 0.55, 5.35, 0.85,
                desc, size=12, color=WHITE)

footer(sl)


# ══════════════════════════════════════════════════════════════
# SLIDE 6 — Part 2 : Core Workflow
# ══════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
slide_bg(sl, AMAT_DARK)
top_bar(sl, "Core Workflow — From Post to Pickup",
        "Part 2 continued")

steps = [
    ("1", "Department\nhas surplus item",   AMAT_BLUE),
    ("2", "Post to\nSecondLife",            AMAT_BLUE),
    ("3", "System notifies\nwatchlist users", RGBColor(0x01, 0x67, 0x9C)),
    ("4", "Another dept\nclaims the item",  RGBColor(0x01, 0x67, 0x9C)),
    ("5", "Pickup\ncompleted",              GREEN),
    ("6", "Value saved\nrecorded",          GREEN),
]

BOX_W, BOX_H = 1.7, 1.4
START_X, Y_POS = 0.55, 2.8
GAP = (13.33 - 2 * START_X - len(steps) * BOX_W) / (len(steps) - 1)

for i, (num, label, col) in enumerate(steps):
    x = START_X + i * (BOX_W + GAP)
    # arrow (except after last)
    if i < len(steps) - 1:
        ax = x + BOX_W + 0.05
        add_rect(sl, ax, Y_POS + BOX_H / 2 - 0.05,
                 GAP - 0.1, 0.1, fill=ACCENT)
        # arrowhead triangle
        tri = sl.shapes.add_shape(
            5,  # right triangle
            Inches(ax + GAP - 0.22), Inches(Y_POS + BOX_H / 2 - 0.15),
            Inches(0.18), Inches(0.3))
        tri.fill.solid(); tri.fill.fore_color.rgb = ACCENT
        tri.line.fill.background()

    # box
    add_rect(sl, x, Y_POS, BOX_W, BOX_H, fill=col,
             line_color=ACCENT, line_width=Pt(1.5))
    add_rect(sl, x, Y_POS, BOX_W, 0.38, fill=ACCENT)
    add_textbox(sl, x, Y_POS + 0.02, BOX_W, 0.36,
                num, size=20, bold=True,
                color=AMAT_DARK, align=PP_ALIGN.CENTER)
    add_textbox(sl, x + 0.08, Y_POS + 0.45, BOX_W - 0.16, 0.9,
                label, size=13, bold=False,
                color=WHITE, align=PP_ALIGN.CENTER)

# outcome highlight
add_rect(sl, 1.5, 4.55, 10.3, 0.85,
         fill=RGBColor(0x00, 0x47, 0x60),
         line_color=ACCENT, line_width=Pt(1.5))
add_textbox(sl, 1.6, 4.62, 10.1, 0.72,
            "Result:  Functional assets stay in use · Departments save budget · "
            "The organisation measures its impact in real time",
            size=14, color=WHITE, align=PP_ALIGN.CENTER, italic=True)

footer(sl)


# ══════════════════════════════════════════════════════════════
# SLIDE 7 — Part 4 : Infrastructure & Hosting
# ══════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
slide_bg(sl, AMAT_DARK)
top_bar(sl, "Part 4  —  Technical Requirements",
        "Infrastructure & Hosting")

rows = [
    ("Hosting",       "Vercel (cloud)",                 "Vercel  OR  internal Node.js 22 server"),
    ("Domain / URL",  "vercel.app subdomain",           "Internal domain  e.g. secondlife.amat.co.il"),
    ("SSL / TLS",     "Vercel managed certificate",     "Required — Vercel or internal certificate"),
    ("Network access","Public internet",                "VPN-only or internal network access preferred"),
]

HEADER_Y = 1.62
add_rect(sl, 0.35, HEADER_Y, 12.6, 0.5, fill=AMAT_BLUE)
for col_x, label in [(0.5, "Component"), (4.0, "Current (MVP)"), (8.5, "Required for Production")]:
    add_textbox(sl, col_x, HEADER_Y + 0.06, 3.8, 0.38,
                label, size=14, bold=True, color=WHITE)

for i, (comp, cur, req) in enumerate(rows):
    y = HEADER_Y + 0.5 + i * 0.78
    fill_c = RGBColor(0x0D, 0x1B, 0x3E) if i % 2 == 0 else RGBColor(0x12, 0x22, 0x4A)
    add_rect(sl, 0.35, y, 12.6, 0.72, fill=fill_c,
             line_color=RGBColor(0x1E, 0x3A, 0x5F), line_width=Pt(1))
    add_textbox(sl, 0.5, y + 0.1, 3.3, 0.52, comp,
                size=13, bold=True, color=ACCENT)
    add_textbox(sl, 4.0, y + 0.1, 4.3, 0.52, cur,
                size=13, color=MID_GREY)
    add_textbox(sl, 8.5, y + 0.1, 4.3, 0.52, req,
                size=13, color=WHITE)

# note box
add_rect(sl, 0.35, 5.0, 12.6, 1.0,
         fill=RGBColor(0x00, 0x3A, 0x5C),
         line_color=ACCENT, line_width=Pt(1.5))
add_textbox(sl, 0.55, 5.08, 12.2, 0.82,
            "💡  The system is currently live on Vercel and can remain there (low cost, zero ops). "
            "Migration to an internal server is possible if data residency is required.",
            size=13, color=WHITE, italic=True)

footer(sl)


# ══════════════════════════════════════════════════════════════
# SLIDE 8 — Part 4 : Database
# ══════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
slide_bg(sl, AMAT_DARK)
top_bar(sl, "Technical Requirements — Database",
        "Part 4 continued")

# left column — specs
card(sl, 0.35, 1.58, 5.9, 5.1)
add_textbox(sl, 0.55, 1.72, 5.5, 0.42,
            "Database Specifications", size=16, bold=True, color=ACCENT)

db_specs = [
    ("Engine",       "PostgreSQL 15+"),
    ("Current",      "Neon (serverless PostgreSQL, cloud)"),
    ("Alternatives", "AWS RDS  /  Azure DB for PostgreSQL  /  Internal server"),
    ("Schema mgmt",  "Prisma ORM — migrations run automatically on deploy"),
    ("Backup",       "Daily backup recommended; Neon: point-in-time recovery"),
    ("Est. size",    "< 1 GB for first 3 years of normal usage"),
]

for i, (k, v) in enumerate(db_specs):
    y = 2.22 + i * 0.7
    add_textbox(sl, 0.55, y, 2.0, 0.55, k + ":", size=12, bold=True, color=ACCENT)
    add_textbox(sl, 2.6, y, 3.5, 0.55, v, size=12, color=WHITE)

# right column — schema tables
card(sl, 6.55, 1.58, 6.43, 5.1)
add_textbox(sl, 6.75, 1.72, 6.0, 0.42,
            "Database Tables (Schema)", size=16, bold=True, color=ACCENT)

tables = [
    ("User",                    "Employee name, email, department, role"),
    ("Offer",                   "Asset details, photos, status, deadline, value"),
    ("Claim",                   "Who claimed what, pickup status, completion date"),
    ("Notification",            "In-app inbox messages per user"),
    ("SearchSubscription",      "User's saved keyword watchlist"),
    ("SearchSubscriptionMatch", "Which watchlist entry matched which offer"),
]

for i, (tbl, desc) in enumerate(tables):
    y = 2.22 + i * 0.7
    add_rect(sl, 6.75, y + 0.06, 2.15, 0.42,
             fill=AMAT_BLUE, line_color=ACCENT, line_width=Pt(1))
    add_textbox(sl, 6.78, y + 0.07, 2.1, 0.4,
                tbl, size=11, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    add_textbox(sl, 9.05, y + 0.08, 3.7, 0.42,
                desc, size=11, color=MID_GREY)

footer(sl)


# ══════════════════════════════════════════════════════════════
# SLIDE 9 — Part 4 : Application Stack + Auth
# ══════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
slide_bg(sl, AMAT_DARK)
top_bar(sl, "Technical Requirements — App Stack & Authentication",
        "Part 4 continued")

# left: stack table
card(sl, 0.35, 1.58, 6.0, 4.0)
add_textbox(sl, 0.55, 1.72, 5.6, 0.42,
            "Application Stack", size=16, bold=True, color=ACCENT)

stack = [
    ("Runtime",    "Node.js",    "22.x"),
    ("Framework",  "Next.js",    "15.x  (React App Router)"),
    ("Language",   "TypeScript", "5.6"),
    ("ORM",        "Prisma",     "5.22"),
    ("Styling",    "Tailwind CSS","3.4"),
    ("Images",     "Sharp",      "0.33  (auto-compress to WebP)"),
    ("Storage",    "Vercel Blob","or AWS S3 / Azure Blob"),
]

HDR_Y = 2.22
add_rect(sl, 0.5, HDR_Y, 5.7, 0.38, fill=AMAT_BLUE)
for cx, lbl in [(0.55, "Layer"), (2.05, "Technology"), (3.75, "Version / Note")]:
    add_textbox(sl, cx, HDR_Y + 0.04, 1.6, 0.3, lbl,
                size=11, bold=True, color=WHITE)

for i, (layer, tech, ver) in enumerate(stack):
    y = HDR_Y + 0.38 + i * 0.48
    fill_c = RGBColor(0x0D, 0x1B, 0x3E) if i % 2 == 0 else RGBColor(0x12, 0x22, 0x4A)
    add_rect(sl, 0.5, y, 5.7, 0.45, fill=fill_c,
             line_color=RGBColor(0x1E, 0x3A, 0x5F), line_width=Pt(1))
    add_textbox(sl, 0.55, y + 0.06, 1.4, 0.35, layer,
                size=11, bold=True, color=ACCENT)
    add_textbox(sl, 2.05, y + 0.06, 1.6, 0.35, tech,
                size=11, color=WHITE)
    add_textbox(sl, 3.75, y + 0.06, 2.3, 0.35, ver,
                size=11, color=MID_GREY)

# right: auth requirements
card(sl, 6.65, 1.58, 6.33, 4.0, border_color=ORANGE)
add_textbox(sl, 6.85, 1.72, 5.9, 0.42,
            "Authentication — Action Required", size=16, bold=True, color=ORANGE)

add_rect(sl, 6.85, 2.22, 5.9, 0.52,
         fill=RGBColor(0x3E, 0x1A, 0x00),
         line_color=ORANGE, line_width=Pt(1))
add_textbox(sl, 6.95, 2.28, 5.7, 0.4,
            "⚠  Current: mock login (demo only — not for production)",
            size=12, bold=True, color=ORANGE)

auth_reqs = [
    ("TR-5.1", "Integrate with AMAT Israel Active Directory / LDAP"),
    ("TR-5.2", "Recommended: SAML 2.0 or OAuth 2.0 SSO\n(same credentials as Windows / Outlook)"),
    ("TR-5.3", "Department and role pulled from AD attributes automatically"),
    ("TR-5.4", "Secure session management via NextAuth.js or similar"),
]

for i, (rid, req) in enumerate(auth_reqs):
    y = 2.85 + i * 0.68
    add_rect(sl, 6.85, y, 0.72, 0.42, fill=ORANGE)
    add_textbox(sl, 6.85, y + 0.03, 0.72, 0.38,
                rid, size=10, bold=True,
                color=AMAT_DARK, align=PP_ALIGN.CENTER)
    add_textbox(sl, 7.65, y + 0.03, 5.2, 0.55,
                req, size=11, color=WHITE)

# bottom note
add_rect(sl, 0.35, 5.7, 12.6, 0.88,
         fill=RGBColor(0x00, 0x2A, 0x3A),
         line_color=ACCENT, line_width=Pt(1.5))
add_textbox(sl, 0.55, 5.78, 12.2, 0.72,
            "💡  Email notifications (SMTP / Exchange relay) are also needed for deadline reminders "
            "and claim confirmations. This requires SMTP server access from the IT team.",
            size=13, color=WHITE, italic=True)

footer(sl)


# ══════════════════════════════════════════════════════════════
# SLIDE 10 — Summary / What IT Needs to Provide
# ══════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
slide_bg(sl, AMAT_DARK)
top_bar(sl, "Summary — What IT Needs to Provide",
        "Go-live checklist")

it_needs = [
    ("🔴  Critical",     ORANGE,
     [
         "PostgreSQL database instance (Neon / RDS / Azure / internal)",
         "Internal domain + SSL certificate (e.g. secondlife.amat.co.il)",
         "LDAP / Active Directory SSO integration",
     ]),
    ("🟡  Important",    RGBColor(0xFF, 0xCC, 0x00),
     [
         "SMTP relay or Exchange server access for email notifications",
         "VPN / network access policy decision",
         "Automated database backup schedule",
     ]),
    ("🟢  Nice to Have", RGBColor(0x57, 0xCC, 0x99),
     [
         "Admin panel for IT to manage users and moderate listings",
         "Usage analytics for management reporting",
         "Slack / Teams webhook integration for notifications",
     ]),
]

for i, (label, col, items) in enumerate(it_needs):
    x = 0.35 + i * 4.32
    card(sl, x, 1.58, 4.1, 4.55, border_color=col)
    add_textbox(sl, x + 0.18, 1.72, 3.7, 0.45,
                label, size=15, bold=True, color=col)
    add_rect(sl, x + 0.18, 2.2, 3.5, 0.04, fill=col)
    txb = sl.shapes.add_textbox(Inches(x + 0.18), Inches(2.3),
                                Inches(3.75), Inches(3.6))
    txb.word_wrap = True
    tf = txb.text_frame
    tf.word_wrap = True
    for j, item in enumerate(items):
        p = tf.paragraphs[0] if j == 0 else tf.add_paragraph()
        p.space_before = Pt(8)
        run = p.add_run()
        run.text = f"→  {item}"
        run.font.size = Pt(12)
        run.font.color.rgb = WHITE

# ROI banner
add_rect(sl, 0.35, 6.3, 12.6, 0.78,
         fill=AMAT_BLUE,
         line_color=ACCENT, line_width=Pt(2))
add_textbox(sl, 0.55, 6.37, 12.2, 0.62,
            "Expected ROI:  ₪400,000 – ₪1,000,000 saved per year  ·  "
            "3–4 weeks to production once IT infrastructure is ready  ·  "
            "Hosting cost ~$20–50 / month",
            size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

footer(sl)


# ── Save ──────────────────────────────────────────────────────
out = "/home/user/MarketplaceAMAT/docs/SecondLife-IT-Presentation.pptx"
prs.save(out)
print(f"Saved → {out}")
