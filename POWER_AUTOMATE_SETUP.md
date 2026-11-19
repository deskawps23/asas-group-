# ASAS Excel → Dashboard Sync

## Target architecture
Excel Online table → Power Automate → dashboard-data.json → GitHub Pages.

## Workbook location
Simpan workbook pada OneDrive for Business atau SharePoint. Setiap input berada dalam Excel Table.

## Flow logic
1. Trigger: Recurrence atau manual.
2. Excel Online (Business): List rows present in a table untuk setiap tabel.
3. Filter array: Status equals Published.
4. Compose object dengan datasets.
5. Update file `data/dashboard-data.json` di repository melalui integration service/GitHub API.
6. GitHub Pages deploy; dashboard fetch JSON dengan cache disabled.

## Security
- Jangan simpan token pada JavaScript publik.
- Gunakan secret/connection milik automation service.
- Jangan publish detail payroll individual, rekening, atau data personal.
- Pisahkan Maker, Reviewer, Approver.

## Table names
tblCEOCorporate, tblCAOAcquisition, tblCOOOperations, tblFacilityReporting, tblCFOFinance, tblCTODigital, tblCHROPeople, tblProcurement, tblGrowth, tblIPODisclosure, tblBlockchain, tblESGRisk.
