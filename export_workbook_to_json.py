from openpyxl import load_workbook
from pathlib import Path
import json,sys,datetime
source=Path(sys.argv[1] if len(sys.argv)>1 else "ASAS_Master_Reporting_System.xlsx")
out=Path(sys.argv[2] if len(sys.argv)>2 else "dashboard-data.json")
wb=load_workbook(source,data_only=True)
def read(sheet):
 ws=wb[sheet]; h=[c.value for c in ws[4]]; rows=[]
 for r in ws.iter_rows(min_row=5,values_only=True):
  if not r[0]: continue
  d={str(h[i]):r[i] for i in range(min(len(h),len(r)))}
  if d.get("Status")=="Published": rows.append(d)
 return rows
sheets=["CEO_Corporate","CAO_Acquisition","COO_Operations","Facility_Reporting","CFO_Finance","CTO_Digital","CHRO_People","Procurement","Growth","IPO_Disclosure","Blockchain","ESG_Risk"]
p={"generatedAt":datetime.datetime.now(datetime.timezone.utc).isoformat(),"source":source.name,"publishedOnly":True,"datasets":{s:read(s) for s in sheets}}
out.write_text(json.dumps(p,ensure_ascii=False,indent=2,default=str),encoding="utf-8")
print(out)
