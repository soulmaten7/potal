#!/usr/bin/env python3
"""
MacMap MIN 임포트 — 남은 9개국 (Supabase Management API 경유)
SGP, THA, TUN, TUR, TWN, UKR, URY, USA, VNM

사용법: python3 import_min_remaining.py
"""
import os, sys, csv, json, time, subprocess, tempfile
from datetime import datetime

SUPABASE_PROJECT_ID = "zyurflkhiregundhisky"
SUPABASE_TOKEN = "sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a"
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "itc_macmap", "by_country")
BATCH_SIZE = 5000
PROGRESS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "min_import_progress.json")

REMAINING_COUNTRIES = ["SGP", "THA", "TUN", "TUR", "TWN", "UKR", "URY", "USA", "VNM"]

M49_TO_ISO2 = {
    '004':'AF','008':'AL','012':'DZ','020':'AD','024':'AO','028':'AG','031':'AZ','032':'AR',
    '036':'AU','040':'AT','044':'BS','048':'BH','050':'BD','051':'AM','052':'BB','056':'BE',
    '060':'BM','064':'BT','068':'BO','070':'BA','072':'BW','076':'BR','084':'BZ','090':'SB',
    '096':'BN','100':'BG','104':'MM','108':'BI','112':'BY','116':'KH','120':'CM','124':'CA',
    '132':'CV','140':'CF','144':'LK','148':'TD','152':'CL','156':'CN','170':'CO','174':'KM',
    '178':'CG','180':'CD','184':'CK','188':'CR','191':'HR','192':'CU','196':'CY','203':'CZ',
    '204':'BJ','208':'DK','212':'DM','214':'DO','218':'EC','222':'SV','226':'GQ','231':'ET',
    '232':'ER','233':'EE','234':'FO','242':'FJ','246':'FI','250':'FR','266':'GA','268':'GE',
    '270':'GM','276':'DE','288':'GH','300':'GR','308':'GD','320':'GT','324':'GN','328':'GY',
    '332':'HT','340':'HN','344':'HK','348':'HU','352':'IS','356':'IN','360':'ID','364':'IR',
    '368':'IQ','372':'IE','376':'IL','380':'IT','384':'CI','388':'JM','392':'JP','398':'KZ',
    '400':'JO','404':'KE','408':'KP','410':'KR','414':'KW','417':'KG','418':'LA','422':'LB',
    '426':'LS','428':'LV','430':'LR','434':'LY','440':'LT','442':'LU','446':'MO','450':'MG',
    '454':'MW','458':'MY','462':'MV','466':'ML','470':'MT','478':'MR','480':'MU','484':'MX',
    '492':'MC','496':'MN','498':'MD','499':'ME','504':'MA','508':'MZ','512':'OM','516':'NA',
    '520':'NR','524':'NP','528':'NL','540':'NC','548':'VU','554':'NZ','558':'NI','562':'NE',
    '566':'NG','578':'NO','586':'PK','591':'PA','598':'PG','600':'PY','604':'PE','608':'PH',
    '616':'PL','620':'PT','634':'QA','642':'RO','643':'RU','646':'RW','682':'SA','686':'SN',
    '688':'RS','694':'SL','702':'SG','703':'SK','704':'VN','705':'SI','706':'SO','710':'ZA',
    '716':'ZW','724':'ES','728':'SS','729':'SD','740':'SR','752':'SE','756':'CH','760':'SY',
    '762':'TJ','764':'TH','768':'TG','776':'TO','780':'TT','784':'AE','788':'TN','792':'TR',
    '795':'TM','800':'UG','804':'UA','807':'MK','818':'EG','826':'GB','834':'TZ','840':'US',
    '842':'US','854':'BF','858':'UY','860':'UZ','862':'VE','882':'WS','887':'YE','894':'ZM',
    '490':'TW','699':'IN','757':'CH','918':'EU','381':'IT',
}

def log(msg):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}", flush=True)

def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            return json.load(f)
    return {}

def save_progress(progress):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)

def execute_sql(query):
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump({"query": query}, f)
        tmp_path = f.name
    try:
        result = subprocess.run([
            'curl', '-s', '-X', 'POST',
            f'https://api.supabase.com/v1/projects/{SUPABASE_PROJECT_ID}/database/query',
            '-H', f'Authorization: Bearer {SUPABASE_TOKEN}',
            '-H', 'Content-Type: application/json',
            '-d', f'@{tmp_path}'
        ], capture_output=True, text=True, timeout=120)
        return result.stdout
    finally:
        os.unlink(tmp_path)

def find_min_file(country_iso3):
    country_dir = os.path.join(DATA_DIR, country_iso3)
    if not os.path.isdir(country_dir):
        return None
    for fname in os.listdir(country_dir):
        if '_min.txt' in fname.lower() and '_desc' not in fname.lower():
            return os.path.join(country_dir, fname)
    return None

def import_country(country_iso3, progress):
    min_file = find_min_file(country_iso3)
    if not min_file:
        log(f"  {country_iso3}: MIN 파일 없음, 건너뜀")
        return 0

    skip_rows = progress.get(country_iso3, {}).get('rows_done', 0)
    log(f"  {country_iso3}: {min_file}")
    if skip_rows > 0:
        log(f"  이전 진행: {skip_rows}행 건너뜀")

    total_inserted = 0
    batch_values = []
    row_count = 0

    with open(min_file, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f, delimiter='\t')
        for row in reader:
            row_count += 1
            if row_count <= skip_rows:
                continue

            m49_reporter = row.get('ReportingCountry', '').strip()
            m49_partner = row.get('PartnerCountry', '').strip()
            reporter_iso2 = M49_TO_ISO2.get(m49_reporter, 'XX')
            partner_iso2 = M49_TO_ISO2.get(m49_partner, 'XX')
            product_code = row.get('ProductCode', '').strip().replace("'", "''")
            av_duty = row.get('AvDuty', '0').strip()
            year = row.get('Year', '2023').strip()

            try:
                av_duty_val = float(av_duty) if av_duty else 0
            except ValueError:
                av_duty_val = 0

            batch_values.append(
                f"('{reporter_iso2}','{product_code}','{partner_iso2}',{av_duty_val},{year})"
            )

            if len(batch_values) >= BATCH_SIZE:
                sql = f"""INSERT INTO macmap_min_rates (reporter_iso2, product_code, partner_iso2, av_duty, data_year)
VALUES {','.join(batch_values)}
ON CONFLICT DO NOTHING;"""
                result = execute_sql(sql)
                if '"error"' in str(result).lower() and '"could not' in str(result).lower():
                    log(f"  ERROR at row {row_count}: {result[:200]}")
                    save_progress({**progress, country_iso3: {'rows_done': row_count - len(batch_values), 'status': 'error'}})
                    return total_inserted

                total_inserted += len(batch_values)
                batch_values = []

                if total_inserted % 50000 == 0:
                    log(f"  {country_iso3}: {total_inserted:,} / ~{row_count:,} 행 삽입")
                    save_progress({**progress, country_iso3: {'rows_done': row_count, 'status': 'in_progress'}})

    if batch_values:
        sql = f"""INSERT INTO macmap_min_rates (reporter_iso2, product_code, partner_iso2, av_duty, data_year)
VALUES {','.join(batch_values)}
ON CONFLICT DO NOTHING;"""
        execute_sql(sql)
        total_inserted += len(batch_values)

    progress[country_iso3] = {'rows_done': row_count, 'status': 'done', 'total': total_inserted}
    save_progress(progress)
    return total_inserted

def main():
    log("=" * 60)
    log("MacMap MIN 임포트 시작 (남은 9개국)")
    log("=" * 60)

    progress = load_progress()
    grand_total = 0
    start_time = time.time()

    for i, country in enumerate(REMAINING_COUNTRIES, 1):
        if progress.get(country, {}).get('status') == 'done':
            log(f"[{i}/9] {country}: 이미 완료, 건너뜀")
            continue

        log(f"[{i}/9] {country} 처리 시작...")
        country_start = time.time()
        inserted = import_country(country, progress)
        elapsed = time.time() - country_start
        speed = int(inserted / elapsed) if elapsed > 0 else 0
        log(f"[{i}/9] {country} 완료: {inserted:,}행, {elapsed:.0f}초, {speed:,}행/초")
        grand_total += inserted

    total_elapsed = time.time() - start_time
    log("=" * 60)
    log(f"전체 완료: {grand_total:,}행, {total_elapsed:.0f}초")
    log("=" * 60)

if __name__ == '__main__':
    main()
