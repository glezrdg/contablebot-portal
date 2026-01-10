#!/usr/bin/env python3
"""
Tests API endpoints for the ContableBot Portal.

Usage:
    python test_api.py [base_url] [--endpoint ENDPOINT] [--method METHOD]

Examples:
    python test_api.py http://localhost:3000
    python test_api.py http://localhost:3000 --endpoint /api/invoices --method GET

Output:
    JSON report of test results
"""

import sys
import json
import argparse
import requests
from typing import Optional


def test_endpoint(base_url: str, endpoint: str, method: str = 'GET',
                 headers: Optional[dict] = None, data: Optional[dict] = None) -> dict:
    """Test a single API endpoint."""

    url = f"{base_url.rstrip('/')}{endpoint}"

    try:
        if method == 'GET':
            response = requests.get(url, headers=headers, timeout=10)
        elif method == 'POST':
            response = requests.post(url, headers=headers, json=data, timeout=10)
        elif method == 'DELETE':
            response = requests.delete(url, headers=headers, timeout=10)
        else:
            return {'error': f'Unsupported method: {method}'}

        result = {
            'endpoint': endpoint,
            'method': method,
            'status_code': response.status_code,
            'success': 200 <= response.status_code < 300,
            'headers': dict(response.headers),
        }

        # Try to parse JSON response
        try:
            result['body'] = response.json()
        except:
            result['body'] = response.text[:500]  # Limit text response

        return result

    except requests.exceptions.RequestException as e:
        return {
            'endpoint': endpoint,
            'method': method,
            'error': str(e),
            'success': False
        }


def test_all_endpoints(base_url: str) -> dict:
    """Test all known API endpoints."""

    endpoints = [
        {'endpoint': '/api/invoices', 'method': 'GET'},
        {'endpoint': '/api/clients', 'method': 'GET'},
        {'endpoint': '/api/me', 'method': 'GET'},
    ]

    results = []
    for endpoint_config in endpoints:
        result = test_endpoint(
            base_url,
            endpoint_config['endpoint'],
            endpoint_config['method']
        )
        results.append(result)

    success_count = sum(1 for r in results if r.get('success', False))

    return {
        'base_url': base_url,
        'total': len(results),
        'passed': success_count,
        'failed': len(results) - success_count,
        'results': results
    }


def main():
    parser = argparse.ArgumentParser(description='Test ContableBot Portal API endpoints')
    parser.add_argument('base_url', nargs='?', default='http://localhost:3000',
                       help='Base URL of the application')
    parser.add_argument('--endpoint', help='Specific endpoint to test')
    parser.add_argument('--method', default='GET', help='HTTP method')

    args = parser.parse_args()

    if args.endpoint:
        result = test_endpoint(args.base_url, args.endpoint, args.method)
    else:
        result = test_all_endpoints(args.base_url)

    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
