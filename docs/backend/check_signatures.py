from app.core.database import SessionLocal
from app.models.alert import Alert

db = SessionLocal()
alerts = db.query(Alert).limit(50).all()

print("Alert Signatures in Database:")
print("-" * 50)

signatures = {}
for alert in alerts:
    sig = alert.signature
    if sig in signatures:
        signatures[sig] += 1
    else:
        signatures[sig] = 1

for sig, count in signatures.items():
    print(f"{count}x: {sig}")

db.close()
