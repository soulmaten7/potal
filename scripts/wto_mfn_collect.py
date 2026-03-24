#!/usr/bin/env python3
"""
WTO API → macmap_ntlc_rates: 160개국 MFN 세율 수집
Usage: python3 scripts/wto_mfn_collect.py
"""
import requests, json, time, csv, sys, subprocess

WTO_KEY = 'e6b00ecdb5b34e09aabe15e68ab71d1d'
BASE_URL = 'https://api.wto.org/timeseries/v1/data'
HEADERS = {'Ocp-Apim-Subscription-Key': WTO_KEY}
CSV_PATH = '/tmp/wto_mfn_rates.csv'
PSQL = '/opt/homebrew/opt/libpq/bin/psql'
DB_CONN = f"PGPASSWORD='potalqwepoi2@' {PSQL} -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres"

# ISO3A → ISO2 mapping (standard)
ISO3_TO_ISO2 = {
    'AFG':'AF','ALB':'AL','DZA':'DZ','AND':'AD','AGO':'AO','ATG':'AG','ARG':'AR','ARM':'AM','AUS':'AU','AUT':'AT',
    'AZE':'AZ','BHS':'BS','BHR':'BH','BGD':'BD','BRB':'BB','BLR':'BY','BEL':'BE','BLZ':'BZ','BEN':'BJ','BTN':'BT',
    'BOL':'BO','BIH':'BA','BWA':'BW','BRA':'BR','BRN':'BN','BGR':'BG','BFA':'BF','BDI':'BI','CPV':'CV','KHM':'KH',
    'CMR':'CM','CAN':'CA','CAF':'CF','TCD':'TD','CHL':'CL','CHN':'CN','COL':'CO','COM':'KM','COG':'CG','COD':'CD',
    'CRI':'CR','CIV':'CI','HRV':'HR','CUB':'CU','CYP':'CY','CZE':'CZ','DNK':'DK','DJI':'DJ','DMA':'DM','DOM':'DO',
    'ECU':'EC','EGY':'EG','SLV':'SV','GNQ':'GQ','ERI':'ER','EST':'EE','SWZ':'SZ','ETH':'ET','FJI':'FJ','FIN':'FI',
    'FRA':'FR','GAB':'GA','GMB':'GM','GEO':'GE','DEU':'DE','GHA':'GH','GRC':'GR','GRD':'GD','GTM':'GT','GIN':'GN',
    'GNB':'GW','GUY':'GY','HTI':'HT','HND':'HN','HKG':'HK','HUN':'HU','ISL':'IS','IND':'IN','IDN':'ID','IRN':'IR',
    'IRQ':'IQ','IRL':'IE','ISR':'IL','ITA':'IT','JAM':'JM','JPN':'JP','JOR':'JO','KAZ':'KZ','KEN':'KE','KIR':'KI',
    'KOR':'KR','KWT':'KW','KGZ':'KG','LAO':'LA','LVA':'LV','LBN':'LB','LSO':'LS','LBR':'LR','LBY':'LY','LIE':'LI',
    'LTU':'LT','LUX':'LU','MDG':'MG','MWI':'MW','MYS':'MY','MDV':'MV','MLI':'ML','MLT':'MT','MHL':'MH','MRT':'MR',
    'MUS':'MU','MEX':'MX','FSM':'FM','MDA':'MD','MCO':'MC','MNG':'MN','MNE':'ME','MAR':'MA','MOZ':'MZ','MMR':'MM',
    'NAM':'NA','NRU':'NR','NPL':'NP','NLD':'NL','NZL':'NZ','NIC':'NI','NER':'NE','NGA':'NG','MKD':'MK','NOR':'NO',
    'OMN':'OM','PAK':'PK','PLW':'PW','PAN':'PA','PNG':'PG','PRY':'PY','PER':'PE','PHL':'PH','POL':'PL','PRT':'PT',
    'QAT':'QA','ROU':'RO','RUS':'RU','RWA':'RW','KNA':'KN','LCA':'LC','VCT':'VC','WSM':'WS','SMR':'SM','STP':'ST',
    'SAU':'SA','SEN':'SN','SRB':'RS','SYC':'SC','SLE':'SL','SGP':'SG','SVK':'SK','SVN':'SI','SLB':'SB','SOM':'SO',
    'ZAF':'ZA','ESP':'ES','LKA':'LK','SDN':'SD','SUR':'SR','SWE':'SE','CHE':'CH','SYR':'SY','TWN':'TW','TJK':'TJ',
    'TZA':'TZ','THA':'TH','TLS':'TL','TGO':'TG','TON':'TO','TTO':'TT','TUN':'TN','TUR':'TR','TKM':'TM','TUV':'TV',
    'UGA':'UG','UKR':'UA','ARE':'AE','GBR':'GB','USA':'US','URY':'UY','UZB':'UZ','VUT':'VU','VEN':'VE','VNM':'VN',
    'YEM':'YE','ZMB':'ZM','ZWE':'ZW','PSE':'PS','SSD':'SS','XKX':'XK',
}

# EU members (already mapped in duty-rate-lookup.ts)
EU_MEMBERS = {'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'}

# Already in macmap_ntlc_rates
MACMAP_COUNTRIES = {'AE','AR','AU','BD','BH','BR','CA','CH','CL','CN','CO','CR','DO','DZ','EC','EG','EU','GB','GH','HK','ID','IL','IN','JO','JP','KE','KR','KW','KZ','LK','MA','MX','MY','NG','NO','NZ','OM','PE','PH','PK','PY','QA','RU','SA','SG','TH','TN','TR','TW','UA','US','UY','VN'}

def get_target_countries():
    """160개국 = 240 - 53(macmap) - 27(EU members)"""
    # Load WTO reporters
    reporters = json.load(open('/tmp/wto_reporters.json'))
    wto_map = {}  # iso2 → wto_code
    for r in reporters:
        iso3 = r.get('iso3A')
        if iso3 and iso3 in ISO3_TO_ISO2:
            iso2 = ISO3_TO_ISO2[iso3]
            wto_map[iso2] = r['code']

    targets = []
    for iso2, wto_code in wto_map.items():
        if iso2 in MACMAP_COUNTRIES or iso2 in EU_MEMBERS:
            continue
        targets.append((iso2, wto_code))

    targets.sort(key=lambda x: x[0])
    return targets, wto_map

def fetch_mfn(wto_code, years='2024,2023,2022,2021'):
    """1 API call → 국가의 전체 HS6 MFN 세율"""
    params = {
        'i': 'HS_A_0010',
        'r': wto_code,
        'ps': years,
        'pc': 'HS6',
        'fmt': 'json',
        'lang': '1',
        'max': '50000',
    }
    try:
        resp = requests.get(BASE_URL, headers=HEADERS, params=params, timeout=60)
        if resp.status_code == 204:
            return []
        if resp.status_code != 200:
            print(f'  HTTP {resp.status_code}: {resp.text[:100]}')
            return None  # Error (retry later)
        data = resp.json()
        return data.get('Dataset', [])
    except Exception as e:
        print(f'  Error: {e}')
        return None

def process_dataset(iso2, dataset):
    """WTO dataset → CSV rows (macmap format)"""
    # Group by HS6, take latest year
    hs6_rates = {}
    for row in dataset:
        hs6 = row.get('ProductOrSectorCode', '')
        if len(hs6) != 6:
            continue
        year = int(row.get('Year') or 0)
        value = row.get('Value')
        if value is None:
            continue
        try:
            pct = float(value)
        except:
            continue

        if hs6 not in hs6_rates or year > hs6_rates[hs6][0]:
            hs6_rates[hs6] = (year, pct)

    rows = []
    for hs6, (year, pct) in hs6_rates.items():
        mfn_rate = round(pct / 100, 6)  # WTO % → macmap ratio (12.0 → 0.12)
        rows.append({
            'destination_country': iso2,
            'hs_code': hs6,
            'hs6': hs6,
            'mfn_rate': mfn_rate,
            'rate_type': 'ad_valorem',
            'source': 'wto_api',
        })
    return rows

def main():
    targets, wto_map = get_target_countries()
    print(f'Target countries: {len(targets)}')
    print(f'First 10: {[t[0] for t in targets[:10]]}')

    all_rows = []
    success = []
    failed = []
    no_data = []

    for i, (iso2, wto_code) in enumerate(targets):
        print(f'[{i+1}/{len(targets)}] {iso2} (WTO:{wto_code})...', end=' ', flush=True)

        dataset = fetch_mfn(wto_code)
        if dataset is None:
            print('FAILED (API error)')
            failed.append(iso2)
            time.sleep(2)
            continue
        if len(dataset) == 0:
            print('NO DATA')
            no_data.append(iso2)
            time.sleep(1)
            continue

        rows = process_dataset(iso2, dataset)
        all_rows.extend(rows)
        hs6_count = len(rows)
        success.append(iso2)
        print(f'{len(dataset)} records → {hs6_count} HS6 codes')

        time.sleep(1)  # Rate limit

    # Write CSV
    print(f'\n=== Results ===')
    print(f'Success: {len(success)} countries')
    print(f'No data: {len(no_data)} countries: {no_data}')
    print(f'Failed: {len(failed)} countries: {failed}')
    print(f'Total rows: {len(all_rows)}')

    if all_rows:
        with open(CSV_PATH, 'w', newline='') as f:
            w = csv.DictWriter(f, fieldnames=['destination_country','hs_code','hs6','mfn_rate','rate_type','source'])
            w.writeheader()
            w.writerows(all_rows)
        print(f'\nCSV saved: {CSV_PATH} ({len(all_rows)} rows)')

    # Summary
    with open('/tmp/wto_collect_summary.json', 'w') as f:
        json.dump({
            'success': success,
            'no_data': no_data,
            'failed': failed,
            'total_rows': len(all_rows),
        }, f, indent=2)

    print(f'\nNext: INSERT into macmap_ntlc_rates via psql \\copy')

if __name__ == '__main__':
    main()
