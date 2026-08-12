#!/usr/bin/env python3
"""Search UI/UX Pro Max CSV data files for design intelligence recommendations.

Usage:
  python search.py "<query>" [--domain style|color|typography|product|chart|ux|stack] [--limit N]
"""

import argparse
import csv
import re
import sys
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = SKILL_ROOT / "data"

DOMAIN_FILE_MAP = {
    "style": "styles.csv",
    "color": "colors.csv",
    "typography": "typography.csv",
    "product": "products.csv",
    "chart": "charts.csv",
    "ux": "ux-guidelines.csv",
    "landing": "landing.csv",
    "motion": "motion.csv",
    "icons": "icons.csv",
    "app": "app-interface.csv",
}


def score_row(query_tokens: list[str], row: dict[str, str]) -> float:
    """Calculate a relevance score for a CSV row against query tokens."""
    text = " ".join(str(val) for val in row.values()).lower()
    score = 0.0
    for token in query_tokens:
        if not token:
            continue
        # Exact word match
        matches = len(re.findall(r'\b' + re.escape(token) + r'\b', text))
        if matches:
            score += matches * 3.0
        # Partial substring match
        elif token in text:
            score += 1.0
    return score


def search_csv(csv_path: Path, query_tokens: list[str], limit: int = 5) -> list[tuple[float, dict[str, str]]]:
    """Search a single CSV file and return top scored rows."""
    results = []
    if not csv_path.exists():
        return results

    with csv_path.open("r", encoding="utf-8", errors="ignore", newline="") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            score = score_row(query_tokens, row)
            if score > 0:
                results.append((score, row))

    results.sort(key=lambda x: x[0], reverse=True)
    return results[:limit]


def search_stacks(query_tokens: list[str], limit: int = 5) -> list[tuple[float, str, dict[str, str]]]:
    """Search stack CSV files in data/stacks/."""
    stacks_dir = DATA_DIR / "stacks"
    results = []
    if not stacks_dir.exists():
        return results

    for csv_path in stacks_dir.glob("*.csv"):
        stack_name = csv_path.stem
        with csv_path.open("r", encoding="utf-8", errors="ignore", newline="") as fh:
            reader = csv.DictReader(fh)
            for row in reader:
                score = score_row(query_tokens, row)
                if score > 0:
                    results.append((score, stack_name, row))

    results.sort(key=lambda x: x[0], reverse=True)
    return results[:limit]


def format_results(domain: str, matches: list) -> str:
    """Format matching rows into clear Markdown output."""
    if not matches:
        return f"No matching results found for domain: **{domain}**."

    out = [f"### Top Design Recommendations ({domain.capitalize()})\n"]
    for idx, item in enumerate(matches, 1):
        if len(item) == 3:
            score, stack, row = item
            out.append(f"**{idx}. [{stack.upper()}] Match (Score: {score:.1f})**")
        else:
            score, row = item
            out.append(f"**{idx}. Match (Score: {score:.1f})**")

        for key, val in row.items():
            if val and val.strip():
                out.append(f"  - **{key}**: {val.strip()}")
        out.append("")

    return "\n".join(out)


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description="Search UI/UX Pro Max CSV design intelligence database")
    parser.add_argument("query", help="Search keywords (e.g. 'SaaS dark mode dashboard', 'fintech', 'minimal')")
    parser.add_argument("--domain", choices=list(DOMAIN_FILE_MAP.keys()) + ["stack", "all"], default="all", help="Target domain dataset")
    parser.add_argument("--limit", type=int, default=5, help="Number of results per domain")

    args = parser.parse_args()
    query_tokens = [tok.strip().lower() for tok in re.split(r'\W+', args.query) if tok.strip()]

    if not DATA_DIR.exists():
        print(f"Data directory not found at: {DATA_DIR}", file=sys.stderr)
        return 1

    domains_to_search = []
    if args.domain == "all":
        domains_to_search = list(DOMAIN_FILE_MAP.keys()) + ["stack"]
    elif args.domain in DOMAIN_FILE_MAP:
        domains_to_search = [args.domain]
    else:
        domains_to_search = ["stack"]

    found_any = False
    for dom in domains_to_search:
        if dom == "stack":
            matches = search_stacks(query_tokens, limit=args.limit)
        else:
            csv_path = DATA_DIR / DOMAIN_FILE_MAP[dom]
            matches = search_csv(csv_path, query_tokens, limit=args.limit)

        if matches:
            found_any = True
            print(format_results(dom, matches))

    if not found_any:
        print(f"No design intelligence matches found for query: '{args.query}' across {args.domain} domain(s).")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
