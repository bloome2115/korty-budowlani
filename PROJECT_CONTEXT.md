# 🎾 PROJECT CONTEXT — Korty Budowlani Lublin / GoRun Akademia Tenisa

> Główny dokument ustaleń. Wklej na początku nowej rozmowy, żeby zachować kontekst.
> **Wersja 4 — 28.09.2026.** Strona jest wizytówką, nie systemem rezerwacji.
> Cały zakres kodu ukończony; zostały wyłącznie dane od klienta.
> Uzasadnienie zwrotu: `claude/DECYZJE_wizytowka_i_posty.md`.

---

## 1. OPIS PROJEKTU

Strona internetowa kortów tenisowych — **wizytówka obiektu** z sekcją aktualności,
zarządzaną samodzielnie przez obsługę klubu.

**Cel:**
- Nowoczesna strona WWW, która sprzedaje obiekt: oferta, cennik, lokalizacja, kontakt
- Sekcja aktualności (ogłoszenia, turnieje, promocje, galeria) — dodawana z panelu, bez programisty
- Rezerwacje: **przekierowanie do zewnętrznego systemu kluby.org** (decyzja klienta, nie nasza)

**Czym ten projekt już NIE jest:** systemem rezerwacji. Kod rezerwacji zostaje w repo
jako zamrożony, ale nie jest rozwijany ani widoczny dla klienta.

---

## 2. OBIEKT

| | |
|---|---|
| **Nazwa kortów** | Budowlani Lublin |
| **Zarządca** | GoRun Akademia Tenisa |
| **Lokalizacja** | Andrzeja Struga 8, 20-709 Lublin |
| **Korty obecnie** | 4 korty mączkowe (zewnętrzne) |
| **Hala** | 3 korty kryte, w przygotowaniu (roboczo: sezon zimowy 2026/27) |
| **Rezerwacje** | zewnętrznie, przez **kluby.org** (dawniej korty.org — ta sama firma) |

⚠️ **Konto klubu na kluby.org jeszcze nie istnieje.** Do czasu jego założenia przyciski
„Zarezerwuj kort" prowadzą na `rezerwacja-wkrotce.html`.

---

## 3. MARKI I LOGA

Dwie równorzędne marki — żadna nie jest nadrzędna:
- **Budowlani Lublin** — historyczna nazwa, rozpoznawalna. Logo: tarcza (czerwień, granat, biel). Plik: `Budowlani_bez_tla.png`
- **GoRun Akademia Tenisa** — zarządca obiektu. Logo: sylwetka tenisisty + napis. Plik: `GoRun_serwis_napis_jasny_bez_tla.png`

**Zasada:** oba loga zawsze obok siebie, w zbliżonych rozmiarach, bez hierarchii.

---

## 4. DESIGN I STYL

### Inspiracja
Roland Garros — elegancja, ceglana mączka, prestiż, jasność.

### Paleta (zmienne CSS w `index.html`)
| Nazwa | HEX | Zastosowanie |
|---|---|---|
| Ceglasta mączka | `#C8622A` | CTA, akcenty, ceny, ikony |
| Pomarańcz | `#E8722A` | akcent w hero |
| Granat | `#1A2744` | navbar, stats bar, footer, tekst |
| Kremowe tło | `#F5F0E8` | jasne sekcje (Aktualności, O nas) |
| Biel | `#FFFFFF` | karty, Oferta, Cennik |

### Zasady
- Jasna, czysta strona — dużo przestrzeni, flat design, bez tekstur
- Navbar i footer ciemne (granat) — loga wyglądają najlepiej na ciemnym tle
- Typografia: **Outfit** (body, wagi 300–600)
- Ikony: Tabler Icons (webfont z CDN)
- Zaokrąglenia subtelne (8–14 px)
- Mobile-first: karty Oferty i Aktualności przechodzą na mobile w poziomy scroll ze snapem,
  stats bar w siatkę 2×2, tabela cennika przewija się we własnym pudełku

---

## 5. STRUKTURA STRONY

### `index.html` — strona główna ✅ gotowa
1. **Navbar** — ciemny, oba loga, menu (Oferta / Cennik / Aktualności / Liga / O nas / Kontakt),
   przełącznik PL/EN, CTA. **Ten sam navbar jest na każdej stronie serwisu** —
   patrz „Navbar współdzielony" w sekcji 10
2. **Hero** — zdjęcie kortu + gradient, nagłówek, dwa przyciski, **widget „Nadchodzące wydarzenia"** po prawej
3. **Stats bar** — 4 korty mączkowe (3 kryte w przygotowaniu) / 8:00–22:00 / gotówka i karta / od 1974
4. **Oferta** — 3 karty: Wynajem kortu / Lekcje tenisa / Liga. Ceny „od …".
   Każda karta prowadzi dalej: wynajem → rezerwacja, lekcje → `o-nas.html#trenerzy`,
   liga → `liga.html`
5. **Cennik** — tabela; ⚠️ trzy pozycje mają `[do uzupełnienia]`
6. **Aktualności** — 3 najnowsze wpisy, **jeden na rząd**: zdjęcie po lewej (38%),
   treść po prawej, wyśrodkowana w pionie. Sekcja `hidden`, gdy brak wpisów.
   Zdjęcia nieprzycinane, sufit wysokości 360 px, kliknięcie otwiera pełny rozmiar.
   Wpis turniejowy pokazuje listę: termin, kategoria, format, wpisowe, zapisy do
7. **O nas** — skrót (2 akapity + 4 fakty) z linkiem na `o-nas.html`.
   ⚠️ tekst jest SZKICEM, czeka na akceptację klienta
8. **CTA** — granatowa sekcja z dużym przyciskiem
9. **Footer** — loga, adres, godziny, kontakt (⚠️ telefon to atrapa), podpis Bloome

### Navbar współdzielony — uwaga przy zmianach
Navbar (HTML + CSS + `toggleMenu` + przyciski rezerwacji) jest **skopiowany**
do `index.html`, `aktualnosci.html`, `liga.html`, `o-nas.html`
i `rezerwacja-wkrotce.html`. Statyczna strona bez kompilacji nie ma jak
współdzielić fragmentu pliku, a wstrzykiwanie navbara JavaScriptem sprawiłoby,
że menu mrugałoby przy każdym wejściu. Świadomy koszt: **zmiana w menu wymaga
poprawki w pięciu plikach.** Różnice celowe: na podstronach kotwice mają przedrostek
`index.html#…`, a na `rezerwacja-wkrotce.html` przycisk rezerwacji jest zamieniony
na „Zadzwoń" (kierowałby sam na siebie).

### `liga.html` — podstrona lig ✅ gotowa
Trzy ligi Rakietmania + UKT Go Run (open, 40+, kobiet) jako równorzędne kafelki,
każdy z przyciskiem na stronę ligi w kluby.org, plus sekcja „Jak dołączyć".
Regulaminów NIE przepisujemy — żyją w kluby.org, a kopia na naszej stronie
rozjechałaby się z oryginałem przy pierwszej zmianie sezonu.
⚠️ Wszystkie trzy adresy `url` w tablicy `LIGI` są puste — przyciski pokazują
„Zapisy wkrótce". Dopisanie czwartej ligi = jeden obiekt w tablicy `LIGI`.

### `o-nas.html` — podstrona o klubie ✅ gotowa
Historia obiektu (pełna wersja; strona główna ma tylko skrót), 4 fakty,
sekcja **Nasza kadra** pod kotwicą `#trenerzy`.
Trenerzy rysują się z tablicy `TRENERZY` — jeden obiekt to jeden kafelek.
Bez zdjęcia kółko pokazuje inicjały; zdjęcie podmienia się bez ruszania układu,
a zła ścieżka po cichu wraca do inicjałów.
Kadra: **Adrian +48 732 889 991**, **Michał +48 798 702 932**.
⚠️ Brakuje nazwisk i krótkich opisów — kafelki renderują się bez nich poprawnie
(pusty `opis` nie rysuje akapitu), ale wyglądają ubogo.

### `rezerwacja-wkrotce.html` — podstrona przejściowa ✅ gotowa
Informuje, że rezerwacja online jest w przygotowaniu, i podaje numer telefonu jako
drogę rezerwacji. Ma `noindex` — zniknie, gdy ruszy kluby.org, a zaindeksowany adres
zostałby martwym linkiem w Google. ⚠️ Numer telefonu to atrapa.

### `aktualnosci.html` — pełna lista wpisów ✅ gotowa
Wszystkie wpisy, **pełna treść** (nie skrót jak na stronie głównej), filtry po typie
z licznikami. Pasek filtrów chowa się, gdy wszystkie wpisy są jednego typu.
Turniej po terminie: przygaszony, z plakietką „Zakończony".

### `admin.html` — panel obsługi ✅ gotowy
Logowanie hasłem, cztery typy wpisów z polami zależnymi od typu, szablon ogłoszenia
turniejowego, upload do 6 zdjęć ze zmniejszaniem w przeglądarce, podgląd karty
na żywo, wyróżnianie, ukrywanie, trwałe usuwanie z potwierdzeniem, wyniki turnieju.
Zmiany stanu działają natychmiast na ekranie, zapis leci w tle (patrz sekcja 10).

### `rezerwacja.html` — ❄️ ZAMROŻONE
Zostaje w repo, znika z nawigacji. Nie rozwijamy, nie kasujemy.

---

## 6. TECHNOLOGIA

### Stack (zero kosztów operacyjnych)
| Element | Technologia | Koszt |
|---|---|---|
| Frontend | HTML + CSS + Vanilla JS (jeden plik na stronę) | 0 zł |
| Repozytorium | git, zdalny `origin` już skonfigurowany | 0 zł |
| Hosting | GitHub Pages | 0 zł |
| Baza postów | Arkusz Google (zakładka `Posty`) | 0 zł |
| Backend / API postów | Google Apps Script (Web App) | 0 zł |
| Zdjęcia do postów | Google Drive (pliki udostępniane pojedynczo) | 0 zł |
| Dwujęzyczność | Słownik JS w pliku strony | 0 zł |
| Fonty i ikony | Google Fonts + Tabler Icons (CDN) | 0 zł |
| Domena | np. kortybudowlani.pl | ~50 zł/rok |

### Architektura postów
```
admin.html  ──POST (hasło + treść + zdjęcia)──►  Apps Script
                                                    │
                                    ┌───────────────┴───────────────┐
                                    ▼                               ▼
                            Arkusz Google                    Google Drive
                            (treść postów)                  (pliki zdjęć)
                                    │
index.html / aktualnosci.html ──GET (JSON)──────────┘
```

**Dlaczego tak:**
- Weryfikacja hasła dzieje się **po stronie serwera** (Apps Script), nie w przeglądarce —
  na stronie statycznej hasło w JS to atrapa zabezpieczenia
- Arkusz jest awaryjnym interfejsem: gdyby panel padł, wpis da się dodać ręcznie
- Publikacja jest natychmiastowa — bez przebudowy strony
- Zero nowych zależności: Apps Script już był w projekcie

**Świadomy koszt:** posty ładują się JavaScriptem, więc Google ich nie zaindeksuje.
Dla wizytówki akceptowalne — pozycjonuje treść strony głównej, a ta jest statyczna w HTML.

### Rozdział plików w Apps Script
`Code.gs` (rezerwacje, zamrożone) i `Posty.gs` (aktualności) to osobne pliki w jednym
projekcie. Apps Script pozwala mieć tylko jedną funkcję `doGet` i jedną `doPost`, więc
`Code.gs` pyta `Posty.gs`, czy dana akcja należy do niego — dzięki temu żaden plik nie
musi wiedzieć nic o drugim. Instrukcja łatki jest na dole `Posty.gs`.

### Przełącznik `REZERWACJA_URL`
Jedna stała u góry skryptu w `index.html` steruje wszystkimi pięcioma przyciskami
„Zarezerwuj kort". Pusta = przyciski prowadzą na `rezerwacja-wkrotce.html` w tej samej
karcie. Wypełniona = prowadzą na kluby.org w nowej karcie, z `rel="noopener"`.
Napis na przycisku nie zmienia się w żadnym z tych stanów.

---

## 7. FUNKCJONALNOŚCI

### Aktualności
Cztery typy wpisów (jeden model danych, różne pola opcjonalne):
- **Ogłoszenie** — tytuł, treść, data publikacji
- **Turniej / wydarzenie** — dodatkowo godzina, kategoria, format, wpisowe, zapisy do
  oraz miejsca 1–3; **tylko ten typ zasila widget w hero**
- **Promocja** — dodatkowo data ważności; po jej upływie wpis znika automatycznie
- **Galeria / relacja** — wpis oparty o zdjęcia

Filtrowanie (status, data publikacji w przyszłości, wygasłe promocje) dzieje się
**po stronie serwera** — czego serwer nie wyśle, tego nikt nie odczyta w podglądzie sieci.

### Panel
- Autor: **osoba nietechniczna** (znajomy / recepcja), często z telefonu → panel musi być prosty i odporny na pomyłki
- Wymagane: podgląd przed publikacją, edycja i ukrycie wpisu, czytelne komunikaty błędów
- Logowanie hasłem współdzielonym; hasło w Script Properties, nigdy w kodzie strony
- **Ukrycie** (odwracalne) i **trwałe usunięcie** (z potwierdzeniem) to dwie osobne
  operacje. Mylenie ich kończy się tym, że ludzie boją się jednej i nadużywają drugiej
- **Wyróżnienie** — wpis idzie na górę niezależnie od daty
- Zdjęcia usuniętych wpisów zostają na Dysku (plik może być podlinkowany gdzie indziej)

### Turniej przed terminem i po
To samo miejsce na kafelku pokazuje co innego zależnie od tego, po której stronie
daty jesteśmy: **przed** — plakat, **po** — podium zwycięzców (jeśli wyniki wpisane).
Bez wyników plakat zostaje. Wystarczy samo pierwsze miejsce.

### Dwujęzyczność
PL / EN przełączane w navbarze, strona zawsze startuje po polsku.
**Rozstrzygnięte: posty tylko po polsku** — dwujęzyczne podwajałyby pracę recepcji
przy każdym wpisie, co jest najkrótszą drogą do tego, że nikt nie doda żadnego.

---

## 8. STATUS PROJEKTU

### ✅ Ukończone
- [x] Zebranie wymagań, wybór technologii, kierunek wizualny
- [x] `rezerwacja.html` + `Code.gs` (zamrożone)
- [x] Aktualizacja dokumentacji pod nowy zakres
- [x] `Posty.gs` — backend aktualności, **wdrożony i sprawdzony na żywo 22.09.2026**
      (wdrożenie „v4 - posty", Wersja 6; adres `/exec` bez zmian)
- [x] `index.html` przerobiony na wizytówkę: widget wydarzeń, sekcja Aktualności,
      przełącznik rezerwacji, Cennik, O nas, wzmianki o hali
- [x] `rezerwacja-wkrotce.html`

- [x] `aktualnosci.html` — pełna lista z filtrami
- [x] `admin.html` — panel obsługi, wdrożony i używany
- [x] Podium zwycięzców na zakończonych turniejach
- [x] `ADMIN_PASSWORD` i `DRIVE_FOLDER_ID` w Script Properties
- [x] `liga.html` i `o-nas.html` — dwie podstrony, wpięte w menu i w kafelki oferty
- [x] Jednolity navbar na wszystkich pięciu stronach (naprawia też nachodzenie
      przełącznika PL/EN na logo na telefonie)
- [x] Prawdziwe numery telefonów: stopka `index.html`, `rezerwacja-wkrotce.html`,
      kafelki trenerów

**Kod jest skończony.** Wszystko, co zostało, to dane od klienta.

### ⏭️ Następne kroki — wyłącznie treść
- [ ] Prawdziwy adres e-mail (te same miejsca)
- [ ] Trzy stawki w Cenniku oznaczone `[do uzupełnienia]`
- [ ] Akceptacja tekstu „O nas" przez klienta
- [ ] Link do strony klubu na kluby.org → stała `REZERWACJA_URL` w `index.html`
- [ ] Trzy adresy lig na kluby.org → pola `url` w tablicy `LIGI` w `liga.html`
- [ ] Nazwiska i krótkie opisy trenerów → tablica `TRENERZY` w `o-nas.html`
- [ ] Zdjęcia trenerów (opcjonalnie — bez nich kółka pokazują inicjały)
- [ ] Testy na telefonie z osobą, która realnie będzie dodawać posty
- [ ] Domena (dziś `bloome2115.github.io/korty-budowlani`)

### ⚠️ Znane atrapy na stronie
| Co | Gdzie |
|---|---|
| `kontakt@kortylublin.pl` | stopka `index.html`, `rezerwacja-wkrotce.html` |
| `[do uzupełnienia]` ×3 | tabela cennika w `index.html` |
| Tekst „O nas" | szkic, niezaakceptowany |
| Brak nazwisk i opisów trenerów | tablica `TRENERZY` w `o-nas.html` |
| Puste `url` ×3 | tablica `LIGI` w `liga.html` — przyciski „Zapisy wkrótce" |


---

## 9. PLIKI PROJEKTU

Katalog roboczy na komputerze Daniela:
`D:\- Moje dokumenty\- Pulpit\Projekty\Korty` (repo git z podpiętym `origin`)

```
Korty/
├── PROJECT_CONTEXT.md          ← ten plik
├── claude/
│   ├── DECYZJE_wizytowka_i_posty.md   ← aktualne decyzje
│   └── DECYZJE_hala_i_sterowanie.md   ← częściowo nieaktualny (patrz nagłówek)
├── index.html                  ← strona główna ✅
├── rezerwacja-wkrotce.html     ← podstrona przejściowa ✅
├── aktualnosci.html            ← pełna lista wpisów ✅
├── liga.html                   ← podstrona lig ✅
├── o-nas.html                  ← podstrona o klubie i kadrze ✅
├── admin.html                  ← panel obsługi ✅
├── rezerwacja.html             ← ZAMROŻONE
├── assets/img/
│   ├── Budowlani_bez_tla.png
│   ├── GoRun_serwis_napis_jasny_bez_tla.png
│   └── Zdjecie_kortu_2_poprawione.png
├── apps-script/
│   └── Posty.gs                ← backend aktualności
├── _archiwum/                  ← stare wersje, poza gitem (.gitignore)
└── Claude outputs/             ← zrzuty z rozmowy, też warto dać do .gitignore
```

`Code.gs` żyje wyłącznie w projekcie Apps Script i w projekcie Claude — nie ma go w repo.

---

## 10. NOTATKI I DECYZJE

- Język roboczy z klientem: **polski**
- Strona zawsze startuje po polsku, wybór języka nie jest zapamiętywany między wizytami
- **kluby.org to nowa nazwa korty.org** — ta sama firma, ten sam ekosystem co sterowanie.org.
  Konsekwencja: argument o vendor lock-in, którym odrzuciliśmy ofertę sterowanie.org,
  osłabł — warto wrócić do tej decyzji przy hali
- Rezerwacje idą do kluby.org — nie kontrolujemy tego systemu, więc nie obiecujemy
  klientowi niczego, co od niego zależy
- Hala komunikowana **bez twardej daty** — termin listopadowy potrafi się przesunąć,
  a strona obiecująca coś, czego nie ma, szkodzi bardziej niż milczenie
- `rezerwacja.html` i `Code.gs` (część rezerwacyjna) zamrożone, nie usunięte
- Sterowanie obiektem (Shelly, oświetlenie, ogrzewanie hali) to **osobny wątek** —
  decyzja o odpięciu go od systemu rezerwacji obroniła się przy zmianie systemu

### ⚙️ Pułapka Apps Script — kosztowała nas wieczór, warto pamiętać
**Zapisanie kodu nie tworzy wersji.** Wdrożenie wskazuje na zamrożoną wersję i trzyma
się jej, dopóki mu tego nie zmienisz — można zapisywać plik sto razy, a `/exec` nadal
serwuje stary kod. Nazwa wdrożenia („v4 - posty") też nie mówi prawdy o tym, co w nim
jest; liczy się numer wersji pod spodem.

Procedura po każdej zmianie w `.gs`:
1. **Ctrl+S** w każdym zmienionym pliku osobno
2. **Wdróż → Zarządzaj wdrożeniami → ołówek → Wersja: Nowa wersja → Wdróż**
3. Sprawdź `…/exec?action=postyVersion`

Diagnostyka, gdy coś nie gra: adres `/dev` (Wdróż → Przetestuj wdrożenia) zawsze
uruchamia najnowszy **zapisany** kod. Jeśli `/dev` działa, a `/exec` nie — problem
jest wyłącznie we wdrożeniu, nie w kodzie. To rozstrzyga w 30 sekund.

---

## 11. PUŁAPKI, KTÓRE NAS KOSZTOWAŁY CZAS

Trzy rzeczy, które objawiały się jako „nie działa" bez żadnej wskazówki, gdzie szukać.
Każda wróci przy kolejnym projekcie na tym stacku.

### Arkusze same poprawiają to, co im wpiszesz
Wpisane `14:00` przestaje być tekstem i staje się wartością czasu — zapisaną jako
30 grudnia 1899, bo to zerowa data ich kalendarza. Na stronie pojawia się wtedy
`Sat Dec 30 1899 14:00:00 GMT+0124`.

**Zabezpieczenie dwustronne:** kolumny `godzina` i `wpisowe` mają wymuszony format
tekstowy (przy każdym zapisie i na całej kolumnie przy `setupPosty`), a odczyt
rozpoznaje obiekty daty i formatuje je z powrotem. Zasada ogólna:
**przy zapisie bądź rygorystyczny, przy odczycie wyrozumiały.**

### Konfiguracja w kodzie ginie przy podmianie pliku
`DRIVE_FOLDER_ID` stało kiedyś w `POSTY_CONFIG`. Przy aktualizacji `Posty.gs`
wkleja się cały plik — i ID zniknęło razem ze starą wersją, a upload zdjęć przestał
działać bez widocznego powodu. Teraz siedzi w Script Properties, obok hasła.
**Co różni się między instalacjami, nie należy do kodu.**

### Numery kolumn liczone z nazw, nie wpisane ręcznie
`hidePost_` zapisywało znacznik czasu do „ostatniej kolumny" — a ostatnia przestała
być tą, o którą chodziło, gdy doszły pola turniejowe. Data lądowała w `zapisy_do`.
Stała `COL` buduje numery z `POSTY_HEADERS`, więc taki błąd nie ma jak powstać.
Stąd też reguła: **nowe kolumny dokładamy zawsze na końcu** — wstawienie w środku
przesunęłoby dane we wszystkich istniejących wierszach.

### I jedna zasada interfejsu
Apps Script odpowiada 1–3 sekundy. Przyciski w panelu zmieniają stan **najpierw na
ekranie, potem na serwerze** — inaczej kliknięcie wygląda na nieskuteczne i człowiek
klika trzy razy. Przy odmowie serwera zmiana się cofa i pokazuje powód.
