#!/usr/bin/env python3
"""Sync ModelMemento static knowledge & 6-arm cross profiles into a tamper-evident `.vcross` container
using `VeraCrossModel` (SCPR) from `stereo_cross_model`.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path


def _attach_scpm() -> Path:
    here = Path(__file__).resolve().parent
    candidate = Path(
        os.environ.get("SCPM_ROOT") or (here.parent.parent / "stereo_cross_model")
    )
    if candidate.exists() and str(candidate) not in sys.path:
        sys.path.insert(0, str(candidate))
    return candidate


def cmd_sync(args: argparse.Namespace) -> None:
    _attach_scpm()
    from scpm import VCrossContainer, VeraCrossModel

    t0 = time.perf_counter()
    payload = json.loads(Path(args.input).read_text(encoding="utf-8"))
    models = payload.get("models", [])
    tools = payload.get("tools", [])

    model = VeraCrossModel(attach_vera_box=bool(args.attach_box))
    rule_count = 0

    for m in models:
        mid = str(m.get("id") or m.get("name") or "").strip().lower()
        if not mid:
            continue
        vendor = m.get("vendor")
        if vendor:
            rule_count += model.add_rule(mid, "+y", f"vendor_{vendor.lower()}", source=f"spec:{mid}")
        family = m.get("family")
        if family:
            rule_count += model.add_rule(mid, "+z", f"family_{family.lower()}", source=f"spec:{mid}")
        parent = m.get("parent")
        if parent:
            rule_count += model.add_rule(mid, "+z", str(parent).lower(), source=f"lineage:{mid}")

        specs = m.get("specs") or {}
        iface = specs.get("interface")
        if iface == "completion":
            rule_count += model.add_rule(mid, "+x", "raw_completion", source=f"spec:{mid}")
            rule_count += model.add_rule(mid, "-x", "chat_assistant", source=f"spec:{mid}")
        elif iface == "chat":
            rule_count += model.add_rule(mid, "+x", "chat_dialogue", source=f"spec:{mid}")

        cross = (m.get("vera") or {}).get("cross") or {}
        arms = cross.get("arms") or {}
        for arm in ("+x", "-x", "+y", "-y", "+z", "-z"):
            for item in (arms.get(arm) or [])[:6]:
                label = str(item.get("label") or "").strip()
                if not label:
                    continue
                slug_facet = "_".join(label.lower().replace("/", " ").split()[:5])
                if slug_facet:
                    rule_count += model.add_rule(mid, arm, slug_facet[:64], source=f"vera:{mid}")

    for t in tools[:80]:
        tname = str(t.get("name") or "").strip().lower()
        kind = str(t.get("kind") or "tool").strip().lower()
        if tname:
            rule_count += model.add_rule(tname, "+z", kind, source="tools_timeline")

    export_res = VCrossContainer.export(
        args.out,
        model.box,
        model.fast_memory,
        {
            "hub_beta": model.config["hub_beta"],
            "rim_gamma": model.config["rim_gamma"],
            "min_section_agreement": model.config["min_section_agreement"],
            "rank": model.config["rank"],
            "synced_models": len(models),
            "synced_tools": len(tools),
        },
    )
    verify_res = VCrossContainer.verify(args.out)

    probes = []
    for probe_q in args.probe or []:
        env = model.ask(probe_q)
        probes.append({
            "query": probe_q,
            "verdict": env.verdict,
            "answer": env.answer,
            "latency_ms": round(env.latency_ms, 3),
            "organ": env.organ_used,
        })

    out = {
        "ok": bool(verify_res.get("valid")),
        "vcross_path": export_res["path"],
        "size_bytes": export_res["size_bytes"],
        "rules_poured": rule_count,
        "manifest": export_res["manifest"],
        "verification": verify_res,
        "probes": probes,
        "elapsed_ms": round((time.perf_counter() - t0) * 1000.0, 2),
    }
    print(json.dumps(out, ensure_ascii=False))


def cmd_verify(args: argparse.Namespace) -> None:
    _attach_scpm()
    from scpm import VCrossContainer

    res = VCrossContainer.verify(args.vcross)
    print(json.dumps(res, ensure_ascii=False))


def cmd_ask(args: argparse.Namespace) -> None:
    _attach_scpm()
    from scpm import VeraCrossModel

    m = VeraCrossModel.load_container(args.vcross)
    try:
        env = m.ask(args.query)
        print(json.dumps(env.to_dict(), ensure_ascii=False))
    finally:
        m.close()


def main() -> None:
    ap = argparse.ArgumentParser(description="ModelMemento <-> VeraCrossModel (.vcross) bridge")
    sub = ap.add_subparsers(dest="cmd", required=True)

    sp_sync = sub.add_parser("sync")
    sp_sync.add_argument("--input", required=True)
    sp_sync.add_argument("--out", required=True)
    sp_sync.add_argument("--attach-box", action="store_true")
    sp_sync.add_argument("--probe", action="append", default=[])
    sp_sync.set_defaults(func=cmd_sync)

    sp_ver = sub.add_parser("verify")
    sp_ver.add_argument("--vcross", required=True)
    sp_ver.set_defaults(func=cmd_verify)

    sp_ask = sub.add_parser("ask")
    sp_ask.add_argument("--vcross", required=True)
    sp_ask.add_argument("--query", required=True)
    sp_ask.set_defaults(func=cmd_ask)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
