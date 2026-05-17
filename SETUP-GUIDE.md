# מדריך התקנה - מערכת מרקטפלייס פנים-ארגוני (AMAT)

## סקירת המערכת

מרקטפלייס פנים-ארגוני לניהול עודפי ציוד: עובדים מפרסמים ציוד לפני גריטה, עובדים אחרים תובעים אותו במקום לרכוש חדש. המערכת כוללת ניהול הצעות, תביעות, התראות, ניתוח נתונים וחיפוש עם התרעות אוטומטיות.

---

## רכיבים נדרשים

### 1. תוכנות ליבה

| רכיב | גרסה | קישור הורדה |
|------|-------|-------------|
| **Node.js** | 22.x LTS | https://nodejs.org |
| **Docker Desktop** | עדכני | https://www.docker.com/products/docker-desktop |
| **Git** | עדכני | https://git-scm.com |

> **הערה:** Docker Desktop מריץ את PostgreSQL אוטומטית בקונטיינר — אין צורך להתקין PostgreSQL בנפרד.

---

### 2. מסד הנתונים — PostgreSQL 16

המערכת משתמשת ב-**PostgreSQL 16** (Alpine Linux) דרך Docker.

**פרטי חיבור בסביבת פיתוח:**
```
Host:     localhost
Port:     5432
User:     amat
Password: amat
Database: marketplaceamat
```

**מבנה הדאטהבייס (6 טבלאות):**

| טבלה | תיאור |
|------|-------|
| `User` | משתמשים — תפקידים: poster / claimer / viewer |
| `Offer` | הצעות ציוד — קטגוריה, מצב, מיקום, תאריך גריטה |
| `Claim` | תביעות על הצעות — מצב: ממתין / מתוזמן / הושלם / בוטל |
| `Notification` | התראות למשתמשים |
| `SearchSubscription` | חיפושים שמורים + התרעות אוטומטיות |
| `SearchSubscriptionMatch` | התאמות בין חיפושים שמורים לבין הצעות חדשות |

---

### 3. שירותים חיצוניים (לסביבת Production בלבד)

| שירות | מטרה | עלות |
|--------|-------|------|
| **Vercel** | Hosting + Deploy אוטומטי | חינם (Hobby tier) |
| **Vercel Blob Storage** | אחסון תמונות שמועלות על ידי משתמשים | חינם עד 1GB |
| **Neon.tech** (או Vercel Postgres) | PostgreSQL בענן לסביבת Production | חינם עד 256MB |

> **לסביבת פיתוח מקומית** — אין צורך בשירותים חיצוניים. Docker מריץ הכל מקומית.

---

### 4. משתני סביבה (Environment Variables)

קובץ `.env` בתיקיית הפרויקט:

```env
# חיבור למסד הנתונים
DATABASE_URL="postgresql://amat:amat@localhost:5432/marketplaceamat?schema=public"

# אחסון תמונות (נדרש רק בסביבת Production)
BLOB_READ_WRITE_TOKEN="vercel_blob_..."

# סוד לסיד נתוני דמו (אופציונלי)
SEED_SECRET="any-random-string"
```

---

## שלבי התקנה מקומית (מחשב עבודה)

### שלב 1 — התקן תוכנות בסיס

1. הורד והתקן **Node.js 22 LTS** מ-nodejs.org
2. הורד והתקן **Docker Desktop** מ-docker.com
3. הורד והתקן **Git** מ-git-scm.com

### שלב 2 — שכפל את הפרויקט

```bash
git clone https://github.com/ofekivri/marketplaceamat.git
cd marketplaceamat
```

### שלב 3 — הקם את מסד הנתונים

```bash
docker compose up -d
```

פקודה זו מורידה ומריצה PostgreSQL 16 בקונטיינר מבודד בצורה אוטומטית.

### שלב 4 — התקן תלויות

```bash
npm install
```

### שלב 5 — צור את הסכמה וטען נתוני דמו

```bash
npx prisma db push
npm run seed
```

### שלב 6 — הפעל את המערכת

```bash
npm run dev
```

פתח דפדפן בכתובת: **http://localhost:3000**

---

## ארכיטקטורת המערכת

```
┌─────────────────────────────────────────────┐
│               Next.js 15 (App Router)        │
│  ┌──────────────┐   ┌──────────────────────┐ │
│  │  React 19 UI │   │  API Routes (Server) │ │
│  │  Tailwind CSS│   │  Server Actions      │ │
│  └──────────────┘   └──────────────────────┘ │
│              ▼                    ▼           │
│         ┌─────────────────────────────┐       │
│         │    Prisma ORM (TypeScript)  │       │
│         └──────────────┬────────────-┘       │
└────────────────────────┼─────────────────────┘
                         ▼
              ┌─────────────────────┐
              │   PostgreSQL 16     │
              │  (Docker / Neon)    │
              └─────────────────────┘
                         +
              ┌─────────────────────┐
              │  Vercel Blob        │
              │  (אחסון תמונות)    │
              └─────────────────────┘
```

---

## טכנולוגיות המערכת

| שכבה | טכנולוגיה |
|------|-----------|
| **Frontend Framework** | Next.js 15.5 (App Router) |
| **UI Library** | React 19 |
| **שפת תכנות** | TypeScript 5.6 |
| **עיצוב** | Tailwind CSS 3.4 |
| **ORM / גישה ל-DB** | Prisma 5.22 |
| **מסד נתונים** | PostgreSQL 16 |
| **אחסון קבצים** | Vercel Blob |
| **פריסה** | Vercel |
| **Cron Jobs** | Vercel Scheduler (בדיקת פריטים באיחור — יומי 09:00 UTC) |

---

## פיצ'רים קיימים במערכת

- פרסום ציוד עם תמונות, קטגוריה, מצב, מיקום ותאריך גריטה
- תביעת ציוד עם מעקב מצב (ממתין → נאסף → הושלם)
- חיפוש מתקדם + סינון לפי קטגוריה / מצב / מיקום
- התרעות אוטומטיות כשמתפרסם ציוד שמתאים לחיפוש שמור
- לוח ניתוח נתונים (ערך ציוד שנחסך, סטטיסטיקות תביעות)
- מערכת הודעות / Inbox למשתמש
- Cron Job יומי לזיהוי פריטים שחלף מועד גריטתם

---

## מה נדרש מה-IT לסביבת Production?

1. **חשבון Vercel** (חינם) — לפריסת האפליקציה
2. **חשבון Neon.tech** (חינם) — PostgreSQL בענן עד 256MB
3. **חשבון GitHub** — לחיבור Vercel לקוד
4. **דומיין פנימי** (אופציונלי) — ניתן להגדיר Custom Domain ב-Vercel
5. זמן הקמה: **~5 דקות** לסביבת Production (ראה DEPLOY.md)

---

*נכתב: מאי 2026*
