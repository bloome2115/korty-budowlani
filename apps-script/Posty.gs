/**
 * ============================================================
 * KORTY BUDOWLANI LUBLIN / GORUN AKADEMIA TENISA
 * Backend AKTUALNOŚCI (postów) — Google Apps Script
 * ============================================================
 *
 * Ten plik dokładamy OBOK Code.gs w tym samym projekcie Apps Script.
 * Code.gs zostaje nietknięty poza jedną małą łatką w routingu
 * (patrz komentarz "ŁATKA DO Code.gs" na samym dole tego pliku).
 *
 * DLACZEGO OSOBNY PLIK:
 *   Rezerwacje i aktualności to dwie niezależne sprawy. Rezerwacje są
 *   zamrożone (klient poszedł na korty.org), aktualności dopiero
 *   powstają. Trzymanie ich osobno znaczy, że grzebiąc w postach nie
 *   masz jak przypadkiem zepsuć rezerwacji — a gdyby rezerwacje kiedyś
 *   wróciły, nie trzeba niczego rozplątywać.
 *
 * ARCHITEKTURA:
 *   doGet(e)  -> ?action=posts          publiczna lista postów (dla strony)
 *               ?action=postsAdmin      wszystkie posty, też szkice (wymaga sesji)
 *   doPost(e) -> action="login"         sprawdza hasło, wydaje token sesji
 *               action="savePost"       tworzy albo aktualizuje post
 *               action="deletePost"     ukrywa post (wiersz zostaje)
 *               action="purgePost"     usuwa wiersz NA ZAWSZE
 *               action="uploadImage"    wrzuca zdjęcie na Drive, zwraca URL
 *
 * ZASADA BEZPIECZEŃSTWA:
 *   Hasło NIGDY nie trafia do kodu strony. admin.html wysyła je tutaj,
 *   tu jest porównywane z wartością ze Script Properties, i tu zapada
 *   decyzja. Przeglądarka dostaje wyłącznie token sesji, który sam
 *   z siebie nic nie znaczy poza tym serwerem i wygasa.
 * ============================================================
 */

/* ============================================================
   KONFIGURACJA POSTÓW
   ============================================================ */
const POSTY_CONFIG = {
  // Ten sam arkusz co rezerwacje, ale osobna zakładka.
  // Jeden plik = jedno miejsce do pilnowania uprawnień.
  SHEET_ID: '1aQ2MSbqAJAvZzYumEO1ILstigGckJ5N4w7hhxEDwq1s',
  SHEET_NAME: 'Posty',

  /* ID folderu na zdjęcia NIE stoi już tutaj — czytamy je ze Script
     Properties, klucz DRIVE_FOLDER_ID (tak samo jak hasło).

     DLACZEGO SIĘ PRZENIOSŁO: przy aktualizacji tego pliku podmienia się
     całą jego zawartość, więc ID wpisane w kodzie ginie razem ze starą
     wersją — i upload przestaje działać bez żadnego widocznego powodu.
     Właściwości skryptu żyją poza kodem i przeżywają każdą podmianę.
     Zasada ogólna: co różni się między instalacjami, nie należy do kodu. */

  // Ile trwa sesja w panelu. CacheService przechowuje maksymalnie
  // 6 godzin, więc to jest sufit, nie nasz wybór.
  SESSION_TTL_SECONDS: 21600,

  // Ochrona przed zgadywaniem hasła: tyle nieudanych prób na okno czasowe.
  MAX_LOGIN_ATTEMPTS: 10,
  LOGIN_WINDOW_SECONDS: 900, // 15 minut

  MAX_IMAGE_BYTES: 8 * 1024 * 1024, // 8 MB po stronie serwera; panel i tak zmniejsza zdjęcia wcześniej
};

const POSTY_VERSION = '2026-09-28-g';

// Kolumny arkusza. KOLEJNOŚĆ MA ZNACZENIE — czyta ją cały ten plik.
// Dopisując nową kolumnę, dodaj ją NA KOŃCU, nigdy w środku.
const POSTY_HEADERS = [
  'id',               // A — nadawany raz, nigdy nie zmieniany
  'status',           // B — szkic / opublikowany / ukryty
  'typ',              // C — ogloszenie / turniej / promocja / galeria
  'data_publikacji',  // D — steruje kolejnością na stronie
  'tytul',            // E
  'tresc',            // F
  'data_wydarzenia',  // G — tylko turniej
  'wazny_do',         // H — tylko promocja; po tej dacie post znika sam
  'zdjecia',          // I — adresy z Drive, oddzielone przecinkiem
  'autor',            // J
  'zaktualizowano',   // K — automatyczny znacznik ostatniej zmiany
  // ── Poniższe dotyczą wyłącznie wpisów typu "turniej" ──
  // Osobne kolumny, a nie jedno pole tekstowe, bo tylko wtedy strona
  // może te informacje WYŚWIETLIĆ JAKO LISTĘ. Z ciągłego zdania
  // dałoby się je wyciągnąć jedynie zgadywaniem.
  'kategoria',        // L — np. singiel open, debel mikst
  'format',           // M — np. system grupowy, do dwóch wygranych setów
  'wpisowe',          // N — tekst, nie liczba: bywa "60 zł od osoby"
  'zapisy_do',        // O — data zamknięcia zapisów
  'wyrozniony',       // P — "tak" = wpis idzie na górę niezależnie od daty
  // Tekst, nie godzina: na plakatach bywa "14:00 / 15:00" albo "od 9:00".
  // Sztywne pole czasu zmusiłoby recepcję do wybrania jednej wartości
  // i przepisania plakatu na swoje — czyli do wprowadzenia rozbieżności.
  'godzina',          // Q — godzina rozpoczęcia, tylko turniej
  // Wyniki uzupełniane PO turnieju. Trzy osobne kolumny, nie jedno pole
  // "zwycięzcy": strona rysuje z nich podium, a do tego musi wiedzieć,
  // kto zajął które miejsce. Z jednego zdania by tego nie wyczytała.
  'miejsce_1',        // R
  'miejsce_2',        // S
  'miejsce_3',        // T
];

/* Numery kolumn liczone z nazw, a nie wpisane ręcznie.
   POWÓD Z ŻYCIA: po dodaniu kolumn turniejowych funkcja hidePost_
   zapisywała znacznik czasu do POSTY_HEADERS.length, czyli do "ostatniej
   kolumny" — a ostatnia przestała być tą, o którą chodziło, i data lądowała
   w polu "zapisy_do". Przy nazwach taki błąd nie ma jak powstać. */
const COL = {};
POSTY_HEADERS.forEach(function (name, i) { COL[name] = i + 1; });

const POSTY_TYPES = ['ogloszenie', 'turniej', 'promocja', 'galeria'];
const POSTY_STATUSES = ['szkic', 'opublikowany', 'ukryty'];

/* ============================================================
   ROUTING — wywoływane z doGet/doPost w Code.gs
   ============================================================ */

/**
 * Zwraca odpowiedź dla akcji GET związanych z postami,
 * albo null jeśli ta akcja nie należy do tego pliku.
 *
 * DLACZEGO null, A NIE BŁĄD: dzięki temu Code.gs może najpierw zapytać
 * "czy to twoje?", a dopiero potem obsłużyć własne akcje. Żaden z plików
 * nie musi wiedzieć, jakie akcje zna ten drugi.
 */
function routePostyGet_(e) {
  const action = e.parameter.action;

  if (action === 'postyVersion') {
    return { version: POSTY_VERSION };
  }

  if (action === 'posts') {
    return { posts: getPublicPosts_() };
  }

  if (action === 'postsAdmin') {
    requireSession_(e.parameter.session);
    return { posts: getAllPosts_() };
  }

  return null;
}

function routePostyPost_(body) {
  const action = body.action;

  if (action === 'login') {
    return login_(body.password);
  }

  if (action === 'savePost') {
    requireSession_(body.session);
    return savePost_(body.post);
  }

  if (action === 'deletePost') {
    requireSession_(body.session);
    return hidePost_(body.id);
  }

  if (action === 'purgePost') {
    requireSession_(body.session);
    return purgePost_(body.id);
  }

  if (action === 'uploadImage') {
    requireSession_(body.session);
    return uploadImage_(body.filename, body.mimeType, body.dataBase64);
  }

  return null;
}

/* ============================================================
   LOGOWANIE I SESJE
   ============================================================ */

/**
 * Sprawdza hasło i wydaje token sesji.
 *
 * Hasło siedzi w Script Properties pod kluczem ADMIN_PASSWORD.
 * Ustawiasz je raz: Ustawienia projektu (zębatka) > Script Properties.
 * Zmiana hasła = zmiana tej jednej wartości, bez dotykania kodu i bez
 * ponownego wdrażania strony.
 */
function login_(password) {
  const cache = CacheService.getScriptCache();

  // Ochrona przed zgadywaniem: liczymy nieudane próby w oknie czasowym.
  // To nie jest twierdza — ma tylko sprawić, żeby zgadywanie hasła
  // metodą "próbuj wszystko" przestało być opłacalne.
  const attemptsKey = 'login_attempts';
  const attempts = parseInt(cache.get(attemptsKey) || '0', 10);
  if (attempts >= POSTY_CONFIG.MAX_LOGIN_ATTEMPTS) {
    throw new Error('Za dużo nieudanych prób logowania. Spróbuj ponownie za kilkanaście minut.');
  }

  const expected = getSecret_('ADMIN_PASSWORD');
  const given = String(password || '');

  if (given !== expected) {
    cache.put(attemptsKey, String(attempts + 1), POSTY_CONFIG.LOGIN_WINDOW_SECONDS);
    // Celowo NIE mówimy, co było nie tak. Komunikat "złe hasło" vs
    // "nie ma takiego użytkownika" to darmowa podpowiedź dla kogoś,
    // kto próbuje się dostać.
    throw new Error('Nieprawidłowe hasło.');
  }

  cache.remove(attemptsKey);

  const token = Utilities.getUuid();
  cache.put('sess_' + token, 'valid', POSTY_CONFIG.SESSION_TTL_SECONDS);

  return { success: true, session: token, expiresInSeconds: POSTY_CONFIG.SESSION_TTL_SECONDS };
}

/**
 * Przepuszcza dalej tylko z ważną sesją. Rzuca wyjątkiem, gdy jej nie ma.
 *
 * Wołamy to na POCZĄTKU każdej akcji wymagającej uprawnień — nigdy
 * "gdzieś w środku". Jeśli sprawdzenie jest pierwszą linijką, nie da się
 * przypadkiem dopisać nad nim kodu, który wykona się bez sprawdzenia.
 */
function requireSession_(session) {
  if (!session) throw new Error('Brak sesji — zaloguj się ponownie.');
  const value = CacheService.getScriptCache().get('sess_' + session);
  if (!value) throw new Error('Sesja wygasła — zaloguj się ponownie.');
}

/* ============================================================
   ARKUSZ POSTÓW
   ============================================================ */
function getPostySheet_() {
  const spreadsheet = SpreadsheetApp.openById(POSTY_CONFIG.SHEET_ID);
  let sheet = spreadsheet.getSheetByName(POSTY_CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(POSTY_CONFIG.SHEET_NAME);
    sheet.appendRow(POSTY_HEADERS);
    sheet.getRange(1, 1, 1, POSTY_HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    return sheet;
  }

  /* MIGRACJA — dopisuje kolumny, które doszły już po utworzeniu zakładki.
     Bez tego arkusz założony we wrześniu nigdy nie dostałby kolumn
     turniejowych: warunek wyżej tworzy nagłówki TYLKO przy zakładaniu
     zakładki od zera. Zapis nowych pól trafiałby w pustkę, a odczyt
     zwracałby undefined — i to bez żadnego komunikatu o błędzie.

     Dlatego właśnie nowe kolumny dokładamy zawsze NA KOŃCU listy:
     dopisanie w środku przesunęłoby wszystkie dane w istniejących
     wierszach o jedną kolumnę w prawo. */
  const currentLastCol = sheet.getLastColumn();
  if (currentLastCol < POSTY_HEADERS.length) {
    sheet.getRange(1, currentLastCol + 1, 1, POSTY_HEADERS.length - currentLastCol)
      .setValues([POSTY_HEADERS.slice(currentLastCol)])
      .setFontWeight('bold');
    Logger.log('Migracja: dopisano kolumny ' + POSTY_HEADERS.slice(currentLastCol).join(', '));
  }

  return sheet;
}

/**
 * Zamienia wiersz arkusza na obiekt posta.
 *
 * Daty konwertujemy na tekst RRRR-MM-DD, bo przeglądarka i tak dostanie
 * JSON, a data w JSON-ie to zawsze tekst. Robiąc konwersję tutaj, mamy
 * jedno miejsce, w którym o tym decydujemy, zamiast rozsypanego po
 * całym froncie zgadywania, co przyszło z serwera.
 */
function rowToPost_(row) {
  return {
    id: String(row[0] || ''),
    status: String(row[1] || ''),
    typ: String(row[2] || ''),
    data_publikacji: dateToIso_(row[3]),
    tytul: String(row[4] || ''),
    tresc: String(row[5] || ''),
    data_wydarzenia: dateToIso_(row[6]),
    wazny_do: dateToIso_(row[7]),
    zdjecia: String(row[8] || '').split(',').map(s => s.trim()).filter(Boolean),
    autor: String(row[9] || ''),
    zaktualizowano: dateToIso_(row[10]),
    kategoria: String(row[COL.kategoria - 1] || ''),
    format: String(row[COL.format - 1] || ''),
    wpisowe: String(row[COL.wpisowe - 1] || ''),
    zapisy_do: dateToIso_(row[COL.zapisy_do - 1]),
    // Zapisujemy słowo "tak", żeby człowiek otwierający arkusz od razu
    // rozumiał kolumnę. Czytamy szerzej: ktoś poprawiający wpis ręcznie
    // napisze TRUE, PRAWDA albo postawi iks — i ma prawo oczekiwać,
    // że zadziała. Wyrozumiałość przy czytaniu, konsekwencja przy zapisie.
    wyrozniony: ['tak', 'true', 'prawda', 'x', '1']
      .indexOf(String(row[COL.wyrozniony - 1] || '').trim().toLowerCase()) !== -1,
    godzina: timeToText_(row[COL.godzina - 1]),
    miejsce_1: String(row[COL.miejsce_1 - 1] || '').trim(),
    miejsce_2: String(row[COL.miejsce_2 - 1] || '').trim(),
    miejsce_3: String(row[COL.miejsce_3 - 1] || '').trim(),
  };
}

/**
 * Zamienia zawartość pola "godzina" na czytelny tekst.
 *
 * PROBLEM: Arkusze Google same interpretują to, co wygląda na liczbę lub
 * datę. Wpisane "14:00" przestaje być napisem i staje się wartością czasu,
 * zapisaną jako 30 grudnia 1899 o 14:00 (to zerowa data ich kalendarza).
 * Odczytane przez String() daje potworka w rodzaju
 * "Sat Dec 30 1899 14:00:00 GMT+0124".
 *
 * Zapisowi zapobiegamy wymuszając format tekstowy (patrz savePost_),
 * ale wiersze zapisane wcześniej trzeba umieć odczytać — stąd ta funkcja.
 * Zasada: przy zapisie bądź rygorystyczny, przy odczycie wyrozumiały.
 */
function timeToText_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, CONFIG.TIMEZONE, 'HH:mm');
  }
  return String(value == null ? '' : value).trim();
}

function dateToIso_(value) {
  if (!value) return '';
  if (value instanceof Date) {
    return Utilities.formatDate(value, CONFIG.TIMEZONE, 'yyyy-MM-dd');
  }
  return String(value).trim();
}

function getAllPosts_() {
  const sheet = getPostySheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, POSTY_HEADERS.length).getValues();
  return values
    .filter(row => row[0]) // wiersze bez id to śmieci albo pusty wiersz na dole
    .map(rowToPost_)
    .sort(function (a, b) {
      // Wyróżnione zawsze przed resztą, wewnątrz każdej grupy od najnowszego.
      if (a.wyrozniony !== b.wyrozniony) return a.wyrozniony ? -1 : 1;
      return (b.data_publikacji || '').localeCompare(a.data_publikacji || '');
    });
}

/**
 * Lista dla strony publicznej.
 *
 * Filtrowanie robimy TU, a nie w przeglądarce. Gdyby szkice jechały do
 * przeglądarki i dopiero tam były ukrywane, wystarczyłoby otworzyć
 * podgląd sieci, żeby przeczytać nieopublikowaną treść. Czego serwer
 * nie wyśle, tego nikt nie odczyta.
 */
function getPublicPosts_() {
  const today = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd');

  return getAllPosts_().filter(function (post) {
    if (post.status !== 'opublikowany') return false;

    // Post z datą publikacji w przyszłości = zaplanowany, jeszcze nie pokazujemy
    if (post.data_publikacji && post.data_publikacji > today) return false;

    // Promocja po terminie znika sama — bez tego recepcja musiałaby
    // pamiętać o ręcznym sprzątaniu, a nie będzie
    if (post.wazny_do && post.wazny_do < today) return false;

    return true;
  });
}

/* ============================================================
   ZAPIS POSTA
   ============================================================ */

/**
 * Tworzy nowy post (gdy brak id) albo aktualizuje istniejący.
 *
 * Walidacja jest tu, a nie tylko w panelu. Panel sprawdza dane, żeby
 * pomóc piszącemu; serwer sprawdza je, żeby chronić dane. To dwie różne
 * role i dlatego robimy to dwa razy — sprawdzenie w przeglądarce można
 * ominąć w 10 sekund.
 */
function savePost_(post) {
  if (!post) throw new Error('Brak danych posta.');

  const typ = String(post.typ || '').trim();
  const status = String(post.status || 'szkic').trim();
  const tytul = String(post.tytul || '').trim();
  const tresc = String(post.tresc || '').trim();

  if (POSTY_TYPES.indexOf(typ) === -1) {
    throw new Error('Nieznany typ wpisu: ' + typ);
  }
  if (POSTY_STATUSES.indexOf(status) === -1) {
    throw new Error('Nieznany status wpisu: ' + status);
  }
  if (!tytul) throw new Error('Wpis musi mieć tytuł.');

  const zdjecia = Array.isArray(post.zdjecia) ? post.zdjecia.filter(Boolean) : [];

  /* KOMPLETNOŚCI WYMAGAMY DOPIERO OD WPISU PUBLIKOWANEGO.
     Szkic z definicji jest niedokończony — to jego jedyny sens. Wcześniej
     te reguły działały tu bez wyjątku, więc panel przepuszczał szkic
     (bo o statusie wiedział), a serwer go odrzucał komunikatem „Wpis musi
     mieć treść". Sprawdzenie musi znać status, inaczej dwie warstwy
     walidacji mówią co innego — a wygrywa ta, która mówi „nie". */
  if (status === 'opublikowany') {
    if (typ === 'galeria' && zdjecia.length === 0) {
      throw new Error('Wpis typu galeria musi mieć przynajmniej jedno zdjęcie.');
    }
    if (typ !== 'galeria' && !tresc) {
      throw new Error('Wpis musi mieć treść.');
    }
    if (typ === 'turniej' && !post.data_wydarzenia) {
      throw new Error('Wpis o turnieju musi mieć datę wydarzenia.');
    }
    if (typ === 'promocja' && !post.wazny_do) {
      throw new Error('Promocja musi mieć datę, do kiedy obowiązuje.');
    }
  }

  const sheet = getPostySheet_();
  const now = new Date();
  const dataPublikacji = post.data_publikacji ||
    Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy-MM-dd');

  const rowValues = [
    post.id || Utilities.getUuid(),
    status,
    typ,
    dataPublikacji,
    tytul,
    tresc,
    post.data_wydarzenia || '',
    post.wazny_do || '',
    zdjecia.join(', '),
    String(post.autor || '').trim(),
    Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm'),
    // Pola turniejowe zapisujemy tylko dla turnieju. Gdyby zostawały
    // po zmianie typu wpisu, w arkuszu leżałyby dane, których strona
    // nigdy nie pokaże — a ktoś czytający arkusz brałby je za prawdę.
    typ === 'turniej' ? String(post.kategoria || '').trim() : '',
    typ === 'turniej' ? String(post.format || '').trim() : '',
    typ === 'turniej' ? String(post.wpisowe || '').trim() : '',
    typ === 'turniej' ? String(post.zapisy_do || '').trim() : '',
    post.wyrozniony ? 'tak' : '',
    typ === 'turniej' ? String(post.godzina || '').trim() : '',
    typ === 'turniej' ? String(post.miejsce_1 || '').trim() : '',
    typ === 'turniej' ? String(post.miejsce_2 || '').trim() : '',
    typ === 'turniej' ? String(post.miejsce_3 || '').trim() : '',
  ];

  // Blokada na czas odczytu + zapisu. Dwie osoby zapisujące jednocześnie
  // to mało prawdopodobne przy jednej recepcji, ale kosztuje nas to jedną
  // linijkę, a bez tego dwa równoległe zapisy potrafią wylądować w tym
  // samym wierszu i jeden z nich po prostu znika.
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const existingRow = post.id ? findRowById_(sheet, post.id) : -1;
    let row;
    let created;

    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, POSTY_HEADERS.length).setValues([rowValues]);
      row = existingRow;
      created = false;
    } else {
      sheet.appendRow(rowValues);
      row = sheet.getLastRow();
      created = true;
    }

    /* WYMUSZENIE FORMATU TEKSTOWEGO na polach, które Arkusze lubią
       „poprawiać". "14:00" zamieniłoby się w wartość czasu, a "1/2"
       w datę — i wpis wracałby ze strony w formie, której nikt nie wpisał.
       Format ustawiamy PO zapisie i od razu wpisujemy wartość ponownie,
       bo samo ustawienie formatu nie cofa już dokonanej konwersji. */
    [COL.godzina, COL.wpisowe].forEach(function (kolumna) {
      const cel = sheet.getRange(row, kolumna);
      cel.setNumberFormat('@');
      cel.setValue(rowValues[kolumna - 1]);
    });

    return { success: true, id: rowValues[0], created: created };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Zmienia status na "ukryty" zamiast kasować wiersz.
 *
 * DLACZEGO NIE USUWAMY: skasowany wiersz w arkuszu jest nie do
 * odzyskania jednym kliknięciem, a osoba, która przez pomyłkę usunie
 * relację z turnieju razem ze zdjęciami, zadzwoni do Ciebie. Ukrycie
 * daje ten sam efekt na stronie i jest odwracalne.
 */
function hidePost_(id) {
  if (!id) throw new Error('Brak id wpisu.');

  const sheet = getPostySheet_();
  const row = findRowById_(sheet, id);
  if (row < 0) throw new Error('Nie znaleziono wpisu o id ' + id);

  sheet.getRange(row, COL.status).setValue('ukryty');
  sheet.getRange(row, COL.zaktualizowano).setValue(
    Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm')
  );

  return { success: true, id: id };
}

/**
 * Usuwa wiersz z arkusza NA ZAWSZE. Odwrotność hidePost_.
 *
 * DLACZEGO ISTNIEJE OBOK UKRYWANIA: ukrycie jest właściwe dla wpisu, który
 * spełnił swoją rolę i może kiedyś wrócić. Ale szkic zrobiony przez pomyłkę
 * albo wpis testowy nie ma po co zalegać w arkuszu i zaśmiecać listy.
 * Dwie różne potrzeby, dwie różne operacje — mylenie ich kończy się tym,
 * że ludzie boją się jednej i nadużywają drugiej.
 *
 * DLACZEGO BLOKADA: między odnalezieniem wiersza a jego usunięciem inny
 * zapis mógłby dodać wiersz i przesunąć numerację. Usunęlibyśmy wtedy
 * NIE TEN wpis — błąd cichy i nieodwracalny. Blokada zamyka tę szczelinę.
 *
 * Zdjęć z Dysku nie ruszamy. Plik może być podlinkowany gdzie indziej,
 * a kasowanie cudzych danych „przy okazji" to zła zasada.
 */
function purgePost_(id) {
  if (!id) throw new Error('Brak id wpisu.');

  const sheet = getPostySheet_();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const row = findRowById_(sheet, id);
    if (row < 0) throw new Error('Nie znaleziono wpisu o id ' + id + '. Mógł już zostać usunięty.');

    const tytul = sheet.getRange(row, COL.tytul).getValue();
    sheet.deleteRow(row);

    // Zostawiamy ślad w logu — to jedyna rzecz, jaka po wpisie zostaje.
    Logger.log('USUNIĘTO TRWALE: "' + tytul + '" (id ' + id + ')');

    return { success: true, id: id, tytul: String(tytul) };
  } finally {
    lock.releaseLock();
  }
}

function findRowById_(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === String(id).trim()) {
      return i + 2; // +2: nagłówek zajmuje wiersz 1, a liczymy od 1
    }
  }
  return -1;
}

/* ============================================================
   ZDJĘCIA — Google Drive
   ============================================================ */

/**
 * Zapisuje zdjęcie na Drive i zwraca adres, którego można użyć w <img>.
 *
 * Panel wysyła plik zakodowany w base64 (tekstem), bo Apps Script Web App
 * nie obsługuje wieloczęściowych formularzy w sposób, na którym dałoby się
 * polegać. Base64 puchnie o ~33%, dlatego panel zmniejsza zdjęcie
 * PRZED wysłaniem — zdjęcie prosto z telefonu ma 4–8 MB, a do internetu
 * i tak nikt nie potrzebuje więcej niż ~1600 px szerokości.
 */
function getDriveFolderId_() {
  const id = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID');
  if (!id) {
    throw new Error(
      'Nie ustawiono folderu na zdjęcia. W Apps Script: Ustawienia projektu ' +
      '(zębatka) > Właściwości skryptu > Dodaj właściwość: DRIVE_FOLDER_ID, ' +
      'a jako wartość ID folderu z Dysku (fragment adresu po /folders/).'
    );
  }
  return id;
}

function uploadImage_(filename, mimeType, dataBase64) {
  if (!dataBase64) throw new Error('Brak danych pliku.');
  if (String(mimeType || '').indexOf('image/') !== 0) {
    throw new Error('Dozwolone są tylko pliki graficzne.');
  }
  const folderId = getDriveFolderId_();

  const bytes = Utilities.base64Decode(dataBase64);
  if (bytes.length > POSTY_CONFIG.MAX_IMAGE_BYTES) {
    throw new Error('Zdjęcie jest za duże (limit ' +
      Math.round(POSTY_CONFIG.MAX_IMAGE_BYTES / 1024 / 1024) + ' MB).');
  }

  const safeName = String(filename || 'zdjecie')
    .replace(/[^\w.\-]+/g, '_')
    .slice(0, 80);

  const blob = Utilities.newBlob(bytes, mimeType,
    Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyyMMdd-HHmmss') + '-' + safeName);

  const folder = DriveApp.getFolderById(folderId);
  const file = folder.createFile(blob);

  // Plik musi być publiczny, inaczej <img> na stronie pokaże pustą ramkę.
  // Ustawiamy to per plik, nie na całym folderze — jeśli kiedyś wrzucisz
  // do tego folderu coś przez pomyłkę, nie stanie się automatycznie jawne.
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // UWAGA NA FORMAT ADRESU: popularny wariant drive.google.com/uc?export=view
  // bywa przez Google dławiony przy większym ruchu i potrafi zwrócić stronę
  // ostrzeżenia zamiast obrazka. Adres lh3.googleusercontent.com/d/<id>
  // serwuje obrazek bezpośrednio i zachowuje się przewidywalnie.
  const url = 'https://lh3.googleusercontent.com/d/' + file.getId();

  return { success: true, url: url, fileId: file.getId() };
}

/* ============================================================
   URUCHOM RĘCZNIE JEDEN RAZ przy konfiguracji
   ============================================================ */

/**
 * Tworzy zakładkę "Posty" z nagłówkami i wstawia jeden przykładowy wpis,
 * żeby od razu było widać, czy strona poprawnie go czyta.
 * Bezpieczne do uruchomienia wielokrotnie — nie duplikuje nagłówków.
 */
function setupPosty() {
  const sheet = getPostySheet_();

  if (sheet.getLastRow() < 2) {
    savePost_({
      typ: 'ogloszenie',
      status: 'opublikowany',
      tytul: 'Testowy wpis',
      tresc: 'Jeśli to widzisz na stronie, połączenie z arkuszem działa. Ten wpis możesz ukryć z panelu.',
      autor: 'system',
    });
  }

  Logger.log('Zakładka "' + POSTY_CONFIG.SHEET_NAME + '" gotowa. Wierszy: ' + (sheet.getLastRow() - 1));

  // Wypisujemy prawdziwe nagłówki z arkusza i porównujemy z oczekiwanymi.
  // To jedno spojrzenie rozstrzyga, czy migracja kolumn się wykonała —
  // bez tego brak kolumny objawia się jako "funkcja nie działa", bez
  // żadnej wskazówki gdzie szukać.
  /* Ustawiamy format tekstowy na całych kolumnach, nie tylko w nowych
     wierszach — dzięki temu wartości wpisywane RĘCZNIE w arkuszu też
     nie zamienią się w daty. Bezpieczne przy wielokrotnym uruchomieniu. */
  [COL.godzina, COL.wpisowe].forEach(function (kolumna) {
    sheet.getRange(2, kolumna, Math.max(sheet.getMaxRows() - 1, 1), 1).setNumberFormat('@');
  });
  Logger.log('Kolumny godzina i wpisowe ustawione na format tekstowy.');

  const realHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  Logger.log('Kolumny w arkuszu (' + realHeaders.length + '): ' + realHeaders.join(', '));
  const missing = POSTY_HEADERS.filter(h => realHeaders.indexOf(h) === -1);
  Logger.log(missing.length
    ? 'BRAKUJE KOLUMN: ' + missing.join(', ')
    : 'Wszystkie oczekiwane kolumny są na miejscu.');
  // Obie wartości sprawdzamy TU i głośno, zamiast czekać, aż odezwą się
  // w najgorszym momencie — czyli gdy recepcja pierwszy raz wrzuci zdjęcie.
  const props = PropertiesService.getScriptProperties();
  Logger.log('ADMIN_PASSWORD ustawione: ' + (props.getProperty('ADMIN_PASSWORD') ? 'TAK' : 'NIE  <-- panel nie wpuści nikogo'));
  Logger.log('DRIVE_FOLDER_ID ustawione: ' + (props.getProperty('DRIVE_FOLDER_ID') ? 'TAK' : 'NIE  <-- upload zdjęć nie zadziała'));
}

/** Diagnostyka: pokazuje, co zobaczy strona publiczna. Nic nie zapisuje. */
function testPublicPosts() {
  Logger.log('Wersja: ' + POSTY_VERSION);
  Logger.log(JSON.stringify(getPublicPosts_(), null, 2));
}

/* ============================================================
   ŁATKA DO Code.gs
   ============================================================
   W Code.gs, w funkcji doGet, TUŻ POD linią `const action = e.parameter.action;`
   wstaw:

       const postyGet = routePostyGet_(e);
       if (postyGet !== null) return jsonResponse_(postyGet);

   W Code.gs, w funkcji doPost, TUŻ POD linią `const body = JSON.parse(...)`
   wstaw:

       const postyPost = routePostyPost_(body);
       if (postyPost !== null) return jsonResponse_(postyPost);

   To wszystko. Reszta Code.gs zostaje bez zmian.

   DLACZEGO TAK, A NIE PRZEZ SKOPIOWANIE KODU DO Code.gs:
   Apps Script pozwala mieć tylko JEDNĄ funkcję doGet i JEDNĄ doPost
   w całym projekcie — to jest twarde ograniczenie platformy. Ale te
   funkcje mogą pytać innych plików "czy to twoja akcja?". Dzięki temu
   Code.gs nie musi wiedzieć nic o postach, a Posty.gs nic o rezerwacjach.

   PO WKLEJENIU: podnieś CODE_VERSION w Code.gs i zrób NOWE WDROŻENIE
   (Deploy > Manage deployments > ołówek > New version). Bez tego adres
   /exec dalej serwuje starą wersję — to ta sama pułapka, która kiedyś
   kosztowała Cię pół wieczora przy logToSheet_.
   ============================================================ */
