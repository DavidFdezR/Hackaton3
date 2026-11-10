#!/usr/bin/env python3
import json, os, subprocess, time, urllib.parse
from pathlib import Path

ROOT = Path("/Users/david.fernandez/IdeaProjects/Hackaton3")
OUT = ROOT / "tooling" / "records"


def sf_json(url):
    out = f"/tmp/sf-rest-{time.time_ns()}.json"
    p = subprocess.run(
        ["sf", "api", "request", "rest", url, "--target-org", "Hackaton3", "--stream-to-file", out],
        capture_output=True, text=True,
    )
    if not os.path.exists(out) or os.path.getsize(out) == 0:
        raise RuntimeError(f"sf exit {p.returncode}")
    raw = Path(out).read_text()
    os.remove(out)
    if not raw.strip():
        raise RuntimeError("empty body")
    return json.loads(raw)


def describe(name):
    data = sf_json(f"/services/data/v68.0/tooling/sobjects/{name}/describe")
    if isinstance(data, list):
        raise RuntimeError(data[0].get("errorCode", "describe failed"))
    fields = []
    for f in data["fields"]:
        if f.get("deprecatedAndHidden") or f["name"] in {"Metadata", "FullName"}:
            continue
        if f.get("type") in {"base64", "address", "location", "complexvalue"}:
            continue
        if any(s in f["name"].lower() for s in ("secret", "token", "consumerkey", "password")):
            continue
        fields.append(f["name"])
    return fields


def query_pages(soql):
    url = "/services/data/v68.0/tooling/query/?q=" + urllib.parse.quote(soql)
    data = sf_json(url)
    if isinstance(data, list):
        raise RuntimeError(data[0].get("message", "query failed")[:180])
    recs = []
    while True:
        for r in data.get("records", []):
            r.pop("attributes", None)
            recs.append(r)
        if data.get("done") or not data.get("nextRecordsUrl"):
            break
        nxt = data["nextRecordsUrl"]
        if not nxt.startswith("/"):
            nxt = "/" + nxt
        data = sf_json(nxt)
        if isinstance(data, list):
            raise RuntimeError(data[0].get("message", "queryMore failed")[:180])
    return recs


def write(name, recs, note=None):
    payload = {"sobject": name, "count": len(recs), "records": recs}
    if note:
        payload["note"] = note
    path = OUT / f"{name}.json"
    path.write_text(json.dumps(payload, indent=2 if len(recs) <= 200 else None))
    err = OUT / f"{name}.error.txt"
    if err.exists():
        err.unlink()
    print(f"wrote {name} {len(recs)} {path.stat().st_size}", flush=True)


print("PermissionSetTabSetting", flush=True)
existing = json.loads((OUT / "PermissionSetTabSetting.json").read_text())["records"]
perm_ids = [r["Id"] for r in json.loads((OUT / "PermissionSet.json").read_text())["records"] if r.get("Id")]
profile_ids = [r["Id"] for r in json.loads((OUT / "Profile.json").read_text())["records"] if r.get("Id")]
tabs = list(existing)
failures = 0
for n, parent in enumerate(perm_ids + profile_ids, 1):
    last = None
    parent_count = 0
    while True:
        if last is None:
            soql = (
                "SELECT Id, ParentId, Visibility, Name FROM PermissionSetTabSetting "
                f"WHERE ParentId = '{parent}' ORDER BY Name LIMIT 2000"
            )
        else:
            safe = last.replace("'", "\\'")
            soql = (
                "SELECT Id, ParentId, Visibility, Name FROM PermissionSetTabSetting "
                f"WHERE ParentId = '{parent}' AND Name > '{safe}' ORDER BY Name LIMIT 2000"
            )
        try:
            batch = query_pages(soql)
        except Exception:
            time.sleep(2)
            try:
                batch = query_pages(soql)
            except Exception:
                failures += 1
                print(f"  skip parent {n} failures {failures}", flush=True)
                break
        if not batch:
            break
        tabs.extend(batch)
        parent_count += len(batch)
        new_last = batch[-1].get("Name")
        if not new_last or new_last == last or len(batch) < 2000:
            break
        last = new_last
    if n % 20 == 0:
        print(f"  parents {n} total {len(tabs)} failures {failures}", flush=True)
uniq = {r["Id"]: r for r in tabs if r.get("Id")}
write("PermissionSetTabSetting", list(uniq.values()))

print("other objects", flush=True)
try:
    deps = query_pages(
        "SELECT Id, Permission, PermissionType, RequiredPermission, RequiredPermissionType "
        "FROM PermissionDependency LIMIT 2000"
    )
    # page by Id when supported; otherwise keep this page plus any existing uniques
    write("PermissionDependency", deps)
except Exception as e:
    print("dependency", str(e)[:120], flush=True)

try:
    fields = describe("Layout")
    write("Layout", query_pages(f"SELECT {', '.join(fields)} FROM Layout"))
except Exception as e:
    print("layout", str(e)[:160], flush=True)

fields = describe("ActivitiesSettings")
while fields:
    try:
        write("ActivitiesSettings", query_pages(f"SELECT {', '.join(fields)} FROM ActivitiesSettings"))
        break
    except Exception as e:
        msg = str(e)
        import re
        m = re.search(r"column ([A-Za-z0-9_]+) not found|No such column '([^']+)'", msg)
        bad = next((g for g in m.groups() if g), None) if m else None
        if bad and bad in fields:
            fields.remove(bad)
            continue
        print("activities", msg[:160], flush=True)
        break

try:
    fields = describe("FieldRestrictionRule")
    write("FieldRestrictionRule", query_pages(f"SELECT {', '.join(fields)} FROM FieldRestrictionRule"))
except Exception as e:
    print("frr", str(e)[:160], flush=True)
    try:
        write(
            "FieldRestrictionRule",
            query_pages("SELECT Id, MasterLabel, EntityDefinitionId, IsActive FROM FieldRestrictionRule"),
        )
    except Exception as e2:
        print("frr core", str(e2)[:160], flush=True)

try:
    fields = describe("IndustriesSettings")
    merged = {}
    for i in range(0, len(fields), 50):
        chunk = fields[i:i + 50]
        if "Id" not in chunk:
            chunk = ["Id"] + chunk
        for r in query_pages(f"SELECT {', '.join(chunk)} FROM IndustriesSettings"):
            merged.setdefault(r.get("Id"), {}).update(r)
    write("IndustriesSettings", list(merged.values()))
except Exception as e:
    print("industries", str(e)[:160], flush=True)

try:
    fields = describe("ConnectedApplication")
    write("ConnectedApplication", query_pages(f"SELECT {', '.join(fields)} FROM ConnectedApplication"))
except Exception as e:
    print("connected", str(e)[:160], flush=True)

try:
    extra = query_pages(
        "SELECT Id, Name, SobjectType, IsActive, NamespacePrefix, Description "
        "FROM RecordType WHERE SobjectType = 'Metric'"
    )
    print("metric record types", len(extra), flush=True)
    if extra:
        current = json.loads((OUT / "RecordType.json").read_text())["records"]
        by_id = {r["Id"]: r for r in current}
        for r in extra:
            by_id[r["Id"]] = r
        write("RecordType", list(by_id.values()))
except Exception as e:
    print("metric", str(e)[:160], flush=True)

print("REST_DONE", flush=True)
