# 🎾 PROJECT CONTEXT — Korty Budowlani Lublin / GoRun Akademia Tenisa

> Ten plik opisuje wszystkie ustalenia projektowe. Wklej jego zawartość na początku każdej nowej rozmowy z Claude, aby zachować pełny kontekst.

---

## 1. OPIS PROJEKTU

Strona internetowa dla kortów tenisowych wraz z systemem rezerwacji online.

**Cel:**
- Nowoczesna, funkcjonalna strona WWW dla kortów
- System rezerwacji kortów zintegrowany z Google Calendar
- W przyszłości: integracja z AI receptionist (to kolejny etap — poza zakresem bieżącej pracy)

---

## 2. OBIEKT

| | |
|---|---|
| **Nazwa kortów** | Budowlani Lublin |
| **Zarządca** | GoRun Akademia Tenisa |
| **Lokalizacja** | Andrzeja Struga 8, 20-709 Lublin, Polska |
| **Korty obecnie** | 4 korty mączkowe (zewnętrzne) |
| **Korty w przyszłości** | +3 korty twarde (hala, planowane na przyszły rok) |

---

## 3. MARKI I LOGA

Dwie równorzędne marki — żadna nie jest nadrzędna:
- **Budowlani Lublin** — historyczna nazwa kortów, rozpoznawalna przez klientów. Logo: tarcza (czerwień, granat, biel). Plik: `Budowlani.png` (PNG z czarnym tłem)
- **GoRun Akademia Tenisa** — nowy zarządca obiektu. Logo: sylwetka tenisisty + napis. Pliki: `GoRun_full_z_ciemnym_tlem.png` (wersja na ciemnym tle), `GoRun_full_jasny_bez_tla.png` (wersja bez tła, ale przeznaczona na ciemne tło)

**Zasada:** Oba loga zawsze obok siebie, w identycznych rozmiarach, bez hierarchii.

---

## 4. DESIGN I STYL

### Inspiracja wizualna
Roland Garros — elegancja, ceglana mączka, prestiż, jasność.

### Paleta kolorów
| Nazwa | HEX | Zastosowanie |
|---|---|---|
| Ceglasta mączka | `#C8622A` | Przyciski CTA, akcenty, cena |
| Granat | `#1A2744` | Stats bar, nagłówki, tekst, navbar, footer |
| Kremowe tło | `#F5F0E8` | Tło hero, sekcja CTA |
| Czysta biel | `#FFFFFF` | Karty, sekcja oferty |
| Zieleń (wolny) | `#EAF3DE` / `#3B6D11` | Status "wolny kort" |
| Czerwień (zajęty) | `#FCF0EB` / `#993C1D` | Status "zajęty kort" |

### Zasady designu
- **Jasna, czysta strona** — kremowe i białe tła, dużo przestrzeni
- **Bez tekstur** — flat design
- **Navbar ciemny** (`#111827`) — loga wyglądają najlepiej na ciemnym tle
- **Footer ciemny** (`#111827`) — spójność z navbarem
- **Typografia:** system font-sans, wagi 400/500 (bez bold)
- **Zaokrąglenia:** subtelne (border-radius ~8px)

---

## 5. STRUKTURA STRONY

### Strona główna (`index.html`)
1. **Navbar** — ciemny, oba loga równorzędne, menu (Korty / Cennik / O nas / Kontakt), przełącznik PL/EN, przycisk CTA "Zarezerwuj kort →"
2. **Hero** — kremowe tło, tytuł, podtytuł, dwa przyciski (główny CTA + "Zobacz korty"), widget "Dostępność dziś" po prawej (live podgląd kortów)
3. **Stats bar** — granatowy pasek: liczba kortów / godziny otwarcia / płatność na miejscu
4. **Sekcja Oferta** — 3 karty: Wynajem kortu / Lekcje tenisa / Karnet miesięczny
5. **CTA do rezerwacji** — kremowe tło, duży przycisk → podstrona rezerwacji
6. **Footer** — ciemny, prawa autorskie, adres

### Podstrona rezerwacji (`rezerwacja.html`)
- Osobna podstrona (nie modal)
- Kalendarz z wyborem daty
- Wybór kortu (1–4)
- Wybór godziny (sloty co 30 min, minimalnie 60min, ale może być więcej np 90min)
- Formularz danych (imię, nazwisko, telefon/email)
- Potwierdzenie rezerwacji

### Panel admina (`admin.html`)
- Zabezpieczona podstrona (hasło)
- Podgląd wszystkich rezerwacji
- Widok dzienny/tygodniowy
- Zintegrowany z Google Calendar (rezerwacje = eventy w kalendarzu)

---

## 6. TECHNOLOGIA

### Stack (zero kosztów operacyjnych)
| Element | Technologia | Koszt |
|---|---|---|
| Frontend (strona) | HTML + CSS + Vanilla JavaScript | 0 zł |
| Hosting | GitHub Pages lub Netlify | 0 zł |
| Baza rezerwacji | Google Calendar (4 kalendarze = 4 korty) | 0 zł |
| Backend/logika | Google Apps Script | 0 zł |
| Dwujęzyczność | JavaScript i18n (PL/EN w jednym pliku) | 0 zł |
| Domena | np. kortybudowlani.pl | ~50 zł/rok |

### Architektura rezerwacji z Google Calendar
```
Użytkownik (strona WWW)
       ↓  [fetch/POST]
Google Apps Script (Web App)
       ↓  [Calendar API]
Google Calendar (4 kalendarze — po jednym na kort)
       ↓
Właściciele widzą rezerwacje w telefonie/komputerze
```

**Dlaczego Google Calendar:**
- Właściciele mają dostęp przez aplikację którą już znają
- Automatyczne powiadomienia email
- Zero kosztów
- Łatwa integracja z przyszłym AI receptionist

---

## 7. FUNKCJONALNOŚCI

### Rezerwacje
- Bez konieczności rejestracji konta (na razie)
- Płatność wyłącznie na miejscu (gotówka i karta)
- Sloty co 30 minut
- Widok dostępności w czasie rzeczywistym (pobierany z Google Calendar)
- Potwierdzenie rezerwacji na email/SMS (do ustalenia)

### Dwujęzyczność
- PL / EN
- Przełącznik w navbarze
- Wszystkie teksty tłumaczone przez JavaScript (jeden plik HTML)

### Responsywność
- Mobile-first (właściciele i klienci używają głównie telefonów)

---

## 8. STATUS PROJEKTU

### ✅ Ukończone
- [x] Zebranie wymagań i ustalenie kierunku
- [x] Wybór technologii i architektury
- [x] Mockup strony głównej (v1–v5) — zatwierdzony kierunek wizualny
- [x] Paleta kolorów zatwierdzona
- [x] Układ navbar z dwoma logami — zatwierdzony

### 🔄 Następny krok
- [ ] Mockup podstrony rezerwacji
- [ ] Mockup panelu admina
- [ ] Napisanie kodu HTML/CSS strony głównej
- [ ] Integracja Google Calendar API (Google Apps Script)
- [ ] Tłumaczenia PL/EN
- [ ] Testy i wdrożenie

---

## 9. PLIKI PROJEKTU

```
projekt/
├── PROJECT_CONTEXT.md        ← ten plik
├── index.html                ← strona główna (do stworzenia)
├── rezerwacja.html           ← podstrona rezerwacji (do stworzenia)
├── admin.html                ← panel admina (do stworzenia)
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── main.js
│   │   ├── booking.js
│   │   └── i18n.js           ← tłumaczenia PL/EN
│   └── img/
│       ├── Budowlani.png
│       ├── GoRun_full_z_ciemnym_tlem.png
│       └── GoRun_full_jasny_bez_tla.png
└── apps-script/
    └── Code.gs               ← Google Apps Script (backend rezerwacji)
```

---

## 10. NOTATKI I DECYZJE

- Logo GoRun z ciemnym tłem używamy na ciemnym navbarze
- Logo GoRun bez tła (jasne) używamy w jasnych sekcjach (jeśli potrzebne)
- Logo Budowlani (PNG z czarnym tłem) — na ciemnym tle wygląda naturalnie
- Rezerwacja NIE jest na stronie głównej — jest osobną podstroną, ale łatwo dostępną
- Widget "Dostępność dziś" na stronie głównej to podgląd, nie formularz
- W przyszłości: +3 korty twarde (indoor) — architektura musi to obsługiwać (osobne kalendarze)
- Język roboczy z klientem: **polski**
