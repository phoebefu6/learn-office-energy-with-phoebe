"""Independent Python reference for the break bench (assets/oe-live.js).

Same model, written separately, integer minutes. Run:
    python3 materials/oe_reference.py          # readable table
    python3 materials/oe_reference.py --json   # JSON identical to node materials/oe-node.js
Priyanka and her schedule are constructed; nothing here is a measurement.
"""
import json
import sys

PRIYANKA = {
    "start": 510, "end": 1050,
    "lunch": {"start": 750, "len": 30, "type": "walk"},
    "meetings": [
        {"s": 570, "e": 585, "mode": "standing"},
        {"s": 660, "e": 720, "mode": "seated"},
        {"s": 840, "e": 870, "mode": "walkable"},
        {"s": 900, "e": 960, "mode": "seated"},
    ],
}
RUNGS = [
    {"every": 0, "len": 0, "kind": "", "walk": False},
    {"every": 60, "len": 2, "kind": "T", "walk": False},
    {"every": 30, "len": 3, "kind": "M", "walk": False},
    {"every": 30, "len": 3, "kind": "M", "walk": True},
]
LUNCH_WALK = 10


def back_to_back(day):
    keep = [m for m in day["meetings"] if m["e"] <= 780]
    keep += [{"s": h, "e": h + 60, "mode": "seated"} for h in range(780, 1020, 60)]
    return {**day, "meetings": keep}


def simulate(day, rung=1, gym=False, b2b=False):
    r = RUNGS[rung - 1]
    if b2b:
        day = back_to_back(day)
    s0, s1 = day["start"], day["end"]
    n = s1 - s0
    st = ["S"] * n
    busy = [0] * n
    L = day["lunch"]
    for t in range(L["start"], L["start"] + L["len"]):
        if s0 <= t < s1:
            busy[t - s0] = 2
            if gym:
                st[t - s0] = "M"
            elif L["type"] == "walk" and t < L["start"] + LUNCH_WALK:
                st[t - s0] = "M"
            else:
                st[t - s0] = "S"
    for m in day["meetings"]:
        for t in range(m["s"], m["e"]):
            if s0 <= t < s1:
                busy[t - s0] = 1
                if m["mode"] == "standing":
                    st[t - s0] = "T"
                elif m["mode"] == "walkable" and r["walk"]:
                    st[t - s0] = "M"
                else:
                    st[t - s0] = "S"
    cues = taken = dropped = cut = 0
    if r["every"]:
        t = (s0 // r["every"] + 1) * r["every"]
        while t < s1:
            i = t - s0
            cues += 1
            if busy[i] != 0:
                dropped += 1
            else:
                got = 0
                while got < r["len"] and i + got < n and busy[i + got] == 0:
                    st[i + got] = r["kind"]
                    got += 1
                cut += got < r["len"]
                taken += 1
            t += r["every"]
    runs, run, start = [], 0, 0
    for i, s in enumerate(st + ["E"]):
        if s == "S":
            if run == 0:
                start = i
            run += 1
        else:
            if run:
                runs.append((start, run))
            run = 0
    longest, lstart = 0, -1
    for a, ln in runs:
        if ln > longest:
            longest, lstart = ln, a
    return {
        "longest": longest, "longestStart": -1 if lstart < 0 else s0 + lstart,
        "over30": sum(1 for _, ln in runs if ln > 30), "bouts": len(runs),
        "sit": st.count("S"), "stand": st.count("T"), "move": st.count("M"),
        "cues": cues, "taken": taken, "dropped": dropped, "cut": int(cut),
    }


def canon():
    out = {"day": "Priyanka (constructed)", "rungs": [], "gym": [], "b2b": [], "gymOnRung1": None}
    for g in range(1, 5):
        out["rungs"].append(simulate(PRIYANKA, g))
        out["gym"].append(simulate(PRIYANKA, g, gym=True))
        out["b2b"].append(simulate(PRIYANKA, g, b2b=True))
    return out


if __name__ == "__main__":
    c = canon()
    if "--json" in sys.argv:
        sys.stdout.write(json.dumps(c, indent=1))
    else:
        for key in ("rungs", "gym", "b2b"):
            print(key)
            for g, r in enumerate(c[key], 1):
                print(f"  rung {g}: {r}")
