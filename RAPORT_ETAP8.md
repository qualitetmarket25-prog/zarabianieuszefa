# RAPORT ETAP 8 — przegląd repo + plan wdrożenia

## Co jest zrobione w repo
- ETAP 5/7 jest już widoczny na głównych stronach premium.
- Dashboard, index, app-shell i moduł nieruchomości są już wgrane.
- Moduł nieruchomości działa jako MVP bez backendu.
- Reklama AI, aplikacje, ogłoszenia, auta i używane były jeszcze zbyt płytkie.

## Co dokładam w tej paczce
- poprawiony `app-shell.js`
- poprawiony `app-layout.css`
- nowy `dashboard.html`
- nowy `reklama-ai.html`
- nowy `aplikacje.html`
- nowy `stworz-aplikacje.html`
- nowy `ogloszenia.html`
- nowy `auta.html`
- nowy `uzywane.html`

## Najważniejsze poprawki techniczne
1. Ujednolicenie planu:
   - wcześniej w repo pojawiały się dwa klucze planu:
     - `qm_user_plan_v1`
     - `qm_plan_v1`
   - w tej paczce shell czyta oba, żeby nic się nie rozjechało.

2. Bez nowych krytycznych storage keys:
   - wszystko idzie dalej do `qm_crm_v1`
   - nowe sekcje wewnątrz CRM:
     - `generatedApps`
     - `aiCampaigns`
     - `classifiedAds`
     - `usedItems`
     - `vehicleOffers`
     - `vehicleLeads`

3. GitHub Pages:
   - ścieżki są względne
   - bez backendu
   - mobile-first
   - jeden wspólny shell

## Kolejność kolejnych paczek
- ETAP 9 — media pack, galerie, upload / linki zdjęć, lepsze karty ofert
- ETAP 10 — pipeline leadów, taski, follow-up, statusy handlowe
- ETAP 11 — panel sprzedaży aplikacji + oferty dla klientów
- ETAP 12 — multi-store manager i lepszy panel sklepów
- ETAP 13 — integracja reklam AI z gotowymi szablonami
- ETAP 14 — dopięcie koszyka / checkout / zamówień pod nowy shell
- ETAP 15 — porządkowanie całego repo i pełna stabilizacja builda
