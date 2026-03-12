#!/usr/bin/env python3
"""
MacMap AGR 임포트 — 53개국 (Supabase Management API 경유)

AGR = Agreement (무역협정별 관세율)
테이블: macmap_agr_rates
컬럼: reporter_iso2, product_code, agreement_id, partner_iso2, nav_flag, av_duty, nav_duty, data_year

사용법: python3 import_agr_all.py
자동 재시작: nohup bash run_agr_loop.sh > agr_import.log 2>&1 &
"""
import os, sys, csv, json, time, subprocess, tempfile
from datetime import datetime

SUPABASE_PROJECT_ID = "zyurflkhiregundhisky"
SUPABASE_TOKEN = "sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a"
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "itc_macmap", "by_country")
BATCH_SIZE = 3000  # AGR has more columns, smaller batch
PROGRESS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "agr_import_progress.json")

# 53 countries (same as MIN)
ALL_COUNTRIES = [
    "ARE", "ARG", "AUS", "BGD", "BHR", "BRA", "CAN", "CHE", "CHL", "CHN",
    "COL", "CRI", "DOM", "DZA", "ECU", "EGY", "EUR", "GBR", "GHA", "HKG",
    "IDN", "IND", "ISR", "JOR", "JPN", "KAZ", "KEN", "KOR", "KWT", "LKA",
    "MAR", "MEX", "MYS", "NGA", "NOR", "NZL", "OMN", "PAK", "PER", "PHL",
    "PRY", "QAT", "RUS", "SAU", "SGP", "THA", "TUN", "TUR", "TWN", "UKR",
    "URY", "USA", "VNM",
]

M49_TO_ISO2 = {
    '004':'AF','008':'AL','012':'DZ','020':'AD','024':'AO','028':'AG','031':'AZ','032':'AR',
    '036':'AU','040':'AT','044':'BS','048':'BH','050':'BD','051':'AM','052':'BB','056':'BE',
    '060':'BM','064':'BT','068':'BO','070':'BA','072':'BW','076':'BR','084':'BZ','090':'SB',
    '096':'BN','100':'BG','104':'MM','108':'BI','112':'BY','116':'KH','120':'CM','124':'CA',
    '132':'CV','140':'CF','144':'LK','148':'TD','152':'CL','156':'CN','170':'CO','174':'KM',
    '178':'CG','180':'CD','184':'CK','188':'CR','191':'HR','192':'CU','196':'CY','203':'CZ',
    '204':'BJ','208':'DK','212':'DM','214':'DO','218':'EC','222':'SV','226':'GQ','231':'ET',
    '232':'ER','233':'EE','234':'FO','242':'FJ','246':'FI','250':'FR','251':'FR','254':'GF',
    '258':'PF','262':'DJ','266':'GA','268':'GE','270':'GM','275':'PS','276':'DE','288':'GH',
    '292':'GI','296':'KI','300':'GR','304':'GL','308':'GD','316':'GU','320':'GT','324':'GN',
    '328':'GY','332':'HT','340':'HN','344':'HK','348':'HU','352':'IS','356':'IN','360':'ID',
    '364':'IR','368':'IQ','372':'IE','376':'IL','380':'IT','381':'IT','384':'CI','388':'JM',
    '392':'JP','398':'KZ','400':'JO','404':'KE','408':'KP','410':'KR','414':'KW','417':'KG',
    '418':'LA','422':'LB','426':'LS','428':'LV','430':'LR','434':'LY','440':'LT','442':'LU',
    '446':'MO','450':'MG','454':'MW','458':'MY','462':'MV','466':'ML','470':'MT','478':'MR',
    '480':'MU','484':'MX','488':'MN','490':'TW','492':'MC','496':'MN','498':'MD','499':'ME',
    '500':'MS','504':'MA','508':'MZ','512':'OM','516':'NA','520':'NR','524':'NP','528':'NL',
    '540':'NC','548':'VU','554':'NZ','558':'NI','562':'NE','566':'NG','570':'NU','574':'NF',
    '578':'NO','579':'NO','580':'MP','583':'FM','584':'MH','585':'PW','586':'PK','591':'PA',
    '598':'PG','600':'PY','604':'PE','608':'PH','616':'PL','620':'PT','624':'GW','630':'PR',
    '634':'QA','642':'RO','643':'RU','646':'RW','654':'SH','659':'KN','660':'AI','662':'LC',
    '670':'VC','674':'SM','678':'ST','682':'SA','686':'SN','688':'RS','690':'SC','694':'SL',
    '699':'IN','702':'SG','703':'SK','704':'VN','705':'SI','706':'SO','710':'ZA','716':'ZW',
    '724':'ES','728':'SS','729':'SD','732':'EH','736':'SD','740':'SR','748':'SZ','752':'SE',
    '756':'CH','757':'CH','760':'SY','762':'TJ','764':'TH','768':'TG','772':'TK','776':'TO',
    '780':'TT','784':'AE','788':'TN','792':'TR','795':'TM','796':'TC','800':'UG','804':'UA',
    '807':'MK','818':'EG','826':'GB','834':'TZ','840':'US','842':'US','849':'VI','854':'BF',
    '858':'UY','860':'UZ','862':'VE','876':'WF','882':'WS','887':'YE','894':'ZM','918':'EU',
}

def log(msg):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}", flush=True)

def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_progress(progress):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)

def execute_sql(query, retries=3):
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump({"query": query}, f)
        tmp_path = f.name
    try:
        for attempt in range(1, retries + 1):
            try:
                result = subprocess.run([
                    'curl', '-s', '-X', 'POST',
                    f'https://api.supabase.com/v1/projects/{SUPABASE_PROJECT_ID}/database/query',
                    '-H', f'Authorization: Bearer {SUPABASE_TOKEN}',
                    '-H', 'Content-Type: application/json',
                    '-d', f'@{tmp_path}'
                ], capture_output=True, text=True, timeout=180)
                return result.stdout
            except subprocess.TimeoutExpired:
                log(f"    curl 타임아웃 (시도 {attempt}/{retries}), 30초 대기")
                time.sleep(30)
            except Exception as e:
                log(f"    curl 에러 (시도 {attempt}/{retries}): {e}, 15초 대기")
                time.sleep(15)
        return '{"error": "all retries failed"}'
    finally:
        os.unlink(tmp_path)

def find_agr_file(country_iso3):
    country_dir = os.path.join(DATA_DIR, country_iso3)
    if not os.path.isdir(country_dir):
        return None
    for fname in os.listdir(country_dir):
        if '_agr.txt' in fname.lower() and '_desc' not in fname.lower() and '_tr' not in fname.lower():
            return os.path.join(country_dir, fname)
    return None

def escape_sql(val):
    """SQL 문자열 이스케이프"""
    if val is None:
        return ''
    return str(val).replace("'", "''").replace("\\", "\\\\")

def import_country(country_iso3, progress):
    agr_file = find_agr_file(country_iso3)
    if not agr_file:
        log(f"  {country_iso3}: AGR 파일 없음, 건너뜀")
        return 0

    skip_rows = progress.get(country_iso3, {}).get('rows_done', 0)
    log(f"  {country_iso3}: {agr_file}")
    if skip_rows > 0:
        log(f"  이전 진행: {skip_rows}행 건너뜀")

    total_inserted = 0
    batch_values = []
    row_count = 0

    with open(agr_file, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f, delimiter='\t')
        for row in reader:
            row_count += 1
            if row_count <= skip_rows:
                continue

            m49_reporter = (row.get('ReportingCountry') or '').strip()
            m49_partner = (row.get('PartnerCountry') or '').strip()
            reporter_iso2 = M49_TO_ISO2.get(m49_reporter, 'XX')
            partner_iso2 = M49_TO_ISO2.get(m49_partner, 'XX')
            product_code = escape_sql((row.get('ProductCode') or '').strip())
            agreement_id = escape_sql((row.get('Agreement_id') or '').strip())
            nav_flag_raw = (row.get('Nav_flag') or '0').strip()
            av_duty_raw = (row.get('AvDuty') or '0').strip()
            nav_duty = escape_sql((row.get('NavDuty') or '').strip())
            year = (row.get('Year') or '2023').strip()

            try:
                av_duty_val = float(av_duty_raw) if av_duty_raw else 0
            except ValueError:
                av_duty_val = 0
            try:
                nav_flag_val = int(nav_flag_raw) if nav_flag_raw else 0
            except ValueError:
                nav_flag_val = 0

            batch_values.append(
                f"('{reporter_iso2}','{product_code}','{agreement_id}','{partner_iso2}',{nav_flag_val},{av_duty_val},'{nav_duty}',{year})"
            )

            if len(batch_values) >= BATCH_SIZE:
                sql = f"""INSERT INTO macmap_agr_rates (reporter_iso2, product_code, agreement_id, partner_iso2, nav_flag, av_duty, nav_duty, data_year)
VALUES {','.join(batch_values)}
ON CONFLICT DO NOTHING;"""
                result = execute_sql(sql)
                if '"error"' in str(result).lower() and '"could not' in str(result).lower():
                    log(f"  ERROR at row {row_count}: {result[:200]}")
                    save_progress({**progress, country_iso3: {'rows_done': row_count - len(batch_values), 'status': 'error'}})
                    return total_inserted

                total_inserted += len(batch_values)
                batch_values = []

                if total_inserted % 30000 == 0:
                    log(f"  {country_iso3}: {total_inserted:,} / ~{row_count:,} 행 삽입")
                    save_progress({**progress, country_iso3: {'rows_done': row_count, 'status': 'in_progress'}})

    if batch_values:
        sql = f"""INSERT INTO macmap_agr_rates (reporter_iso2, product_code, agreement_id, partner_iso2, nav_flag, av_duty, nav_duty, data_year)
VALUES {','.join(batch_values)}
ON CONFLICT DO NOTHING;"""
        execute_sql(sql)
        total_inserted += len(batch_values)

    progress[country_iso3] = {'rows_done': row_count, 'status': 'done', 'total': total_inserted}
    save_progress(progress)
    return total_inserted

def main():
    log("=" * 60)
    log("MacMap AGR 임포트 시작 (53개국, ~144M행)")
    log("=" * 60)

    progress = load_progress()
    grand_total = 0
    start_time = time.time()

    for i, country in enumerate(ALL_COUNTRIES, 1):
        if progress.get(country, {}).get('status') == 'done':
            log(f"[{i}/53] {country}: 이미 완료, 건너뜀")
            continue

        log(f"[{i}/53] {country} 처리 시작...")
        country_start = time.time()
        inserted = import_country(country, progress)
        elapsed = time.time() - country_start
        speed = int(inserted / elapsed) if elapsed > 0 else 0
        log(f"[{i}/53] {country} 완료: {inserted:,}행, {elapsed:.0f}초, {speed:,}행/초")
        grand_total += inserted

    total_elapsed = time.time() - start_time
    log("=" * 60)
    log(f"전체 완료: {grand_total:,}행, {total_elapsed:.0f}초")
    log("=" * 60)

if __name__ == '__main__':
    main()
