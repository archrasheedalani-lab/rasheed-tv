"""Builds docs/Rasheed-TV-Guide.pdf, the step-by-step guide to share.

Needs reportlab and Pillow:  python -m pip install reportlab pillow
Run from anywhere:           python docs/build-guide.py
"""
from pathlib import Path

from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (Image, KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table,
                                TableStyle)

DOCS = Path(__file__).resolve().parent
IMAGES = DOCS / "images"
OUT = DOCS / "Rasheed-TV-Guide.pdf"

VERSION = "0.2.4"
REPO = "https://github.com/archrasheedalani-lab/rasheed-tv"
APK = REPO + "/releases/latest/download/RasheedTV.apk"
CLAUDE_LINE = ("Set up my TV with Rasheed TV from " + REPO + ": follow docs/SETUP-PROMPT.md step by step. "
               "You are on a computer on the same Wi-Fi as the TV.")

GOLD = colors.HexColor("#B08A45")
INK = colors.HexColor("#04120C")
MUTED = colors.HexColor("#5C6660")
PANEL = colors.HexColor("#F4EFE4")

base = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=base["Heading1"], textColor=INK, fontSize=19, spaceBefore=4, spaceAfter=8)
H2 = ParagraphStyle("H2", parent=base["Heading2"], textColor=GOLD, fontSize=13.5, spaceBefore=10, spaceAfter=5)
BODY = ParagraphStyle("Body", parent=base["BodyText"], fontSize=10.5, leading=15, textColor=INK)
SMALL = ParagraphStyle("Small", parent=BODY, fontSize=8.8, leading=12, textColor=MUTED)
CAPTION = ParagraphStyle("Caption", parent=SMALL, alignment=TA_CENTER, spaceBefore=3, spaceAfter=10)
CODE = ParagraphStyle("Code", parent=BODY, fontName="Courier", fontSize=8.6, leading=11.5, textColor=INK)
TITLE = ParagraphStyle("Title", parent=base["Title"], textColor=INK, fontSize=30, leading=36, spaceAfter=6)
SUB = ParagraphStyle("Sub", parent=BODY, fontSize=13, leading=18, textColor=MUTED, alignment=TA_CENTER)


def p(text, style=BODY):
    return Paragraph(text, style)


def steps(items, start=1):
    """A numbered list with gold numbers (start: to carry a list on after a box)."""
    rows = [[p(f"<font color='#B08A45'><b>{i}</b></font>"), p(t)] for i, t in enumerate(items, start)]
    t = Table(rows, colWidths=[8 * mm, 162 * mm])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                           ("LEFTPADDING", (0, 0), (-1, -1), 0)]))
    return t


def bullets(items):
    return [p("&bull;&nbsp;&nbsp;" + t) for t in items]


def box(flowables, background=PANEL):
    t = Table([[flowables]], colWidths=[170 * mm])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), background), ("BOX", (0, 0), (-1, -1), 0.6, GOLD),
                           ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                           ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
    return t


def shot(name, caption, width=170 * mm):
    img = Image(str(IMAGES / name), width=width, height=width * 9 / 16)
    return KeepTogether([img, p(caption, CAPTION)])


def qr(url, size=32 * mm):
    w = QrCodeWidget(url)
    x1, y1, x2, y2 = w.getBounds()
    d = Drawing(size, size, transform=[size / (x2 - x1), 0, 0, size / (y2 - y1), 0, 0])
    d.add(w)
    return d


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(0.5)
    canvas.line(20 * mm, 14 * mm, 190 * mm, 14 * mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(20 * mm, 9.5 * mm, f"Rasheed TV {VERSION} - open source (MIT) - {REPO}")
    canvas.drawRightString(190 * mm, 9.5 * mm, str(doc.page))
    canvas.restoreState()


story = []

# ---------- cover ----------
story += [Spacer(1, 18 * mm), p("Rasheed TV", TITLE),
          p("A screensaver and home screen for Android TV,<br/>in Arabic and English", SUB), Spacer(1, 10 * mm),
          shot("home.jpg", "The home screen: dates, weather, the clock, the card of the day, prayer times, "
                           "countdowns, matches, and your favourite apps."),
          Spacer(1, 4 * mm),
          p(f"Step-by-step guide - version {VERSION}", SUB), PageBreak()]

# ---------- what it is ----------
story += [p("What you get", H1),
          shot("screensaver.jpg", "The screensaver, after the TV has been idle for a while."),
          *bullets([
              "<b>Clock</b> in your city's time, the <b>Islamic and Gregorian dates</b> (either on top, one only, "
              "or switching every 10 seconds), and the <b>weather</b>.",
              "<b>Next prayer</b> with a countdown; Jafari, Dubai, Umm al-Qura and other calculation methods; "
              "an optional <b>adhan</b>.",
              "<b>Countdowns</b> to Ramadan, the Prophet's birthday, Imam Ali's birthday and other occasions.",
              "Your <b>teams' matches</b>, and a card: verse and hadith of the day, morning and evening adhkar, "
              "sayings of Imam Ali, prayer times or the forecast.",
              "<b>Photos</b> from Wikimedia Commons by theme (UAE cities, cars, world nature, a favourite player), "
              "each with its caption and photographer.",
              "An optional <b>home screen</b> with your favourite apps, and a <b>settings panel</b> for everything, "
              "used with the remote.",
          ]),
          Spacer(1, 4 * mm),
          box([p("<b>Works on</b> Android TV and Google TV, Android 7 or newer: Sony, TCL, Hisense, Philips, Xiaomi "
                 "boxes, Chromecast with Google TV, operator boxes. <b>Not</b> on Samsung (Tizen) or LG (webOS) TVs.")]),
          PageBreak()]

# ---------- option A ----------
story += [p("Option A: install it from the TV (no computer)", H1),
          p("About 5 minutes, with the TV remote only."),
          Spacer(1, 3 * mm),
          steps([
              "On the TV, open the <b>Google Play Store</b>, search for <b>Downloader</b> (by AFTVnews) and install it.",
              "Allow it to install apps: <b>Settings &rarr; Apps &rarr; Security &amp; restrictions &rarr; "
              "Unknown sources &rarr; Downloader: on</b>. On some TVs: <b>Settings &rarr; Privacy &rarr; Security "
              "&rarr; Install unknown apps</b>.",
              "Open <b>Downloader</b>, select the address box, type the link below exactly, and press <b>Go</b>.",
              "When the download ends, press <b>Install</b>, then <b>Done</b>. You can delete the downloaded file "
              "when Downloader offers.",
              "Make it the screensaver: <b>Settings &rarr; Device Preferences (or System) &rarr; Screen saver "
              "&rarr; Rasheed TV screensaver</b>. Choose <b>When to start</b> there too (for example after 5 minutes).",
              "Open the <b>Rasheed TV</b> app from your apps to choose your language, city and everything else "
              "(page 5).",
          ]),
          Spacer(1, 4 * mm),
          box([p("<b>The link to type in Downloader</b>", SMALL), p(APK, CODE)]),
          Spacer(1, 4 * mm),
          p("Tip: typing on the TV is slow; take your time, letters and the slashes must be exact. Capital letters "
            "matter in <font face='Courier'>RasheedTV.apk</font>.", SMALL),
          Spacer(1, 6 * mm),
          p("The home screen (optional)", H2),
          p("Some TVs ask which home screen to use the first time you press <b>Home</b> after installing: choose "
            "<b>Rasheed TV</b> and <b>Always</b>. Most Google TVs don't ask; then Option B (Claude) sets it for you "
            "in a minute, safely."),
          PageBreak()]

# ---------- option B ----------
story += [p("Option B: let Claude set it up for you", H1),
          p("Claude, an AI assistant, does the whole setup from a computer on your Wi-Fi: it connects to the TV, "
            "installs the app, makes it the screensaver and, if you want, the home screen, and checks each step with "
            "a screenshot of your TV. It asks before changing anything and can undo it all later."),
          p("1. On the TV (once)", H2),
          steps([
              "<b>Settings &rarr; System (or Device Preferences) &rarr; About</b>: press OK on <b>Build</b> 7 times, "
              "until it says you are a developer.",
              "Back &rarr; <b>Developer options</b> &rarr; turn on <b>USB debugging</b> (and <b>Network debugging</b> "
              "if you see it).",
              "Note the TV's <b>IP address</b>: <b>Settings &rarr; Network &amp; Internet &rarr;</b> your Wi-Fi "
              "(it looks like 192.168.1.23).",
          ]),
          p("2. On the computer", H2),
          steps([
              "Install the <b>Claude desktop app</b> from <b>claude.ai/download</b> (Windows or Mac) and sign in.",
              "Open the <b>Code</b> tab and choose a folder on this computer (for example a new folder on the "
              "Desktop). The computer must be on the <b>same Wi-Fi</b> as the TV.",
              "Paste this one line and send it:",
          ]),
          Spacer(1, 2 * mm),
          box([p(CLAUDE_LINE, CODE)]),
          Spacer(1, 3 * mm),
          steps([
              "Answer Claude's questions (the TV's IP address, and whether you want the home screen too).",
              "When Claude says so, look at the TV: <b>Allow USB debugging?</b> appears. Press <b>Allow</b> and tick "
              "<b>Always allow from this computer</b>.",
              "Claude installs and checks everything, then shows you what it did.",
          ], start=4),
          Spacer(1, 4 * mm),
          box([p("<b>Why a computer?</b> Claude must reach the TV over your Wi-Fi, so it has to run on a computer in "
                 "your home: a chat in a web browser can't. The full instructions Claude follows are public, in "
                 "<font face='Courier'>docs/SETUP-PROMPT.md</font> of the project.", SMALL)]),
          PageBreak()]

# ---------- using it ----------
story += [p("Using it", H1),
          p("Settings", H2),
          shot("settings.jpg", "The settings panel: arrows to move, OK to open a list or tick a box, Save at the bottom."),
          p("Open the <b>Rasheed TV</b> app (or, on the home screen, the <b>Settings</b> tile at the end of the row). "
            "You can change:"),
          *bullets([
              "<b>General:</b> language (English or Arabic), digits, 12/24-hour clock, text size, background dimming.",
              "<b>Colours:</b> six themes, and your own accent, text and card colours.",
              "<b>City and time zone:</b> pick a city or search any city in the world; the time zone follows it.",
              "<b>Prayer and date:</b> calculation method, Islamic or Gregorian date on top, Hijri date offset.",
              "<b>On screen:</b> turn each part on or off. <b>Card</b>, <b>countdowns</b>, <b>teams</b>, "
              "<b>photo themes</b>, <b>adhan</b>.",
          ]),
          p("Press <b>Save</b> at the bottom. <b>Back</b> closes the panel without saving.", SMALL),
          PageBreak(),
          p("The home screen and your favourites", H2),
          shot("arrange.jpg", "Arranging favourites: the app you picked up lifts; move it with the arrows."),
          *bullets([
              "<b>Left / right</b> moves along the row; <b>OK</b> opens the app.",
              "<b>All apps</b> (second-last tile) shows every app. Its first tile, <b>Choose favourites</b>: press OK "
              "on an app to add it to the row or remove it (marked &#9733;).",
              "<b>Hold OK</b> on an app in the row to move it: left/right carries it, OK puts it down, then "
              "<b>Done</b> (or Back).",
              "Your TV's own home screen stays installed; Claude (or the steps on the next page) can switch back.",
          ]),
          Spacer(1, 4 * mm),
          box([p("<b>The adhan.</b> The shared app has no adhan recording: recordings belong to whoever made them. "
                 "To hear the adhan, build the app yourself with your own recording (the project's README, "
                 "\"Build it and install it from your computer\"), or ask Claude to help you do it.", SMALL)]),
          PageBreak()]

# ---------- undo, help ----------
story += [p("Removing it", H1),
          p("Everything can be undone; your other apps and accounts are never touched."),
          *bullets([
              "<b>Only the screensaver:</b> Settings &rarr; Device Preferences &rarr; Screen saver &rarr; choose "
              "another one.",
              "<b>Everything, with Claude:</b> on the same computer, tell Claude <i>\"Remove Rasheed TV from my TV, "
              "following docs/SETUP-PROMPT.md step 9\"</i>. It puts your old home screen and screensaver back first, "
              "then removes the app.",
              "<b>Without a computer</b>, if Rasheed TV is <b>not</b> your home screen: Settings &rarr; Apps &rarr; "
              "Rasheed TV &rarr; Uninstall. (If it is your home screen, use Claude, so the TV never has no home.)",
          ]),
          p("Privacy", H2),
          p("After the setup you may turn <b>USB debugging</b> and <b>Network debugging</b> off on the TV "
            "(Developer options). The screen keeps updating without them; only changes made from a computer need them "
            "on again. The app stores your settings on the TV only."),
          p("About the texts", H2),
          p("Hadith and adhkar come only from al-Kafi, Man La Yahduruhu al-Faqih, Tahdhib al-Ahkam and al-Istibsar; "
            "the sayings of Imam Ali from Nahj al-Balagha. Each carries its reference and is marked <i>not yet "
            "checked</i> against the printed books: corrections are very welcome on the project page."),
          p("Project and credits", H2),
          Table([[qr(REPO),
                  [p(f"<b>Project page:</b> {REPO}", SMALL),
                   p("Free and open source (MIT licence), by Rasheed. Data: Aladhan (prayer times), Open-Meteo "
                     "(weather), AlQuran Cloud (verses), TheSportsDB (matches), Wikimedia Commons (photos, each under "
                     "its own licence, credited on screen). Fonts: Noto and Playfair Display (SIL OFL).", SMALL)]]],
                colWidths=[38 * mm, 132 * mm],
                style=TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 0)])),
          ]

doc = SimpleDocTemplate(str(OUT), pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=18 * mm,
                        bottomMargin=20 * mm, title="Rasheed TV - step-by-step guide", author="Rasheed",
                        subject="Install and use Rasheed TV on Android TV")
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print("wrote", OUT)
