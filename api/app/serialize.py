import json
from datetime import datetime


def _val(v):
    if isinstance(v, datetime):
        return v.isoformat()
    return v


def row_to_dict(row, json_fields: tuple[str, ...] = ()) -> dict:
    d = dict(row)
    for f in json_fields:
        if f in d and isinstance(d[f], str):
            d[f] = json.loads(d[f])
    return {k: _val(v) for k, v in d.items()}
