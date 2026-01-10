#!/usr/bin/env python3
"""
Analyzes TypeScript type definitions and reports on data models.

Usage:
    python analyze_types.py [path_to_types_file]

Output:
    JSON report of types, interfaces, and their relationships
"""

import sys
import json
import re
from pathlib import Path


def parse_typescript_types(content: str) -> dict:
    """Extract type and interface definitions from TypeScript content."""

    types = {}

    # Match interface definitions
    interface_pattern = r'export interface (\w+)\s*{([^}]+)}'
    for match in re.finditer(interface_pattern, content, re.DOTALL):
        name = match.group(1)
        body = match.group(2)

        # Extract fields
        fields = {}
        field_pattern = r'(\w+)(\?)?:\s*([^;]+)'
        for field_match in re.finditer(field_pattern, body):
            field_name = field_match.group(1)
            optional = field_match.group(2) == '?'
            field_type = field_match.group(3).strip()

            fields[field_name] = {
                'type': field_type,
                'optional': optional
            }

        types[name] = {
            'kind': 'interface',
            'fields': fields
        }

    # Match type aliases
    type_pattern = r'export type (\w+)\s*=\s*([^;]+);'
    for match in re.finditer(type_pattern, content):
        name = match.group(1)
        definition = match.group(2).strip()

        types[name] = {
            'kind': 'type',
            'definition': definition
        }

    return types


def main():
    if len(sys.argv) > 1:
        types_file = Path(sys.argv[1])
    else:
        types_file = Path(__file__).parent.parent / 'types' / 'index.ts'

    if not types_file.exists():
        print(json.dumps({
            'error': f'Types file not found: {types_file}',
            'types': {}
        }))
        sys.exit(1)

    content = types_file.read_text(encoding='utf-8')
    types = parse_typescript_types(content)

    result = {
        'file': str(types_file),
        'count': len(types),
        'types': types
    }

    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
