from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

# ── Colours ──────────────────────────────────────────────────
AMAT_BLUE  = RGBColor(0x00, 0x47, 0xAB)
AMAT_DARK  = RGBColor(0x1A, 0x1A, 0x2E)
ACCENT     = RGBColor(0x00, 0xB4, 0xD8)
WHITE      = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT_BLUE = RGBColor(0xBB, 0xDE, 0xFF)
MID_GREY   = RGBColor(0x90, 0xA4, 0xAE)
GREEN      = RGBColor(0x2E, 0x7D, 0x32)
GREEN_L    = RGBColor(0x57, 0xCC, 0x99)
ORANGE     = RGBColor(0xE6, 0x5C, 0x00)
YELLOW     = RGBColor(0xFF, 0xCC, 0x00)
DARK_CARD  = RGBColor(0x0D, 0x1B, 0x3E)
DARK_CARD2 = RGBColor(0x12, 0x22, 0x4A)
DARK_ROW   = RGBColor(0x1E, 0x3A, 0x5F)

prs = Presentation()
prs.slide_width  = Inches(13.33)
prs.slide_height = Inches(7.5)
BLANK = prs.slide_layouts[6]

# ══════════════════════════════════════════════════════════════
# Helpers
# ══════════════════════════════════════════════════════════════
def bg(slide, color=AMAT_DARK):
    s = slide.shapes.add_shape(1, Inches(0), Inches(0),
                               Inches(13.33), Inches(7.5))
    s.fill.solid(); s.fill.fore_color.rgb = color
    s.line.fill.background()

def rect(slide, l, t, w, h, fill=None, border=None, bw=Pt(1)):
    s = slide.shapes.add_shape(1, Inches(l), Inches(t), Inches(w), Inches(h))
    if fill:
        s.fill.solid(); s.fill.fore_color.rgb = fill
    else:
        s.fill.background()
    if border:
        s.line.color.rgb = border; s.line.width = bw
    else:
        s.line.fill.background()
    return s

def tb(slide, l, t, w, h, text, size=20, bold=False, color=WHITE,
       align=PP_ALIGN.LEFT, italic=False):
    txb = slide.shapes.add_textbox(Inches(l), Inches(t), Inches(w), Inches(h))
    txb.word_wrap = True
    tf = txb.text_frame; tf.word_wrap = True
    p = tf.paragraphs[0]; p.alignment = align
    r = p.add_run(); r.text = text
    r.font.size = Pt(size); r.font.bold = bold
    r.font.italic = italic; r.font.color.rgb = color
    return txb

def add_para(tf, text, size=18, bold=False, color=WHITE,
             align=PP_ALIGN.LEFT, space=Pt(6), italic=False):
    p = tf.add_paragraph(); p.alignment = align; p.space_before = space
    r = p.add_run(); r.text = text
    r.font.size = Pt(size); r.font.bold = bold
    r.font.italic = italic; r.font.color.rgb = color

def header(slide, title, sub=None):
    rect(slide, 0, 0, 13.33, 1.4, fill=AMAT_BLUE)
    rect(slide, 0, 1.4, 13.33, 0.07, fill=ACCENT)
    tb(slide, 0.4, 0.1, 12.5, 0.82, title, size=36, bold=True, color=WHITE)
    if sub:
        tb(slide, 0.4, 0.88, 12.5, 0.48, sub, size=18, color=LIGHT_BLUE)

def foot(slide):
    rect(slide, 0, 7.18, 13.33, 0.32, fill=AMAT_BLUE)
    tb(slide, 0.3, 7.2, 12.7, 0.28,
       "Applied Materials Israel  |  SecondLife  |  Confidential",
       size=11, color=LIGHT_BLUE, align=PP_ALIGN.CENTER)

def card(slide, l, t, w, h, border=ACCENT, bw=Pt(1.5)):
    rect(slide, l, t, w, h, fill=DARK_CARD, border=border, bw=bw)


# ══════════════════════════════════════════════════════════════
# SLIDE 1 — Title
# ══════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
bg(sl)
rect(sl, 0, 0, 0.1, 7.5, fill=ACCENT)
rect(sl, 0.1, 0, 0.05, 7.5, fill=RGBColor(0x00, 0x80, 0xB0))

for cx, cy, r, col in [(11.5,1.2,2.5,RGBColor(0x00,0x47,0x80)),
                        (12.5,5.5,1.8,RGBColor(0x00,0x30,0x60))]:
    c = sl.shapes.add_shape(9, Inches(cx-r/2), Inches(cy-r/2),
                            Inches(r), Inches(r))
    c.fill.solid(); c.fill.fore_color.rgb = col; c.line.fill.background()

tb(sl, 0.7, 1.5, 11, 1.0, "SecondLife", size=56, bold=True, color=ACCENT)
tb(sl, 0.7, 2.5, 11, 0.7, "Internal Asset Redistribution Marketplace",
   size=28, color=WHITE)
tb(sl, 0.7, 3.22, 9, 0.5, "Applied Materials Israel",
   size=22, color=LIGHT_BLUE)
rect(sl, 0.7, 3.82, 5.5, 0.06, fill=ACCENT)
tb(sl, 0.7, 4.0, 9, 0.45, "IT Manager Briefing  ·  May 2026",
   size=18, color=MID_GREY)

tb(sl, 0.7, 4.65, 10, 1.6,
   "Agenda:\n"
   "  1.  What is this information system?\n"
   "  2.  Why is it needed?\n"
   "  3.  System overview & live demo\n"
   "  4.  Technical requirements",
   size=17, color=LIGHT_BLUE)
foot(sl)


# ══════════════════════════════════════════════════════════════
# SLIDE 2 — What is the information system?
# ══════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
bg(sl)
header(sl, "What Is SecondLife?", "Defining the information system")

tb(sl, 0.45, 1.62, 12.4, 0.55,
   "SecondLife is an internal web-based marketplace for Applied Materials Israel.",
   size=22, bold=True, color=ACCENT)

points = [
    ("🏭", "Any department can post assets they no longer need — before they are scrapped or disposed of."),
    ("🔍", "Other departments browse, search, and claim those assets — for free, within the organisation."),
    ("📋", "A built-in workflow manages the full lifecycle: posting → notification → claim → pickup → completion."),
    ("📊", "Every transfer is recorded, and each employee can see their personal impact in a live dashboard."),
]

for i, (icon, text) in enumerate(points):
    y = 2.32 + i * 1.1
    card(sl, 0.45, y, 12.4, 0.96)
    tb(sl, 0.6, y + 0.18, 0.7, 0.6, icon, size=26, align=PP_ALIGN.CENTER)
    tb(sl, 1.4, y + 0.15, 11.2, 0.7, text, size=20, color=WHITE)

foot(sl)


# ══════════════════════════════════════════════════════════════
# SLIDE 3 — Why is it needed?
# ══════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
bg(sl)
header(sl, "Why Is This System Needed?", "The problem we are solving")

problems = [
    (ACCENT,   "No Visibility Across Departments",
               "When a department schedules an asset for disposal, no one else is informed.\nFunctional equipment disappears silently."),
    (ORANGE,   "Significant Financial Value Is Lost",
               "Items worth ₪10,000 – ₪100,000+ are regularly scrapped while other\ndepartments could use them. There is no channel to prevent this."),
    (YELLOW,   "Existing Tools Are Not Enough",
               "Email, WhatsApp, and spreadsheets have no photos, no workflow, no\nnotifications, and no history. Coordination breaks down every time."),
    (GREEN_L,  "No Way to Measure the Impact",
               "There is currently no system to track how much value has been saved\nor lost — making it impossible to report results to management."),
]

for i, (col, title, body) in enumerate(problems):
    col_i = i % 2
    row_i = i // 2
    x = 0.4 + col_i * 6.5
    y = 1.62 + row_i * 2.62
    card(sl, x, y, 6.2, 2.45, border=col)
    rect(sl, x, y, 6.2, 0.52, fill=col)
    tb(sl, x + 0.18, y + 0.07, 5.8, 0.42,
       title, size=18, bold=True, color=AMAT_DARK)
    tb(sl, x + 0.18, y + 0.65, 5.8, 1.65,
       body, size=17, color=WHITE)

foot(sl)


# ══════════════════════════════════════════════════════════════
# SLIDE 4 — Why Existing Tools Fail
# ══════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
bg(sl)
header(sl, "Why Existing Tools Are Not Enough", "Part 1 — The problem continued")

tools = [
    ("📧  Email",              "No central visibility  ·  No tracking  ·  Buried in inboxes  ·  No photos"),
    ("💬  WhatsApp / Teams",   "No history  ·  No search  ·  No formal workflow  ·  Missed by latecomers"),
    ("📊  Shared Spreadsheet", "No photos  ·  No notifications  ·  No lifecycle tracking  ·  Manual updates"),
    ("📋  Paper / Verbal",     "Zero traceability  ·  No audit trail  ·  Relies on knowing the right person"),
]

for i, (tool, why) in enumerate(tools):
    y = 1.65 + i * 1.1
    fill = DARK_CARD if i % 2 == 0 else DARK_CARD2
    rect(sl, 0.4, y, 12.5, 0.98, fill=fill, border=DARK_ROW, bw=Pt(1))
    tb(sl, 0.6, y + 0.15, 3.4, 0.68, tool, size=19, bold=True, color=ACCENT)
    tb(sl, 4.1, y + 0.15, 8.6, 0.68, why, size=19, color=WHITE)

rect(sl, 0.4, 6.1, 12.5, 0.88, fill=RGBColor(0x00,0x3A,0x5C),
     border=ACCENT, bw=Pt(1.5))
tb(sl, 0.6, 6.17, 12.1, 0.72,
   "None of these support photos, automatic notifications, deadline tracking,"
   " or a formal pickup workflow.",
   size=17, italic=True, color=WHITE, align=PP_ALIGN.CENTER)
foot(sl)


# ══════════════════════════════════════════════════════════════
# SLIDE 5 — 3 Business Benefits
# ══════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
bg(sl)
header(sl, "3 Key Business Benefits", "The case for investment")

benefits = [
    ("💰", "Financial\nSavings", ACCENT,
     ["Assets redeployed internally instead of scrapped",
      "Reduces purchase of replacement equipment",
      "Every item claimed = direct cost avoidance",
      "Est. ₪400k – ₪1M saved per year"]),
    ("⚙️", "Operational\nEfficiency", RGBColor(0x4C,0xC9,0xF0),
     ["Departments subscribe to categories they need",
      "Automatic alerts when matching items are posted",
      "Formal pickup coordination — no chasing people",
      "Full lifecycle audit trail per asset"]),
    ("🌱", "Sustainability\n& ESG", GREEN_L,
     ["Reduces physical waste sent to disposal",
      "Supports AMAT corporate sustainability goals",
      "Items diverted from scrap = CO₂ saved",
      "Measurable dashboard per employee"]),
]

for i, (icon, title, col, bullets) in enumerate(benefits):
    x = 0.4 + i * 4.3
    card(sl, x, 1.62, 4.1, 5.0, border=col)
    tb(sl, x+0.2, 1.78, 0.7, 0.85, icon, size=32, align=PP_ALIGN.CENTER)
    tb(sl, x+0.2, 2.58, 3.65, 0.75, title, size=20, bold=True, color=col)
    rect(sl, x+0.2, 3.35, 3.5, 0.05, fill=col)

    txb = sl.shapes.add_textbox(Inches(x+0.2), Inches(3.48),
                                Inches(3.72), Inches(2.95))
    txb.word_wrap = True
    tf = txb.text_frame; tf.word_wrap = True
    for j, b in enumerate(bullets):
        p = tf.paragraphs[0] if j == 0 else tf.add_paragraph()
        p.space_before = Pt(7)
        r = p.add_run(); r.text = f"→  {b}"
        r.font.size = Pt(16); r.font.color.rgb = WHITE
foot(sl)


# ══════════════════════════════════════════════════════════════
# SLIDE 6 — System Overview
# ══════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
bg(sl)
header(sl, "Part 2 — What the System Does", "SecondLife — system overview")

features = [
    ("1", "Post an Asset",
     "Any department posts surplus equipment with photos, specs, scrap deadline, and estimated value."),
    ("2", "Browse & Search",
     "All employees browse available items and filter by category, condition, and urgency."),
    ("3", "Claim an Item",
     "A claimer reserves an item, triggering a formal pickup coordination workflow."),
    ("4", "Watchlist Alerts",
     "Users save keyword searches and get instant notifications when matching items are posted."),
    ("5", "Analytics Dashboard",
     "Each user sees their personal impact: value rehomed, items posted/claimed, department ranking."),
]

for i, (num, title, desc) in enumerate(features):
    col_i = i % 2; row_i = i // 2
    if i == 4:
        x, y, w = 0.4, 1.62 + 2 * 1.82, 12.5
    else:
        x = 0.4 + col_i * 6.55
        y = 1.62 + row_i * 1.82
        w = 6.25

    card(sl, x, y, w, 1.65)
    rect(sl, x+0.15, y+0.17, 0.52, 0.52, fill=ACCENT)
    tb(sl, x+0.15, y+0.15, 0.52, 0.54, num, size=20, bold=True,
       color=AMAT_DARK, align=PP_ALIGN.CENTER)
    tb(sl, x+0.8, y+0.12, w-1.0, 0.44, title, size=19, bold=True, color=ACCENT)
    tb(sl, x+0.8, y+0.6, w-1.0, 0.9, desc, size=17, color=WHITE)

foot(sl)


# ══════════════════════════════════════════════════════════════
# SLIDE 7 — Core Workflow
# ══════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
bg(sl)
header(sl, "Core Workflow — From Post to Pickup", "Part 2 continued")

steps = [
    ("1", "Department\nhas surplus item",    AMAT_BLUE),
    ("2", "Post to\nSecondLife",             AMAT_BLUE),
    ("3", "System notifies\nwatchlist users",RGBColor(0x01,0x67,0x9C)),
    ("4", "Another dept\nclaims the item",   RGBColor(0x01,0x67,0x9C)),
    ("5", "Pickup\ncompleted",               GREEN),
    ("6", "Value saved\nrecorded",           GREEN),
]

BW, BH = 1.72, 1.55
SX, SY  = 0.5, 2.7
GAP = (13.33 - 2*SX - len(steps)*BW) / (len(steps)-1)

for i, (num, label, col) in enumerate(steps):
    x = SX + i*(BW+GAP)
    if i < len(steps)-1:
        ax = x+BW+0.05
        rect(sl, ax, SY+BH/2-0.06, GAP-0.1, 0.12, fill=ACCENT)
        tri = sl.shapes.add_shape(5, Inches(ax+GAP-0.24),
                                  Inches(SY+BH/2-0.17),
                                  Inches(0.2), Inches(0.34))
        tri.fill.solid(); tri.fill.fore_color.rgb = ACCENT
        tri.line.fill.background()
    rect(sl, x, SY, BW, BH, fill=col, border=ACCENT, bw=Pt(1.5))
    rect(sl, x, SY, BW, 0.42, fill=ACCENT)
    tb(sl, x, SY+0.02, BW, 0.4, num, size=22, bold=True,
       color=AMAT_DARK, align=PP_ALIGN.CENTER)
    tb(sl, x+0.08, SY+0.5, BW-0.16, 0.95, label, size=15,
       color=WHITE, align=PP_ALIGN.CENTER)

rect(sl, 1.5, 4.6, 10.3, 0.88, fill=RGBColor(0x00,0x47,0x60),
     border=ACCENT, bw=Pt(1.5))
tb(sl, 1.65, 4.67, 10.0, 0.72,
   "Result:  Assets stay in use  ·  Departments save budget  ·  "
   "Organisation measures real-time impact",
   size=16, italic=True, color=WHITE, align=PP_ALIGN.CENTER)
foot(sl)


# ══════════════════════════════════════════════════════════════
# SLIDE 8 — Technical: Infrastructure
# ══════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
bg(sl)
header(sl, "Part 3 — Technical Requirements", "Infrastructure & Hosting")

rows = [
    ("Hosting",        "Vercel (cloud)",               "Vercel  OR  internal Node.js 22 server"),
    ("Domain / URL",   "vercel.app subdomain",         "Internal domain — secondlife.amat.co.il"),
    ("SSL / TLS",      "Vercel managed certificate",   "Required — Vercel or internal certificate"),
    ("Network access", "Public internet",              "VPN-only or internal network (preferred)"),
]

HY = 1.65
rect(sl, 0.4, HY, 12.5, 0.58, fill=AMAT_BLUE)
for cx, lbl in [(0.6,"Component"),(4.2,"Current (MVP)"),(8.8,"Required for Production")]:
    tb(sl, cx, HY+0.1, 3.8, 0.38, lbl, size=16, bold=True, color=WHITE)

for i, (comp, cur, req) in enumerate(rows):
    y = HY+0.58+i*0.9
    fill = DARK_CARD if i%2==0 else DARK_CARD2
    rect(sl, 0.4, y, 12.5, 0.84, fill=fill, border=DARK_ROW, bw=Pt(1))
    tb(sl, 0.6, y+0.14, 3.4, 0.6, comp, size=17, bold=True, color=ACCENT)
    tb(sl, 4.2, y+0.14, 4.4, 0.6, cur, size=17, color=MID_GREY)
    tb(sl, 8.8, y+0.14, 4.0, 0.6, req, size=17, color=WHITE)

rect(sl, 0.4, 5.5, 12.5, 1.0, fill=RGBColor(0x00,0x3A,0x5C),
     border=ACCENT, bw=Pt(1.5))
tb(sl, 0.6, 5.58, 12.1, 0.82,
   "💡  The system is live on Vercel today and can remain there ($20–50/month, zero ops). "
   "Migration to an internal server is possible if data residency is required.",
   size=16, italic=True, color=WHITE)
foot(sl)


# ══════════════════════════════════════════════════════════════
# SLIDE 9 — Technical: Database
# ══════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
bg(sl)
header(sl, "Technical Requirements — Database", "Part 3 continued")

card(sl, 0.4, 1.62, 5.9, 5.1)
tb(sl, 0.6, 1.76, 5.5, 0.48, "Database Specifications",
   size=19, bold=True, color=ACCENT)

specs = [
    ("Engine",       "PostgreSQL 15+"),
    ("Current",      "Neon — serverless PostgreSQL (cloud)"),
    ("Alternatives", "AWS RDS  /  Azure DB for PostgreSQL  /  Internal"),
    ("Schema",       "Prisma ORM — auto-migrations on every deploy"),
    ("Backup",       "Daily recommended; Neon: point-in-time recovery"),
    ("Size (est.)",  "< 1 GB for first 3 years of use"),
]
for i, (k, v) in enumerate(specs):
    y = 2.35+i*0.72
    tb(sl, 0.6, y, 1.95, 0.55, k+":", size=15, bold=True, color=ACCENT)
    tb(sl, 2.6, y, 3.55, 0.55, v, size=15, color=WHITE)

card(sl, 6.55, 1.62, 6.38, 5.1)
tb(sl, 6.75, 1.76, 5.9, 0.48, "Database Tables",
   size=19, bold=True, color=ACCENT)

tables = [
    ("User",                    "Name, email, department, role"),
    ("Offer",                   "Asset details, photos, status, deadline, value"),
    ("Claim",                   "Who claimed what, pickup status, completion"),
    ("Notification",            "In-app inbox messages per user"),
    ("SearchSubscription",      "User's saved keyword watchlist"),
    ("SearchSubscriptionMatch", "Which watchlist matched which offer"),
]
for i, (tbl, desc) in enumerate(tables):
    y = 2.35+i*0.72
    rect(sl, 6.75, y+0.06, 2.2, 0.48, fill=AMAT_BLUE, border=ACCENT, bw=Pt(1))
    tb(sl, 6.77, y+0.09, 2.16, 0.4, tbl, size=13, bold=True,
       color=WHITE, align=PP_ALIGN.CENTER)
    tb(sl, 9.08, y+0.1, 3.7, 0.46, desc, size=14, color=MID_GREY)
foot(sl)


# ══════════════════════════════════════════════════════════════
# SLIDE 10 — Technical: Stack + Auth
# ══════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
bg(sl)
header(sl, "Technical Requirements — App Stack & Authentication",
       "Part 3 continued")

card(sl, 0.4, 1.62, 5.9, 4.12)
tb(sl, 0.6, 1.76, 5.5, 0.45, "Application Stack",
   size=19, bold=True, color=ACCENT)

stack = [
    ("Runtime",   "Node.js",      "22.x"),
    ("Framework", "Next.js",      "15.x  (React App Router)"),
    ("Language",  "TypeScript",   "5.6"),
    ("ORM",       "Prisma",       "5.22"),
    ("Styling",   "Tailwind CSS", "3.4"),
    ("Images",    "Sharp",        "Auto-compress → WebP"),
    ("Storage",   "Vercel Blob",  "or AWS S3 / Azure Blob"),
]
SHY = 2.3
rect(sl, 0.55, SHY, 5.6, 0.42, fill=AMAT_BLUE)
for cx, lbl in [(0.6,"Layer"),(2.0,"Technology"),(3.7,"Version")]:
    tb(sl, cx, SHY+0.06, 1.5, 0.3, lbl, size=13, bold=True, color=WHITE)
for i, (layer, tech, ver) in enumerate(stack):
    y = SHY+0.42+i*0.48
    fill = DARK_CARD if i%2==0 else DARK_CARD2
    rect(sl, 0.55, y, 5.6, 0.45, fill=fill, border=DARK_ROW, bw=Pt(1))
    tb(sl, 0.6, y+0.07, 1.3, 0.35, layer, size=13, bold=True, color=ACCENT)
    tb(sl, 2.0, y+0.07, 1.6, 0.35, tech, size=13, color=WHITE)
    tb(sl, 3.7, y+0.07, 2.3, 0.35, ver, size=12, color=MID_GREY)

card(sl, 6.55, 1.62, 6.38, 4.12, border=ORANGE)
tb(sl, 6.75, 1.76, 5.9, 0.45, "Authentication — Action Required",
   size=19, bold=True, color=ORANGE)
rect(sl, 6.75, 2.3, 5.9, 0.56, fill=RGBColor(0x3E,0x1A,0x00),
     border=ORANGE, bw=Pt(1))
tb(sl, 6.9, 2.36, 5.7, 0.44,
   "⚠  Current: mock login — NOT for production",
   size=15, bold=True, color=ORANGE)

auth = [
    ("AD / LDAP", "Integrate with AMAT Israel Active Directory"),
    ("SSO",       "SAML 2.0 or OAuth 2.0 — same login as Windows/Outlook"),
    ("Dept/Role", "Pulled automatically from AD attributes"),
    ("Session",   "Secure session management via NextAuth.js"),
]
for i, (rid, req) in enumerate(auth):
    y = 2.97+i*0.68
    rect(sl, 6.75, y, 1.0, 0.48, fill=ORANGE)
    tb(sl, 6.75, y+0.06, 1.0, 0.38, rid, size=13, bold=True,
       color=AMAT_DARK, align=PP_ALIGN.CENTER)
    tb(sl, 7.85, y+0.07, 5.0, 0.42, req, size=14, color=WHITE)

rect(sl, 0.4, 5.82, 12.5, 0.88, fill=RGBColor(0x00,0x2A,0x3A),
     border=ACCENT, bw=Pt(1.5))
tb(sl, 0.6, 5.9, 12.1, 0.72,
   "💡  SMTP / Exchange relay needed for email notifications (deadline reminders, claim confirmations).",
   size=15, italic=True, color=WHITE)
foot(sl)


# ══════════════════════════════════════════════════════════════
# SLIDE 11 — Summary: What IT Needs
# ══════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
bg(sl)
header(sl, "Summary — What IT Needs to Provide", "Go-live checklist")

items = [
    ("🔴  Critical",      ORANGE,
     ["PostgreSQL database (Neon / RDS / Azure / internal)",
      "Internal domain + SSL — secondlife.amat.co.il",
      "LDAP / Active Directory SSO integration"]),
    ("🟡  Important",     YELLOW,
     ["SMTP / Exchange relay for email notifications",
      "VPN / network access policy decision",
      "Automated database backup schedule"]),
    ("🟢  Nice to Have",  GREEN_L,
     ["Admin panel to manage users and moderate posts",
      "Usage analytics for management reporting",
      "Slack / Teams webhook for notifications"]),
]

for i, (label, col, bullets) in enumerate(items):
    x = 0.4+i*4.3
    card(sl, x, 1.62, 4.1, 4.65, border=col)
    tb(sl, x+0.2, 1.78, 3.7, 0.48, label, size=17, bold=True, color=col)
    rect(sl, x+0.2, 2.3, 3.5, 0.05, fill=col)
    txb = sl.shapes.add_textbox(Inches(x+0.2), Inches(2.42),
                                Inches(3.75), Inches(3.65))
    txb.word_wrap = True
    tf = txb.text_frame; tf.word_wrap = True
    for j, b in enumerate(bullets):
        p = tf.paragraphs[0] if j == 0 else tf.add_paragraph()
        p.space_before = Pt(10)
        r = p.add_run(); r.text = f"→  {b}"
        r.font.size = Pt(15); r.font.color.rgb = WHITE

rect(sl, 0.4, 6.38, 12.5, 0.78, fill=AMAT_BLUE, border=ACCENT, bw=Pt(2))
tb(sl, 0.6, 6.45, 12.1, 0.62,
   "Expected ROI: ₪400,000 – ₪1,000,000 per year  ·  "
   "3–4 weeks to production once infrastructure is ready  ·  "
   "$20–50/month hosting cost",
   size=15, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
foot(sl)


# ══════════════════════════════════════════════════════════════
# SLIDE 12 — Live Demo Transition
# ══════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
bg(sl, AMAT_DARK)
rect(sl, 0, 0, 0.12, 7.5, fill=ACCENT)

# big circle decoration
c = sl.shapes.add_shape(9, Inches(7.5), Inches(-0.5), Inches(5.5), Inches(5.5))
c.fill.solid(); c.fill.fore_color.rgb = RGBColor(0x00,0x47,0x80)
c.line.fill.background()
c2 = sl.shapes.add_shape(9, Inches(9.5), Inches(3.5), Inches(3.5), Inches(3.5))
c2.fill.solid(); c2.fill.fore_color.rgb = RGBColor(0x00,0x30,0x60)
c2.line.fill.background()

tb(sl, 1.2, 1.8, 9, 0.6, "Now Moving To", size=28, color=LIGHT_BLUE)
tb(sl, 1.2, 2.45, 9, 1.3, "Live Demo", size=72, bold=True, color=ACCENT)

rect(sl, 1.2, 3.85, 6.0, 0.07, fill=ACCENT)

tb(sl, 1.2, 4.05, 9.5, 0.55,
   "We will now walk through the system live in the browser.",
   size=22, color=WHITE)
tb(sl, 1.2, 4.68, 9.5, 1.3,
   "What you will see:\n"
   "  →  Posting a new asset with photos\n"
   "  →  Claiming an item and the notification flow\n"
   "  →  The analytics & impact dashboard",
   size=18, color=LIGHT_BLUE)
foot(sl)


# ══════════════════════════════════════════════════════════════
# SLIDE 13 — Meeting Timeline
# ══════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
bg(sl)
header(sl, "Meeting Agenda & Timing", "How long each stage takes")

stages = [
    ("01", "Introduction",             "What is SecondLife and why is it needed",        "5 min",  ACCENT),
    ("02", "The Problem & Benefits",   "Current pain points and the business case",       "8 min",  RGBColor(0x4C,0xC9,0xF0)),
    ("03", "System Overview",          "What the system does and the core workflow",      "7 min",  RGBColor(0x57,0xCC,0x99)),
    ("04", "Live Demo",                "Full walkthrough in the browser — live",          "12 min", ORANGE),
    ("05", "Technical Requirements",   "Infrastructure, database, authentication needs",  "8 min",  YELLOW),
    ("06", "Q&A & Next Steps",         "Open discussion and decision on next steps",      "5 min",  GREEN_L),
]

TW = [0.62, 4.6, 5.6, 1.65]  # col widths
TX = [0.4, 1.07, 5.72, 11.37]  # col x positions

# header row
rect(sl, 0.4, 1.62, 12.5, 0.5, fill=AMAT_BLUE)
for x, lbl in zip(TX, ["#", "Stage", "Description", "Time"]):
    tb(sl, x+0.08, 1.68, 1.5, 0.36, lbl, size=15, bold=True, color=WHITE)

total_y = 1.62 + 0.5
for i, (num, stage, desc, time, col) in enumerate(stages):
    y = total_y + i * 0.82
    fill = DARK_CARD if i % 2 == 0 else DARK_CARD2
    rect(sl, 0.4, y, 12.5, 0.76, fill=fill, border=DARK_ROW, bw=Pt(1))
    # number badge
    rect(sl, TX[0], y+0.13, 0.52, 0.5, fill=col)
    tb(sl, TX[0], y+0.13, 0.52, 0.5, num, size=14, bold=True,
       color=AMAT_DARK, align=PP_ALIGN.CENTER)
    tb(sl, TX[1]+0.08, y+0.15, 4.4, 0.5, stage, size=17, bold=True, color=col)
    tb(sl, TX[2]+0.08, y+0.15, 5.5, 0.5, desc, size=15, color=MID_GREY)
    tb(sl, TX[3]+0.08, y+0.15, 1.5, 0.5, time, size=17, bold=True,
       color=WHITE, align=PP_ALIGN.CENTER)

# total row
total_y2 = total_y + len(stages) * 0.82
rect(sl, 0.4, total_y2, 12.5, 0.48, fill=AMAT_BLUE)
tb(sl, 0.6, total_y2+0.08, 10.5, 0.35,
   "Total meeting time:", size=16, bold=True, color=WHITE)
tb(sl, 11.2, total_y2+0.08, 1.5, 0.35,
   "45 min", size=16, bold=True, color=ACCENT, align=PP_ALIGN.CENTER)
foot(sl)


# ── Save ──────────────────────────────────────────────────────
out = "/home/user/MarketplaceAMAT/docs/SecondLife-IT-Presentation.pptx"
prs.save(out)
print(f"Saved → {out}")
