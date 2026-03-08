PAKIET 6 — LOGIN / ONBOARDING / POBIERZ-APLIKACJE / SUCCESS / AKTYWUJ-PRO + AUTO MARŻA

PLIKI DO PODMIANY:
- login.html
- onboarding.html
- pobierz-aplikacje.html
- success.html
- aktywuj-pro.html
- app-layout.css
- app-shell.js
- auto-margin.js
- uszefaqualitet-logo.svg

CO ROBI PAKIET:
- daje spójny mobile-first layout
- dodaje topbar i dolne menu
- ustawia automatyczną marżę wg planu:
  BASIC = 15%
  PRO = 25%
  ELITE = 35%
- zapisuje marżę do qm_store_margin_pct
- aktualizuje produkty w qm_products_by_supplier_v1
- próbuje ustawić marżę aktywnego sklepu w qm_stores_v1

TEST:
1. otwórz onboarding.html
2. kliknij BASIC / PRO / ELITE
3. sprawdź localStorage:
   - qm_store_margin_pct
   - qm_products_by_supplier_v1
4. otwórz aktywuj-pro.html i success.html
5. sprawdź mobile menu
