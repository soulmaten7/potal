#!/usr/bin/env python3
"""
Practical UK Trade Tariff Duty Rate Downloader
Demonstrates efficient downloading with parallel processing
"""

import json
import requests
import sqlite3
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
from typing import Dict, List, Optional, Tuple
from collections import defaultdict
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_URL = "https://www.trade-tariff.service.gov.uk/api/v2"
DB_PATH = "/sessions/bold-dazzling-galileo/mnt/portal/data/uk_tariff.db"
OUTPUT_JSON = "/sessions/bold-dazzling-galileo/mnt/portal/data/commodity_duty_rates.json"

class DutyRateDownloader:
    """Download and parse UK commodity duty rates"""

    def __init__(self, max_workers=5, request_delay=0.1):
        self.session = requests.Session()
        self.max_workers = max_workers
        self.request_delay = request_delay
        self.last_request_time = 0
        self.commodities = {}
        self.duty_rates = defaultdict(list)
        self.errors = []

    def rate_limited_request(self, url: str, params: Optional[Dict] = None):
        """Make rate-limited API request"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.request_delay:
            time.sleep(self.request_delay - elapsed)

        try:
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            self.last_request_time = time.time()
            return response.json()
        except Exception as e:
            logger.error(f"Request failed: {e}")
            return None

    def get_sections(self) -> List[Dict]:
        """Fetch all sections"""
        logger.info("Fetching sections...")
        url = f"{BASE_URL}/sections"
        data = self.rate_limited_request(url)
        if data and 'data' in data:
            return data['data']
        return []

    def get_chapters(self, section: Dict) -> List[Tuple[int, int]]:
        """Get chapter numbers for a section"""
        chapter_from = int(section['attributes']['chapter_from'])
        chapter_to = int(section['attributes']['chapter_to'])
        return [(i, i) for i in range(chapter_from, chapter_to + 1)]

    def fetch_heading_commodities(self, heading_code: str) -> List[Dict]:
        """Fetch all commodities for a heading"""
        url = f"{BASE_URL}/headings/{heading_code}"
        params = {'include': 'commodities'}
        data = self.rate_limited_request(url, params)

        if data and 'included' in data:
            commodities = [item for item in data['included'] if item.get('type') == 'commodity']
            return commodities
        return []

    def fetch_commodity_duty_rates(self, commodity_code: str) -> Dict:
        """Fetch full commodity with duty measures"""
        url = f"{BASE_URL}/commodities/{commodity_code}"
        params = {'include': 'import_measures'}
        data = self.rate_limited_request(url, params)

        if not data or 'data' not in data:
            return None

        commodity = data['data']
        duty_rates = []

        # Extract duty information from included items
        if 'included' in data:
            # Build lookup maps
            duty_expressions = {}
            geographical_areas = {}
            measure_types = {}

            for item in data['included']:
                item_type = item.get('type')
                item_id = item.get('id')

                if item_type == 'duty_expression':
                    duty_expressions[item_id] = item.get('attributes', {}).get('base')
                elif item_type == 'geographical_area':
                    geo_attrs = item.get('attributes', {})
                    geographical_areas[item_id] = {
                        'code': geo_attrs.get('geographical_area_id'),
                        'description': geo_attrs.get('description')
                    }
                elif item_type == 'measure_type':
                    measure_types[item_id] = item.get('attributes', {}).get('description')

            # Extract measures
            measures = commodity.get('relationships', {}).get('import_measures', {}).get('data', [])
            if measures:
                for measure_ref in measures:
                    measure_id = measure_ref['id']
                    # Find the measure in included
                    for item in data['included']:
                        if item.get('id') == measure_id and item.get('type') == 'measure':
                            measure = item
                            duty_expr_id = None
                            geo_id = None
                            measure_type_id = None

                            # Find related IDs
                            relationships = measure.get('relationships', {})
                            if 'duty_expression' in relationships:
                                duty_expr_id = relationships['duty_expression'].get('data', {}).get('id')
                            if 'geographical_area' in relationships:
                                geo_id = relationships['geographical_area'].get('data', {}).get('id')
                            if 'measure_type' in relationships:
                                measure_type_id = relationships['measure_type'].get('data', {}).get('id')

                            duty_rate = {
                                'measure_id': measure_id,
                                'duty': duty_expressions.get(duty_expr_id, 'N/A'),
                                'origin': geographical_areas.get(geo_id, {}).get('code', 'N/A'),
                                'measure_type': measure_types.get(measure_type_id, 'N/A'),
                                'effective_start': measure.get('attributes', {}).get('effective_start_date'),
                                'effective_end': measure.get('attributes', {}).get('effective_end_date')
                            }
                            duty_rates.append(duty_rate)
                            break

        return {
            'code': commodity_code,
            'description': commodity.get('attributes', {}).get('description'),
            'declarable': commodity.get('attributes', {}).get('declarable'),
            'validity_start': commodity.get('attributes', {}).get('validity_start_date'),
            'validity_end': commodity.get('attributes', {}).get('validity_end_date'),
            'duty_rates': duty_rates
        }

    def find_all_headings(self) -> List[str]:
        """Build complete list of heading codes"""
        logger.info("Finding all heading codes...")
        sections = self.get_sections()
        headings = set()

        for section in sections:
            chapters = self.get_chapters(section)
            for chapter_from, chapter_to in chapters:
                chapter_code = f"{chapter_from:02d}"
                url = f"{BASE_URL}/chapters/{chapter_code}"
                data = self.rate_limited_request(url, {'include': 'headings'})

                if data and 'included' in data:
                    for item in data['included']:
                        if item.get('type') == 'heading':
                            heading_id = item.get('attributes', {}).get('goods_nomenclature_item_id')
                            if heading_id:
                                headings.add(heading_id[:4])

        logger.info(f"Found {len(headings)} headings")
        return sorted(list(headings))

    def download_sample_duties(self, headings_limit=10) -> Dict:
        """Download sample duty rates (limited for testing)"""
        logger.info(f"Starting sample download (first {headings_limit} headings)...")

        all_headings = self.find_all_headings()
        sample_headings = all_headings[:headings_limit]
        all_commodities = []

        for heading in sample_headings:
            logger.info(f"Processing heading {heading}...")
            commodities = self.fetch_heading_commodities(heading)

            for commodity in commodities:
                code = commodity.get('attributes', {}).get('goods_nomenclature_item_id')
                if code:
                    all_commodities.append(code)

        logger.info(f"Found {len(all_commodities)} commodities in sample. Fetching details...")

        # Download commodity details
        downloaded = 0
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = {executor.submit(self.fetch_commodity_duty_rates, code): code
                      for code in all_commodities[:50]}  # Limit to first 50 for demo

            for future in as_completed(futures):
                code = futures[future]
                try:
                    result = future.result()
                    if result:
                        self.commodities[result['code']] = result
                        downloaded += 1
                        if downloaded % 10 == 0:
                            logger.info(f"Downloaded {downloaded} commodities...")
                except Exception as e:
                    logger.error(f"Failed to download {code}: {e}")
                    self.errors.append({'code': code, 'error': str(e)})

        return self.format_results()

    def download_all_duties_chunked(self, chunk_size=100) -> Dict:
        """Download all duties with chunking to manage memory"""
        logger.info("Starting full download with chunking...")

        all_headings = self.find_all_headings()
        all_commodities = []

        # Phase 1: Find all commodity codes
        logger.info("Phase 1: Discovering all commodity codes...")
        for i, heading in enumerate(all_headings):
            if i % 100 == 0:
                logger.info(f"Processing heading {i+1}/{len(all_headings)}...")
            commodities = self.fetch_heading_commodities(heading)
            for commodity in commodities:
                code = commodity.get('attributes', {}).get('goods_nomenclature_item_id')
                if code:
                    all_commodities.append(code)

        logger.info(f"Total commodities found: {len(all_commodities)}")

        # Phase 2: Download duty rates in chunks
        logger.info("Phase 2: Downloading duty rates...")
        results = {
            'summary': {
                'total_commodities': len(all_commodities),
                'commodities_with_duties': 0,
                'total_duties': 0
            },
            'duty_summary_by_rate': defaultdict(int)
        }

        for chunk_start in range(0, len(all_commodities), chunk_size):
            chunk = all_commodities[chunk_start:chunk_start + chunk_size]
            chunk_num = chunk_start // chunk_size + 1
            logger.info(f"Downloading chunk {chunk_num} ({len(chunk)} commodities)...")

            with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                futures = {executor.submit(self.fetch_commodity_duty_rates, code): code
                          for code in chunk}

                for future in as_completed(futures):
                    code = futures[future]
                    try:
                        result = future.result()
                        if result and result['duty_rates']:
                            results['summary']['commodities_with_duties'] += 1
                            results['summary']['total_duties'] += len(result['duty_rates'])
                            # Track rate summary
                            for duty in result['duty_rates']:
                                rate = duty.get('duty', 'N/A')
                                results['duty_summary_by_rate'][rate] += 1
                    except Exception as e:
                        logger.error(f"Failed to download {code}: {e}")

        return results

    def format_results(self) -> Dict:
        """Format results for output"""
        # Summary statistics
        total_duties = sum(len(c.get('duty_rates', [])) for c in self.commodities.values())
        duty_rates_by_type = defaultdict(int)

        for commodity in self.commodities.values():
            for duty in commodity.get('duty_rates', []):
                rate = duty.get('duty', 'N/A')
                duty_rates_by_type[rate] += 1

        return {
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'statistics': {
                'total_commodities_downloaded': len(self.commodities),
                'total_duty_rates': total_duties,
                'commodities_with_duties': len([c for c in self.commodities.values() if c.get('duty_rates')]),
                'errors': len(self.errors)
            },
            'duty_rates_summary': dict(sorted(duty_rates_by_type.items(),
                                             key=lambda x: x[1], reverse=True)[:20]),
            'sample_commodities': list(self.commodities.values())[:10],
            'errors': self.errors
        }

    def save_to_json(self, data: Dict):
        """Save results to JSON file"""
        with open(OUTPUT_JSON, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        logger.info(f"Saved results to {OUTPUT_JSON}")

    def save_to_sqlite(self, data: Dict):
        """Save results to SQLite database"""
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()

        # Create tables
        c.execute('''CREATE TABLE IF NOT EXISTS commodities
                     (code TEXT PRIMARY KEY, description TEXT, declarable BOOLEAN,
                      validity_start TEXT, validity_end TEXT)''')

        c.execute('''CREATE TABLE IF NOT EXISTS duty_rates
                     (id INTEGER PRIMARY KEY AUTOINCREMENT, commodity_code TEXT,
                      measure_id TEXT, duty TEXT, origin TEXT, measure_type TEXT,
                      effective_start TEXT, effective_end TEXT,
                      FOREIGN KEY(commodity_code) REFERENCES commodities(code))''')

        # Insert data
        for commodity in self.commodities.values():
            c.execute('INSERT OR REPLACE INTO commodities VALUES (?, ?, ?, ?, ?)',
                     (commodity['code'], commodity['description'],
                      commodity['declarable'], commodity['validity_start'],
                      commodity['validity_end']))

            for duty in commodity.get('duty_rates', []):
                c.execute('INSERT INTO duty_rates VALUES (NULL, ?, ?, ?, ?, ?, ?, ?)',
                         (commodity['code'], duty['measure_id'], duty['duty'],
                          duty['origin'], duty['measure_type'],
                          duty['effective_start'], duty['effective_end']))

        conn.commit()
        conn.close()
        logger.info(f"Saved results to {DB_PATH}")

def main():
    """Main execution"""
    print("="*80)
    print("UK TRADE TARIFF - PRACTICAL DUTY RATE DOWNLOADER")
    print("="*80)

    downloader = DutyRateDownloader(max_workers=5, request_delay=0.1)

    # Download sample (first 10 headings, ~50 commodities)
    print("\nMode: SAMPLE DOWNLOAD (first 10 headings)")
    print("This demonstrates the download process without taking hours\n")

    results = downloader.download_sample_duties(headings_limit=10)

    # Save results
    downloader.save_to_json(results)
    downloader.save_to_sqlite({'commodities': downloader.commodities})

    # Print summary
    print("\n" + "="*80)
    print("RESULTS")
    print("="*80)
    print(f"Commodities downloaded: {results['statistics']['total_commodities_downloaded']}")
    print(f"Total duty rates extracted: {results['statistics']['total_duty_rates']}")
    print(f"Errors encountered: {results['statistics']['errors']}")

    print("\nTop 10 duty rates in sample:")
    for rate, count in list(results['duty_rates_summary'].items())[:10]:
        print(f"  {rate:15s}: {count:4d} instances")

    print("\nSample commodities with duties:")
    for commodity in results['sample_commodities'][:3]:
        print(f"\n  {commodity['code']}: {commodity['description']}")
        for duty in commodity['duty_rates'][:3]:
            print(f"    - {duty['duty']:10s} ({duty['origin']:5s}) - {duty['measure_type']}")

    print("\n" + "="*80)
    print(f"Results saved to:")
    print(f"  JSON: {OUTPUT_JSON}")
    print(f"  DB:   {DB_PATH}")
    print("="*80)

    print("\n[NOTE] To download ALL commodities, modify headings_limit or use")
    print("       download_all_duties_chunked() method. Full download takes ~20-30 minutes.")

if __name__ == "__main__":
    main()
