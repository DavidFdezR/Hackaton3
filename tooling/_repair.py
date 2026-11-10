#!/usr/bin/env python3
"""One-shot repair for Tooling API objects the bulk export could not page."""
import json, os, subprocess, time, urllib.parse
from pathlib import Path

ROOT = Path("/Users/david.fernandez/IdeaProjects/Hackaton3")
OUT = ROOT / "tooling" / "records"


def sf_json(url):
    out = f"/tmp/sf-repair-{time.time_ns()}.json"
    p = subprocess.run(
        ["sf", "api", "request", "rest", url, "--target-org", "Hackaton3", "--stream-to-file", out],
        capture_output=True, text=True,
    )
    if not os.path.exists(out) or os.path.getsize(out) == 0:
        raise RuntimeError((p.stderr or p.stdout or "empty")[-400:])
    raw = Path(out).read_text()
    os.remove(out)
    if not raw.strip():
        raise RuntimeError("empty body " + (p.stderr or "")[-200:])
    return json.loads(raw)


def describe(name):
    data = sf_json(f"/services/data/v68.0/tooling/sobjects/{name}/describe")
    if isinstance(data, list):
        raise RuntimeError(json.dumps(data)[:400])
    skip = {"Metadata", "FullName"}
    fields = []
    for f in data["fields"]:
        if f.get("deprecatedAndHidden") or f["name"] in skip:
            continue
        if f.get("type") in {"base64", "address", "location", "complexvalue"}:
            continue
        fields.append(f["name"])
    return fields


def query_pages(soql):
    url = "/services/data/v68.0/tooling/query/?q=" + urllib.parse.quote(soql)
    data = sf_json(url)
    if isinstance(data, list):
        raise RuntimeError(json.dumps(data)[:600])
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
            raise RuntimeError(json.dumps(data)[:600])
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


def page_by(name, fields, key, page=200):
    got = []
    last = None
    while True:
        cols = ", ".join(fields)
        if last is None:
            soql = f"SELECT {cols} FROM {name} ORDER BY {key} LIMIT {page}"
        else:
            safe = last.replace("\\", "\\\\").replace("'", "\\'")
            soql = (
                f"SELECT {cols} FROM {name} WHERE {key} > '{safe}' "
                f"ORDER BY {key} LIMIT {page}"
            )
        batch = query_pages(soql)
        if not batch:
            break
        got.extend(batch)
        new_last = batch[-1].get(key)
        print(f"  {name} {len(got)} last {new_last}", flush=True)
        if new_last is None or new_last == last or len(batch) < page:
            break
        last = new_last
    uniq = {}
    for r in got:
        uniq[r.get(key)] = r
    return list(uniq.values())


print("EntityDefinition", flush=True)
ent_fields = [
    f for f in describe("EntityDefinition")
    if f in {
        "DurableId", "QualifiedApiName", "Label", "KeyPrefix", "DeveloperName",
        "NamespacePrefix", "IsCustomizable", "IsCustomSetting", "IsApexTriggerable",
        "IsWorkflowEnabled", "IsCompactLayoutable", "IsLayoutable", "IsQueryable",
        "IsSearchable", "IsEverCreatable", "IsEverUpdatable", "IsEverDeletable",
        "IsFeedEnabled", "IsSearchLayoutable", "IsIdEnabled", "InternalSharingModel",
        "ExternalSharingModel", "DetailUrl", "EditUrl", "NewUrl", "EditDefinitionUrl",
        "HelpSettingPageName", "HelpSettingPageUrl", "PublisherId", "IsInterface",
        "IsSubtype", "DefaultCompactLayoutId", "RunningUserEntityAccessId",
    }
]
if "DurableId" not in ent_fields:
    ent_fields = ["DurableId", "QualifiedApiName", "Label", "KeyPrefix"]
entities = page_by("EntityDefinition", ent_fields, "DurableId", page=200)
write("EntityDefinition", entities)
ids = [e["DurableId"] for e in entities if e.get("DurableId")]
print(f"entities {len(ids)}", flush=True)

print("FieldDefinition", flush=True)
fd_fields = [
    "DurableId", "EntityDefinitionId", "QualifiedApiName", "Label", "DataType",
    "Length", "Precision", "Scale", "IsCalculated", "IsNillable", "IsIndexed",
    "IsUnique", "IsCompound", "IsNameField", "ExtraTypeInfo", "RelationshipName",
    "ReferenceTo", "ValueTypeId",
]
# Keep only fields the describe actually has
have = set(describe("FieldDefinition"))
fd_fields = [f for f in fd_fields if f in have]
all_fd = []
step = 20
for i in range(0, len(ids), step):
    chunk = ids[i:i + step]
    quoted = ",".join("'" + c.replace("'", "\\'") + "'" for c in chunk)
    soql = f"SELECT {', '.join(fd_fields)} FROM FieldDefinition WHERE EntityDefinitionId IN ({quoted})"
    try:
        got = query_pages(soql)
    except Exception as e:
        print(f"  fd {i} failed {e}", flush=True)
        if i == 0:
            # retry one id so a bad field fails clearly
            soql = f"SELECT {', '.join(fd_fields)} FROM FieldDefinition WHERE EntityDefinitionId = '{chunk[0]}'"
            got = query_pages(soql)
        else:
            continue
    all_fd.extend(got)
    if (i // step) % 5 == 0:
        print(f"  fd {min(i+step, len(ids))}/{len(ids)} fields {len(all_fd)}", flush=True)
write(
    "FieldDefinition",
    all_fd,
    note="Queried with an EntityDefinitionId filter, which the Tooling API requires.",
)

print("DataType", flush=True)
dt_fields = [f for f in describe("DataType") if f != "Id"]
if "DurableId" not in dt_fields:
    dt_fields = ["DurableId"] + dt_fields
write("DataType", page_by("DataType", dt_fields, "DurableId", page=500))

print("PermissionSetTabSetting", flush=True)
perm_ids = [r["Id"] for r in json.loads((OUT / "PermissionSet.json").read_text())["records"] if r.get("Id")]
profile_ids = [r["Id"] for r in json.loads((OUT / "Profile.json").read_text())["records"] if r.get("Id")]
parents = perm_ids + profile_ids
tabs = []
for n, parent in enumerate(parents, 1):
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
        except Exception as e:
            print(f"  tab parent {parent} fail {e}", flush=True)
            break
        if not batch:
            break
        tabs.extend(batch)
        parent_count += len(batch)
        new_last = batch[-1].get("Name")
        if new_last is None or new_last == last or len(batch) < 2000:
            break
        last = new_last
    if n % 15 == 0 or parent_count:
        print(f"  parents {n}/{len(parents)} this {parent_count} total {len(tabs)}", flush=True)
uniq = {r["Id"]: r for r in tabs if r.get("Id")}
write("PermissionSetTabSetting", list(uniq.values()))

print("PermissionDependency", flush=True)
try:
    deps = page_by(
        "PermissionDependency",
        ["Id", "Permission", "PermissionType", "RequiredPermission", "RequiredPermissionType"],
        "Id",
        page=2000,
    )
    write("PermissionDependency", deps)
except Exception as e:
    print("  dependency page failed", e, flush=True)

print("Layout", flush=True)
try:
    layout_fields = [f for f in describe("Layout") if f not in {"Metadata", "FullName"}]
    write("Layout", query_pages(f"SELECT {', '.join(layout_fields)} FROM Layout"))
except Exception as e:
    print("  layout failed", e, flush=True)

print("ActivitiesSettings", flush=True)
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
            print(f"  drop {bad}", flush=True)
            fields.remove(bad)
            continue
        print("  activities failed", e, flush=True)
        break

print("FieldRestrictionRule", flush=True)
try:
    fields = [f for f in describe("FieldRestrictionRule") if f not in {"Metadata", "FullName"}]
    write("FieldRestrictionRule", query_pages(f"SELECT {', '.join(fields)} FROM FieldRestrictionRule"))
except Exception as e:
    print("  full FRR failed, trying core fields", e, flush=True)
    try:
        write(
            "FieldRestrictionRule",
            query_pages(
                "SELECT Id, DeveloperName, MasterLabel, EntityDefinitionId, IsActive, Description "
                "FROM FieldRestrictionRule"
            ),
        )
    except Exception as e2:
        print("  FRR failed", e2, flush=True)

print("IndustriesSettings", flush=True)
try:
    fields = describe("IndustriesSettings")
    merged = {}
    for i in range(0, len(fields), 50):
        chunk = fields[i:i + 50]
        if "Id" not in chunk:
            chunk = ["Id"] + chunk
        recs = query_pages(f"SELECT {', '.join(chunk)} FROM IndustriesSettings")
        for r in recs:
            merged.setdefault(r.get("Id"), {}).update(r)
        print(f"  industries {i} recs {len(recs)}", flush=True)
    write("IndustriesSettings", list(merged.values()))
except Exception as e:
    print("  industries failed", e, flush=True)

print("ConnectedApplication", flush=True)
try:
    fields = [
        f for f in describe("ConnectedApplication")
        if not any(s in f.lower() for s in ("secret", "token", "consumerkey", "password"))
    ]
    recs = query_pages(f"SELECT {', '.join(fields)} FROM ConnectedApplication")
    write("ConnectedApplication", recs)
except Exception as e:
    print("  connected failed", e, flush=True)

print("RecordType Metric", flush=True)
try:
    extra = query_pages(
        "SELECT Id, Name, SobjectType, IsActive, NamespacePrefix, Description "
        "FROM RecordType WHERE SobjectType = 'Metric'"
    )
    print("  metric record types", extra, flush=True)
    if extra:
        current = json.loads((OUT / "RecordType.json").read_text())
        by_id = {r["Id"]: r for r in current["records"]}
        for r in extra:
            by_id[r["Id"]] = r
        write("RecordType", list(by_id.values()))
except Exception as e:
    print("  metric RT", e, flush=True)

print("REPAIR_DONE", flush=True)
