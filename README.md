# Sonno: sklep z jedną poduszką (JUSKYS XL)

Sklep jednego produktu w języku polskim: galeria, wybór zestawu, Stripe Checkout (PLN), wybór paczkomatu InPost,
przesyłki InPost ShipX po opłaceniu i e-maile. „Sonno” to nazwa sklepu. Nazwa produktu pochodzi od właściciela sklepu.

**Stan:** strona i cały przepływ działają w trybie testowym. Bez kluczy płatności i przesyłek nie udajemy, że zamówienie
można opłacić. Nie ma wdrożenia (GitHub i Vercel nie są podłączone).

## Uruchomienie

```bash
npm install
cp .env.example .env.local   # uzupełnij, co jest potrzebne (patrz niżej)
npm run dev                  # http://localhost:3000
npm run build                # build produkcyjny
npm test                     # testy: kwoty, walidacja, webhook, idempotencja, przesyłki
npm run typecheck
```

## Architektura

| Obszar | Pliki |
| --- | --- |
| Dane produktu, ceny, dostawa, FAQ, galeria | `config/store.ts` (jedyne źródło prawdy) |
| Kwoty i walidacja zamówienia (wspólne dla serwera i przeglądarki) | `lib/checkout.ts`, `lib/pricing.ts` |
| Składanie zamówienia | `app/api/checkout/route.ts` |
| Webhook Stripe (potwierdzenie płatności) | `app/api/stripe/webhook/route.ts` |
| Magazyn zamówień (plik JSON, tylko do rozwoju) | `lib/server/orders.ts` |
| Realizacja po płatności (e-mail, przesyłka, idempotencja) | `lib/server/fulfillment.ts` |
| InPost ShipX | `lib/server/inpost.ts` |
| E-mail (Resend, a bez klucza zapis do `.data/outbox`) | `lib/server/email.ts`, `lib/server/emails.ts` |
| Stan integracji (bez sekretów w przeglądarce) | `lib/server/integrations.ts` |
| Strona produktu i galeria | `components/product/*`, `app/page.tsx` |
| Zamówienie i sukces | `app/zamowienie/*`, `components/checkout/*` |

## Zmienne środowiskowe

Pełna lista z opisami: `.env.example`. Krótko:

| Zmienna | Do czego | Bez niej |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Stripe Checkout | 503 „płatności nie są uruchomione” |
| `STRIPE_WEBHOOK_SECRET` | Podpis webhooka | webhook odrzucany (503) |
| `NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN` | Mapa paczkomatów | komunikat zamiast mapy |
| `INPOST_API_TOKEN`, `INPOST_ORGANIZATION_ID` | Tworzenie przesyłek | przesyłka w stanie „czeka na konfigurację” |
| `RESEND_API_KEY`, `EMAIL_FROM` | Wysyłka e-maili | e-maile zapisywane w `.data/outbox` |

## Konfiguracja w `config/store.ts`

Pola `null` to dane, których nie potwierdzono. Strona pokazuje je jako „do potwierdzenia”:

- `shipping.paczkomat.priceGross` i `shipping.kurier.priceGross`: cena dostawy w zł brutto. Dopóki `null`, metoda jest wyłączona, a przycisk płatności nieaktywny.
- `shipping.parcel.weightKg`: ciężar paczki z opakowaniem (wymagany do utworzenia przesyłki).
- `business.sender`: dane nadawcy do ShipX (bez nich przesyłki nie są tworzone).
- `business.*`: firma, adres, NIP, e-mail, telefon (stopka).
- `returnsPolicy.summary`: zasady zwrotów (publikowane dopiero po potwierdzeniu).
- `media.photosVerified`: `true` dopiero po podmianie grafik AI na prawdziwe zdjęcia produktu.

## Przepływ zakupu

1. Karta zakupu (`#wybor`) wybiera wariant. Wybór jest w adresie (`?pakiet=single|bundle`).
2. „Kup …” prowadzi do `/zamowienie`. Klient podaje dane, wybiera paczkomat albo kuriera i akceptuje regulamin.
3. `POST /api/checkout` przelicza kwoty z konfiguracji, zapisuje zamówienie (status `pending_payment`) i tworzy sesję Stripe.
   Ponowienie z tym samym `clientRequestId` zwraca tę samą sesję. Zmiana danych daje konflikt, nie nowe zamówienie.
4. Stripe przekierowuje na `/zamowienie/sukces`. Ta strona **nie** uznaje płatności; czyta status z zamówienia.
5. Webhook `checkout.session.completed` (lub `async_payment_succeeded`) sprawdza podpis, kwotę i walutę, oznacza zamówienie jako opłacone
   i uruchamia realizację: potwierdzenie e-mail (raz), przesyłka InPost (raz), e-mail z numerem śledzenia.
6. `checkout.session.expired` oznacza nieopłacone zamówienie jako wygasłe.

Zdarzenia Stripe są zapisywane po ID, więc to samo zdarzenie nie jest przetwarzane dwa razy.
Jeśli realizacja się nie uda, webhook zwraca 500, a Stripe ponowi zdarzenie.

## Stripe: ustawienia w Dashboardzie

- Waluta PLN, włączone metody płatności (karta, BLIK, Przelewy24) w sekcji metod płatności.
  Opcjonalnie ustaw `STRIPE_PAYMENT_METHOD_CONFIGURATION`, jeśli używasz konkretnej konfiguracji.
- Endpoint webhooka: `https://<domena>/api/stripe/webhook`. Zdarzenia: `checkout.session.completed`,
  `checkout.session.async_payment_succeeded`, `checkout.session.expired`.
- Do sprawdzenia lokalnie: Stripe CLI `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

## InPost

- **Geowidget (wybór punktu):** token z Parcel Managera, przypisany do domeny. Sandbox ma osobny host i token.
  Skrypt `inpost-geowidget.js` jest ładowany tylko w checkoutcie. Zdarzenie wyboru (`onpointselect`)
  i nazwa atrybutu konfiguracji (`parcelCollect`) **trzeba sprawdzić w sandboksie**, bo nie zostały przetestowane z prawdziwym tokenem.
- **ShipX (przesyłki):** usługi `inpost_locker_standard` (paczkomat) i `inpost_courier_standard` (kurier).
  Paczkomat wysyła `custom_attributes.target_point` i `sending_method: dispatch_order` (zgodnie z dokumentacją).
  **Do potwierdzenia w sandboksie:** format adresu odbiorcy kurierem (`flat_number`), format nadawcy i szablon paczki (`template: large`).

## Magazyn zamówień i e-maile (tryb deweloperski)

- Zamówienia są w `.data/orders.json`, a e-maile w `.data/outbox/`. Katalog jest w `.gitignore`.
- **Przed produkcją** przenieś magazyn do bazy z transakcjami (np. Postgres). Obecny zapis pliku działa tylko na jednej instancji.
- Brak retry dla przesyłek czekających na konfigurację: po uzupełnieniu danych trzeba uruchomić realizację ponownie (np. przez ponowne zdarzenie w Stripe albo narzędzie administracyjne, którego jeszcze nie ma).

## Testy

`npm test` uruchamia testy na wbudowanym runnerze Node. Używają tymczasowego katalogu, więc nie dotykają `.data/`.
Pokrywają: wyliczenie kwot zestawu (17 450 gr za sztukę), walidację danych, podpis webhooka (zły podpis → 400),
idempotencję zdarzeń i zamówień, zgodność kwoty, wygasanie i rezerwację przesyłki, payload ShipX.
Nie testują realnej komunikacji z Stripe, InPost ani Resend.

## Przed uruchomieniem sprzedaży

1. Podłącz Stripe (klucze testowe, potem produkcyjne), skonfiguruj webhook i metody płatności.
2. Uzupełnij ceny dostawy, ciężar paczki i dane nadawcy; potwierdź w sandboksie InPost token Geowidget, zdarzenie wyboru i szablon paczki.
3. Uzupełnij dane firmy, zasady zwrotów i treść polityki prywatności oraz regulaminu (obecne strony są oznaczone jako w przygotowaniu).
4. Zastąp grafiki AI prawdziwymi zdjęciami produktu i ustaw `media.photosVerified: true`.
5. Zweryfikuj używanie nazwy „JUSKYS XL” z właścicielem marki (sklep nie może sugerować, że jest producentem ani autoryzowanym przedstawicielem).
6. Przenieś magazyn zamówień do bazy, skonfiguruj Resend i domenę nadawcy.
7. Dopiero potem GitHub i Vercel (osobny krok).
