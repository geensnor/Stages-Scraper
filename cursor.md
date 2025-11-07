# Instructies voor Cursor

- Deze repository bevat een aantal javascript bestanden die een website kunnen scrapen
- De website is <https://www.procyclingstats.com/> en het gaat om de renners, rondes en uitslagen van etappes van die website.
- De drie type gegevens die gescraped moeten worden, moeten voldoen aan de volgende schema's:
  - Renners: <https://raw.githubusercontent.com/geensnor/Geensnor-Tourpoule-Data/refs/heads/main/schemas/cyclists.json>
  - Tour: <https://github.com/geensnor/Geensnor-Tourpoule-Data/blob/main/schemas/tour.json>
  - Etappe: <https://github.com/geensnor/Geensnor-Tourpoule-Data/blob/main/schemas/stage.json>
- Het bestand jersyTemplate.yaml moet worden gebruikt om de truien per ronde aan te kunnen passen
- Het scrapen moet gestart worden via de CLI
- De output van het scrapen moet in de output directory worden opgeslagen
- Het moet mogelijk zijn om de renners, de ronde en de etappes onafhankelijk van elkaar te kunnen scrapen
- De namen van de renners moeten beginnen met een hoofdletter. Zowel de voor- als achternaam
