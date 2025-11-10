# Instructies voor Cursor

- Deze repository bevat een aantal javascript bestanden die een website kunnen scrapen
- De website is <https://www.procyclingstats.com/> en het gaat om de renners en uitslagen van etappes van die website.
- De twee type gegevens die gescraped moeten worden, moeten voldoen aan de volgende schema's:
  - Renners: <https://raw.githubusercontent.com/geensnor/Geensnor-Tourpoule-Data/refs/heads/main/schemas/cyclists.json>
  - Etappe: <https://github.com/geensnor/Geensnor-Tourpoule-Data/blob/main/schemas/stage.json>
  - De etappes moeten ook de gefinished renners in de goede volgorde bevatten als een etappe is gefinished. Het aantal gefinished renners per etappe is gelijk aan het aantal plaatsen waar je nog punten voor krijgt. Het aantal "scoring" items in tour.yaml dus. De status van een etappe is dan ook "finished".
  - Als een etappe de status "finished" heeft en de renners zijn bij de uitslagen ingevuld, moet deze niet opnieuw gescraped worden.
  - De status en uitslagen van een etappe kan opgehaald via de pagina van de srapeULR. Op die pagina staan ook de etappes. De uitslagen van een etappe staan op de detailpagina van een etappe.
- In de input directory staan twee bestanden die als basis dienen voor het scrapen
- In tour.yaml staat de scrapeURL. Dit is de URL waarvoor de ronden en de
- Per etappe wordt een naam van de trui vastgelegd. Die naam wordt uit tour.yaml gehaald onder "jerseys".
- Het scrapen moet gestart worden via de CLI
- De output van het scrapen moet in de output directory worden opgeslagen
- Het moet mogelijk zijn om de renners en de etappes onafhankelijk van elkaar te kunnen scrapen. Maar
- De namen van de renners moeten beginnen met een hoofdletter. Zowel de voor- als achternaam
