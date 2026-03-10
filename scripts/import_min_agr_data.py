#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MacMap MIN (MFN 다국간 협상) 및 AGR (협정) 데이터 대량 임포트 스크립트.

사용법 (Mac 터미널에서):
1. pip3 install psycopg2-binary
2. python3 import_min_agr_data.py \\
     --db-url "postgresql://postgres.PROJECT_ID:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres" \\
     --data-dir "/path/to/data/itc_macmap/by_country" \\
     --type both

이 스크립트는:
- MacMap 데이터 파일들을 읽고
- M49 코드를 ISO2로 변환하고
- Supabase PostgreSQL에 COPY를 사용하여 고속 대량 임포트
- 정합성 검증 및 진행률 표시
"""

import os
import sys
import csv
import argparse
import time
from io import StringIO
from datetime import datetime
from pathlib import Path
from collections import defaultdict
from urllib.parse import urlparse

try:
    import psycopg2
    from psycopg2 import sql, extras
except ImportError:
    print("ERROR: psycopg2 설치 필요. 다음 명령 실행:")
    print("  pip3 install psycopg2-binary")
    sys.exit(1)


# ==============================================================================
# M49 -> ISO2 매핑 (ITC MacMap 데이터용)
# ==============================================================================
M49_TO_ISO2 = {
    '004': 'AF',  # Afghanistan
    '008': 'AL',  # Albania
    '012': 'DZ',  # Algeria
    '016': 'AS',  # American Samoa
    '020': 'AD',  # Andorra
    '024': 'AO',  # Angola
    '028': 'AG',  # Antigua and Barbuda
    '031': 'AZ',  # Azerbaijan
    '032': 'AR',  # Argentina
    '036': 'AU',  # Australia
    '040': 'AT',  # Austria
    '044': 'BS',  # Bahamas
    '048': 'BH',  # Bahrain
    '050': 'BD',  # Bangladesh
    '051': 'AM',  # Armenia
    '052': 'BB',  # Barbados
    '056': 'BE',  # Belgium
    '060': 'BM',  # Bermuda
    '064': 'BT',  # Bhutan
    '068': 'BO',  # Bolivia
    '070': 'BA',  # Bosnia and Herzegovina
    '072': 'BW',  # Botswana
    '074': 'BV',  # Bouvet Island
    '076': 'BR',  # Brazil
    '084': 'BZ',  # Belize
    '086': 'IO',  # British Indian Ocean Territory
    '090': 'SB',  # Solomon Islands
    '092': 'VG',  # British Virgin Islands
    '096': 'BN',  # Brunei
    '100': 'BG',  # Bulgaria
    '104': 'MM',  # Myanmar
    '108': 'BI',  # Burundi
    '112': 'BY',  # Belarus
    '116': 'KH',  # Cambodia
    '120': 'CM',  # Cameroon
    '124': 'CA',  # Canada
    '132': 'CV',  # Cabo Verde
    '136': 'KY',  # Cayman Islands
    '140': 'CF',  # Central African Republic
    '144': 'LK',  # Sri Lanka
    '148': 'TD',  # Chad
    '152': 'CL',  # Chile
    '156': 'CN',  # China
    '162': 'CX',  # Christmas Island
    '166': 'CC',  # Cocos Islands
    '170': 'CO',  # Colombia
    '174': 'KM',  # Comoros
    '175': 'YT',  # Mayotte
    '178': 'CG',  # Congo (Republic)
    '180': 'CD',  # Congo (DR)
    '184': 'CK',  # Cook Islands
    '188': 'CR',  # Costa Rica
    '191': 'HR',  # Croatia
    '192': 'CU',  # Cuba
    '196': 'CY',  # Cyprus
    '203': 'CZ',  # Czech Republic
    '204': 'BJ',  # Benin
    '208': 'DK',  # Denmark
    '212': 'DM',  # Dominica
    '214': 'DO',  # Dominican Republic
    '218': 'EC',  # Ecuador
    '222': 'SV',  # El Salvador
    '226': 'GQ',  # Equatorial Guinea
    '231': 'ET',  # Ethiopia
    '232': 'ER',  # Eritrea
    '233': 'EE',  # Estonia
    '234': 'FO',  # Faroe Islands
    '238': 'FK',  # Falkland Islands
    '239': 'GS',  # South Georgia
    '242': 'FJ',  # Fiji
    '246': 'FI',  # Finland
    '251': 'FR',  # France
    '254': 'GF',  # French Guiana
    '258': 'PF',  # French Polynesia
    '260': 'TF',  # French Southern Territories
    '262': 'DJ',  # Djibouti
    '266': 'GA',  # Gabon
    '268': 'GE',  # Georgia
    '270': 'GM',  # Gambia
    '275': 'PS',  # Palestine
    '276': 'DE',  # Germany
    '288': 'GH',  # Ghana
    '292': 'GI',  # Gibraltar
    '296': 'KI',  # Kiribati
    '300': 'GR',  # Greece
    '304': 'GL',  # Greenland
    '308': 'GD',  # Grenada
    '316': 'GU',  # Guam
    '320': 'GT',  # Guatemala
    '324': 'GN',  # Guinea
    '328': 'GY',  # Guyana
    '332': 'HT',  # Haiti
    '334': 'HM',  # Heard Island
    '340': 'HN',  # Honduras
    '344': 'HK',  # Hong Kong
    '348': 'HU',  # Hungary
    '352': 'IS',  # Iceland
    '356': 'IN',  # India (standard M49)
    '360': 'ID',  # Indonesia
    '364': 'IR',  # Iran
    '368': 'IQ',  # Iraq
    '372': 'IE',  # Ireland
    '376': 'IL',  # Israel
    '381': 'IT',  # Italy (ITC uses 381)
    '384': 'CI',  # Côte d'Ivoire
    '388': 'JM',  # Jamaica
    '392': 'JP',  # Japan
    '398': 'KZ',  # Kazakhstan
    '400': 'JO',  # Jordan
    '404': 'KE',  # Kenya
    '408': 'KP',  # North Korea
    '410': 'KR',  # South Korea
    '414': 'KW',  # Kuwait
    '417': 'KG',  # Kyrgyzstan
    '418': 'LA',  # Laos
    '422': 'LB',  # Lebanon
    '426': 'LS',  # Lesotho
    '428': 'LV',  # Latvia
    '430': 'LR',  # Liberia
    '434': 'LY',  # Libya
    '438': 'LI',  # Liechtenstein
    '440': 'LT',  # Lithuania
    '442': 'LU',  # Luxembourg
    '446': 'MO',  # Macao
    '450': 'MG',  # Madagascar
    '454': 'MW',  # Malawi
    '458': 'MY',  # Malaysia
    '462': 'MV',  # Maldives
    '466': 'ML',  # Mali
    '470': 'MT',  # Malta
    '478': 'MR',  # Mauritania
    '480': 'MU',  # Mauritius
    '484': 'MX',  # Mexico
    '488': 'MN',  # Mongolia (ITC variant)
    '490': 'TW',  # Taiwan (ITC code)
    '496': 'MN',  # Mongolia (standard M49)
    '498': 'MD',  # Moldova
    '499': 'ME',  # Montenegro
    '500': 'MS',  # Montserrat
    '504': 'MA',  # Morocco
    '508': 'MZ',  # Mozambique
    '512': 'OM',  # Oman
    '516': 'NA',  # Namibia
    '520': 'NR',  # Nauru
    '524': 'NP',  # Nepal
    '528': 'NL',  # Netherlands
    '530': 'AN',  # Netherlands Antilles (legacy)
    '533': 'AW',  # Aruba
    '540': 'NC',  # New Caledonia
    '548': 'VU',  # Vanuatu
    '554': 'NZ',  # New Zealand
    '558': 'NI',  # Nicaragua
    '562': 'NE',  # Niger
    '566': 'NG',  # Nigeria
    '570': 'NU',  # Niue
    '574': 'NF',  # Norfolk Island
    '579': 'NO',  # Norway
    '580': 'MP',  # Northern Mariana Islands
    '582': 'FM',  # Micronesia (ITC variant)
    '583': 'FM',  # Micronesia
    '584': 'MH',  # Marshall Islands
    '585': 'PW',  # Palau
    '586': 'PK',  # Pakistan
    '591': 'PA',  # Panama
    '598': 'PG',  # Papua New Guinea
    '600': 'PY',  # Paraguay
    '604': 'PE',  # Peru
    '608': 'PH',  # Philippines
    '612': 'PN',  # Pitcairn
    '616': 'PL',  # Poland
    '620': 'PT',  # Portugal
    '624': 'GW',  # Guinea-Bissau
    '626': 'TL',  # Timor-Leste
    '630': 'PR',  # Puerto Rico
    '634': 'QA',  # Qatar
    '642': 'RO',  # Romania
    '643': 'RU',  # Russia
    '646': 'RW',  # Rwanda
    '654': 'SH',  # Saint Helena
    '659': 'KN',  # Saint Kitts and Nevis
    '660': 'AI',  # Anguilla
    '662': 'LC',  # Saint Lucia
    '666': 'PM',  # Saint Pierre and Miquelon
    '670': 'VC',  # Saint Vincent
    '674': 'SM',  # San Marino
    '678': 'ST',  # Sao Tome and Principe
    '682': 'SA',  # Saudi Arabia
    '686': 'SN',  # Senegal
    '688': 'RS',  # Serbia
    '690': 'SC',  # Seychelles
    '694': 'SL',  # Sierra Leone
    '699': 'IN',  # India (ITC custom code)
    '702': 'SG',  # Singapore
    '703': 'SK',  # Slovakia
    '704': 'VN',  # Vietnam
    '705': 'SI',  # Slovenia
    '706': 'SO',  # Somalia
    '710': 'ZA',  # South Africa
    '716': 'ZW',  # Zimbabwe
    '724': 'ES',  # Spain
    '728': 'SS',  # South Sudan
    '732': 'EH',  # Western Sahara
    '736': 'SD',  # Sudan
    '740': 'SR',  # Suriname
    '744': 'SJ',  # Svalbard
    '748': 'SZ',  # Eswatini
    '752': 'SE',  # Sweden
    '757': 'CH',  # Switzerland (ITC code)
    '760': 'SY',  # Syria
    '762': 'TJ',  # Tajikistan
    '764': 'TH',  # Thailand
    '768': 'TG',  # Togo
    '772': 'TK',  # Tokelau
    '776': 'TO',  # Tonga
    '780': 'TT',  # Trinidad and Tobago
    '784': 'AE',  # UAE
    '788': 'TN',  # Tunisia
    '792': 'TR',  # Turkey
    '795': 'TM',  # Turkmenistan
    '796': 'TC',  # Turks and Caicos
    '798': 'TV',  # Tuvalu
    '800': 'UG',  # Uganda
    '804': 'UA',  # Ukraine
    '807': 'MK',  # North Macedonia
    '818': 'EG',  # Egypt
    '826': 'GB',  # United Kingdom
    '834': 'TZ',  # Tanzania
    '849': 'VI',  # US Virgin Islands
    '850': 'VI',  # US Virgin Islands (variant)
    '854': 'BF',  # Burkina Faso
    '858': 'UY',  # Uruguay
    '860': 'UZ',  # Uzbekistan
    '862': 'VE',  # Venezuela
    '876': 'WF',  # Wallis and Futuna
    '882': 'WS',  # Samoa
    '887': 'YE',  # Yemen
    '894': 'ZM',  # Zambia
    '895': 'XX',  # Areas NES (Not Elsewhere Specified)
    '918': 'EU',  # European Union (ITC custom code)
    '842': 'US',  # United States (ITC variant)
}

# ISO3 폴더 이름 -> M49 코드 (검증용)
ISO3_TO_M49 = {
    'ARE': '784', 'ARG': '032', 'AUS': '036', 'BGD': '050', 'BHR': '048',
    'BRA': '076', 'CAN': '124', 'CHE': '757', 'CHL': '152', 'CHN': '156',
    'COL': '170', 'CRI': '188', 'DOM': '214', 'DZA': '012', 'ECU': '218',
    'EGY': '818', 'EUR': '918', 'GBR': '826', 'GHA': '288', 'HKG': '344',
    'IDN': '360', 'IND': '699', 'ISR': '376', 'JOR': '400', 'JPN': '392',
    'KAZ': '398', 'KEN': '404', 'KOR': '410', 'KWT': '414', 'LKA': '144',
    'MAR': '504', 'MEX': '484', 'MYS': '458', 'NGA': '566', 'NOR': '579',
    'NZL': '554', 'OMN': '512', 'PAK': '586', 'PER': '604', 'PHL': '608',
    'PRY': '600', 'QAT': '634', 'RUS': '643', 'SAU': '682', 'SGP': '702',
    'THA': '764', 'TUN': '788', 'TUR': '792', 'TWN': '490', 'UKR': '804',
    'URY': '858', 'USA': '842', 'VNM': '704',
}


# ==============================================================================
# 유틸리티 함수들
# ==============================================================================

def log(msg):
    """타임스탬프와 함께 로그 메시지 출력."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {msg}")


def parse_db_url(db_url):
    """
    PostgreSQL 연결 URL을 파싱하여 psycopg2 연결 파라미터로 변환.

    예: postgresql://user:password@host:5432/database
    """
    parsed = urlparse(db_url)

    if parsed.scheme not in ('postgresql', 'postgres'):
        raise ValueError(f"지원하지 않는 스킴: {parsed.scheme}")

    return {
        'host': parsed.hostname or 'localhost',
        'port': parsed.port or 5432,
        'database': parsed.path.lstrip('/') or 'postgres',
        'user': parsed.username or 'postgres',
        'password': parsed.password or '',
    }


def detect_encoding(filepath):
    """
    파일의 인코딩을 감지합니다.
    utf-8, latin-1 순서로 시도합니다.
    """
    # 시도할 인코딩 목록
    for encoding in ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']:
        try:
            with open(filepath, 'r', encoding=encoding, errors='replace') as f:
                f.read(4096)  # 처음 4KB만 읽어보기
            return encoding
        except Exception:
            continue

    log(f"경고: {filepath}의 인코딩을 감지할 수 없음. utf-8 사용")
    return 'utf-8'


def find_min_files(data_dir, country_iso3=None):
    """
    data_dir 내에서 MIN 파일들을 찾습니다.
    파일명 패턴: *_tariff_*_mfn.txt 또는 MAcMap-*_MFN.txt
    """
    files = []

    # 모든 국가 또는 특정 국가만 확인
    if country_iso3:
        country_dirs = [os.path.join(data_dir, country_iso3)]
    else:
        country_dirs = [os.path.join(data_dir, d) for d in os.listdir(data_dir)
                        if os.path.isdir(os.path.join(data_dir, d))]

    for country_dir in country_dirs:
        if not os.path.isdir(country_dir):
            continue

        # MIN 파일을 찾습니다
        for fname in os.listdir(country_dir):
            if ('_mfn' in fname.lower() or '_tariff_mfn' in fname.lower()) and fname.endswith('.txt'):
                if '_desc' not in fname:  # 설명 파일 제외
                    files.append(os.path.join(country_dir, fname))

    return sorted(files)


def find_agr_files(data_dir, country_iso3=None):
    """
    data_dir 내에서 AGR 파일들을 찾습니다.
    파일명 패턴: *_tariff_*_agr.txt 또는 MAcMap-*_AGR.txt
    """
    files = []

    # 모든 국가 또는 특정 국가만 확인
    if country_iso3:
        country_dirs = [os.path.join(data_dir, country_iso3)]
    else:
        country_dirs = [os.path.join(data_dir, d) for d in os.listdir(data_dir)
                        if os.path.isdir(os.path.join(data_dir, d))]

    for country_dir in country_dirs:
        if not os.path.isdir(country_dir):
            continue

        # AGR 파일을 찾습니다
        for fname in os.listdir(country_dir):
            if ('_agr' in fname.lower() or '_tariff_agr' in fname.lower()) and fname.endswith('.txt'):
                if '_desc' not in fname:  # 설명 파일 제외
                    files.append(os.path.join(country_dir, fname))

    return sorted(files)


def read_data_file(filepath, expected_columns):
    """
    탭 구분 데이터 파일을 읽습니다.

    Args:
        filepath: 읽을 파일의 경로
        expected_columns: 예상되는 열 이름 리스트

    Returns:
        (행 리스트, 실제 열 이름) 또는 에러 시 (None, None)
    """
    encoding = detect_encoding(filepath)

    try:
        rows = []
        with open(filepath, 'r', encoding=encoding, errors='replace') as f:
            reader = csv.DictReader(f, delimiter='\t')

            if reader.fieldnames is None:
                log(f"경고: {filepath}의 헤더를 읽을 수 없음")
                return None, None

            # 예상 열이 있는지 검증
            missing = set(expected_columns) - set(reader.fieldnames)
            if missing:
                log(f"경고: {filepath}에서 열을 찾을 수 없음: {missing}")
                log(f"  실제 열: {list(reader.fieldnames)}")

            for row in reader:
                rows.append(row)

        return rows, reader.fieldnames

    except Exception as e:
        log(f"오류: {filepath} 읽기 실패 - {e}")
        return None, None


# ==============================================================================
# MIN 데이터 처리
# ==============================================================================

def process_min_data(rows, country_iso3, conn):
    """
    MIN 파일 데이터를 처리하고 COPY 를 사용하여 데이터베이스에 삽입합니다.

    MIN 파일 형식 (탭 구분):
    Revision	ReportingCountry	Year	ProductCode	PartnerCountry	AvDuty	Source

    대상 테이블 컬럼:
    reporter_iso2, product_code, partner_iso2, av_duty, data_year
    """
    if not rows:
        return 0

    # 첫 번째 행에서 보고국 M49 코드를 가져옵니다
    m49_code = rows[0].get('ReportingCountry', '').strip()
    reporter_iso2 = M49_TO_ISO2.get(m49_code)

    if not reporter_iso2:
        log(f"경고: {country_iso3}의 M49 코드 '{m49_code}'를 ISO2로 변환할 수 없음")
        return 0

    # 임시 테이블 생성
    temp_table_name = f"temp_min_rates_{int(time.time() * 1000) % 1000000}"

    try:
        with conn.cursor() as cur:
            # 임시 테이블 생성 (constraints 없음)
            cur.execute(sql.SQL("""
                CREATE TEMP TABLE {} (
                    reporter_iso2 TEXT,
                    product_code TEXT,
                    partner_iso2 TEXT,
                    av_duty NUMERIC,
                    data_year INTEGER
                )
            """).format(sql.Identifier(temp_table_name)))

            # 데이터를 StringIO 버퍼에 준비합니다 (배치 처리)
            batch_size = 50000
            total_rows = 0

            for batch_start in range(0, len(rows), batch_size):
                batch_end = min(batch_start + batch_size, len(rows))
                batch = rows[batch_start:batch_end]

                # 탭 구분 값 형식의 데이터 준비
                buffer = StringIO()
                writer = csv.writer(buffer, delimiter='\t')

                for row in batch:
                    product_code = row.get('ProductCode', '').strip()
                    partner_m49 = row.get('PartnerCountry', '').strip()
                    partner_iso2 = M49_TO_ISO2.get(partner_m49, 'XX')  # 기본값: XX
                    av_duty = row.get('AvDuty', '0').strip()
                    data_year = row.get('Year', '0').strip()

                    # 필수 필드 검증
                    if not product_code or not data_year.isdigit():
                        continue

                    try:
                        av_duty_num = float(av_duty) if av_duty else 0.0
                    except ValueError:
                        av_duty_num = 0.0

                    writer.writerow([
                        reporter_iso2,
                        product_code,
                        partner_iso2,
                        av_duty_num,
                        int(data_year)
                    ])

                # 임시 테이블에 COPY
                buffer.seek(0)
                cur.copy_from(buffer, temp_table_name, columns=[
                    'reporter_iso2', 'product_code', 'partner_iso2', 'av_duty', 'data_year'
                ])

                total_rows += len(batch)
                log(f"  MIN {country_iso3}: {total_rows:,} 행 처리 중...")

            # 메인 테이블에 INSERT (중복 무시)
            cur.execute(sql.SQL("""
                INSERT INTO macmap_min_rates
                (reporter_iso2, product_code, partner_iso2, av_duty, data_year)
                SELECT reporter_iso2, product_code, partner_iso2, av_duty, data_year
                FROM {}
                ON CONFLICT DO NOTHING
            """).format(sql.Identifier(temp_table_name)))

            conn.commit()

            return total_rows

    except Exception as e:
        log(f"오류: MIN 데이터 INSERT 실패 ({country_iso3}) - {e}")
        conn.rollback()
        return 0


# ==============================================================================
# AGR 데이터 처리
# ==============================================================================

def process_agr_data(rows, country_iso3, conn):
    """
    AGR 파일 데이터를 처리하고 COPY 를 사용하여 데이터베이스에 삽입합니다.

    AGR 파일 형식 (탭 구분):
    Revision	ReportingCountry	Year	ProductCode	Agreement_id	PartnerCountry	Nav_flag	AvDuty	NavDuty	Source

    대상 테이블 컬럼:
    reporter_iso2, product_code, agreement_id, partner_iso2, nav_flag, av_duty, nav_duty, data_year
    """
    if not rows:
        return 0

    # 첫 번째 행에서 보고국 M49 코드를 가져옵니다
    m49_code = rows[0].get('ReportingCountry', '').strip()
    reporter_iso2 = M49_TO_ISO2.get(m49_code)

    if not reporter_iso2:
        log(f"경고: {country_iso3}의 M49 코드 '{m49_code}'를 ISO2로 변환할 수 없음")
        return 0

    # 임시 테이블 생성
    temp_table_name = f"temp_agr_rates_{int(time.time() * 1000) % 1000000}"

    try:
        with conn.cursor() as cur:
            # 임시 테이블 생성 (constraints 없음)
            cur.execute(sql.SQL("""
                CREATE TEMP TABLE {} (
                    reporter_iso2 TEXT,
                    product_code TEXT,
                    agreement_id TEXT,
                    partner_iso2 TEXT,
                    nav_flag INTEGER,
                    av_duty NUMERIC,
                    nav_duty TEXT,
                    data_year INTEGER
                )
            """).format(sql.Identifier(temp_table_name)))

            # 데이터를 StringIO 버퍼에 준비합니다 (배치 처리)
            batch_size = 50000
            total_rows = 0

            for batch_start in range(0, len(rows), batch_size):
                batch_end = min(batch_start + batch_size, len(rows))
                batch = rows[batch_start:batch_end]

                # 탭 구분 값 형식의 데이터 준비
                buffer = StringIO()
                writer = csv.writer(buffer, delimiter='\t')

                for row in batch:
                    product_code = row.get('ProductCode', '').strip()
                    agreement_id = row.get('Agreement_id', '').strip()
                    partner_m49 = row.get('PartnerCountry', '').strip()
                    partner_iso2 = M49_TO_ISO2.get(partner_m49, 'XX')  # 기본값: XX
                    nav_flag = row.get('Nav_flag', '0').strip()
                    av_duty = row.get('AvDuty', '0').strip()
                    nav_duty = row.get('NavDuty', '').strip()
                    data_year = row.get('Year', '0').strip()

                    # 필수 필드 검증
                    if not product_code or not data_year.isdigit():
                        continue

                    try:
                        av_duty_num = float(av_duty) if av_duty else 0.0
                    except ValueError:
                        av_duty_num = 0.0

                    try:
                        nav_flag_int = int(nav_flag) if nav_flag else 0
                    except ValueError:
                        nav_flag_int = 0

                    writer.writerow([
                        reporter_iso2,
                        product_code,
                        agreement_id,
                        partner_iso2,
                        nav_flag_int,
                        av_duty_num,
                        nav_duty,
                        int(data_year)
                    ])

                # 임시 테이블에 COPY
                buffer.seek(0)
                cur.copy_from(buffer, temp_table_name, columns=[
                    'reporter_iso2', 'product_code', 'agreement_id', 'partner_iso2',
                    'nav_flag', 'av_duty', 'nav_duty', 'data_year'
                ])

                total_rows += len(batch)
                log(f"  AGR {country_iso3}: {total_rows:,} 행 처리 중...")

            # 메인 테이블에 INSERT (중복 무시)
            cur.execute(sql.SQL("""
                INSERT INTO macmap_agr_rates
                (reporter_iso2, product_code, agreement_id, partner_iso2, nav_flag, av_duty, nav_duty, data_year)
                SELECT reporter_iso2, product_code, agreement_id, partner_iso2, nav_flag, av_duty, nav_duty, data_year
                FROM {}
                ON CONFLICT DO NOTHING
            """).format(sql.Identifier(temp_table_name)))

            conn.commit()

            return total_rows

    except Exception as e:
        log(f"오류: AGR 데이터 INSERT 실패 ({country_iso3}) - {e}")
        conn.rollback()
        return 0


# ==============================================================================
# 테이블 생성
# ==============================================================================

def create_tables_if_needed(conn):
    """필요한 테이블이 없으면 생성합니다."""
    try:
        with conn.cursor() as cur:
            # MIN 테이블
            cur.execute("""
                CREATE TABLE IF NOT EXISTS macmap_min_rates (
                    id BIGSERIAL PRIMARY KEY,
                    reporter_iso2 TEXT NOT NULL,
                    product_code TEXT NOT NULL,
                    partner_iso2 TEXT NOT NULL,
                    av_duty NUMERIC(8,6) DEFAULT 0,
                    data_year INTEGER NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(reporter_iso2, product_code, partner_iso2, data_year)
                )
            """)
            log("테이블 생성: macmap_min_rates (또는 이미 존재)")

            # AGR 테이블
            cur.execute("""
                CREATE TABLE IF NOT EXISTS macmap_agr_rates (
                    id BIGSERIAL PRIMARY KEY,
                    reporter_iso2 TEXT NOT NULL,
                    product_code TEXT NOT NULL,
                    agreement_id TEXT NOT NULL,
                    partner_iso2 TEXT NOT NULL,
                    nav_flag INTEGER DEFAULT 0,
                    av_duty NUMERIC(8,6) DEFAULT 0,
                    nav_duty TEXT,
                    data_year INTEGER NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(reporter_iso2, product_code, agreement_id, partner_iso2, data_year)
                )
            """)
            log("테이블 생성: macmap_agr_rates (또는 이미 존재)")

            # 인덱스 생성
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_min_rates_reporter ON macmap_min_rates(reporter_iso2)
            """)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_min_rates_partner ON macmap_min_rates(partner_iso2)
            """)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_agr_rates_reporter ON macmap_agr_rates(reporter_iso2)
            """)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_agr_rates_partner ON macmap_agr_rates(partner_iso2)
            """)

            conn.commit()
            log("인덱스 생성 완료")

    except Exception as e:
        log(f"오류: 테이블 생성 실패 - {e}")
        conn.rollback()
        raise


# ==============================================================================
# 메인 함수
# ==============================================================================

def main():
    """메인 임포트 루틴."""
    parser = argparse.ArgumentParser(
        description='MacMap MIN/AGR 데이터를 Supabase PostgreSQL에 대량 임포트합니다.'
    )
    parser.add_argument(
        '--db-url',
        required=True,
        help='PostgreSQL 연결 URL (예: postgresql://user:password@host:5432/database)'
    )
    parser.add_argument(
        '--data-dir',
        required=True,
        help='by_country 폴더의 경로'
    )
    parser.add_argument(
        '--type',
        choices=['min', 'agr', 'both'],
        default='both',
        help='임포트할 데이터 타입 (기본값: both)'
    )
    parser.add_argument(
        '--country',
        default=None,
        help='특정 국가만 임포트 (ISO3 코드, 예: KOR)'
    )

    args = parser.parse_args()

    # 입력 검증
    if not os.path.isdir(args.data_dir):
        log(f"오류: 데이터 디렉토리를 찾을 수 없음: {args.data_dir}")
        sys.exit(1)

    # 데이터베이스 연결
    try:
        db_params = parse_db_url(args.db_url)
        conn = psycopg2.connect(**db_params)
        log(f"데이터베이스 연결 성공: {db_params['host']}:{db_params['port']}/{db_params['database']}")
    except Exception as e:
        log(f"오류: 데이터베이스 연결 실패 - {e}")
        sys.exit(1)

    try:
        # 테이블 생성
        create_tables_if_needed(conn)

        # 처리할 국가 목록 결정
        if args.country:
            countries_to_process = [args.country]
        else:
            countries_to_process = sorted([
                d for d in os.listdir(args.data_dir)
                if os.path.isdir(os.path.join(args.data_dir, d))
            ])

        log(f"처리할 국가: {len(countries_to_process)}개")

        # 통계
        stats = defaultdict(lambda: {'min': 0, 'agr': 0})
        total_start_time = time.time()

        # 각 국가별 파일 처리
        for idx, country_iso3 in enumerate(countries_to_process, 1):
            log(f"\n[{idx}/{len(countries_to_process)}] {country_iso3} 처리 중...")

            country_start_time = time.time()

            # MIN 데이터 처리
            if args.type in ['min', 'both']:
                min_files = find_min_files(args.data_dir, country_iso3)
                for min_file in min_files:
                    log(f"  MIN 파일: {os.path.basename(min_file)}")
                    rows, cols = read_data_file(min_file, ['ReportingCountry', 'ProductCode', 'PartnerCountry', 'AvDuty', 'Year'])
                    if rows:
                        rows_inserted = process_min_data(rows, country_iso3, conn)
                        stats[country_iso3]['min'] += rows_inserted
                        log(f"    MIN 임포트 완료: {rows_inserted:,} 행")

            # AGR 데이터 처리
            if args.type in ['agr', 'both']:
                agr_files = find_agr_files(args.data_dir, country_iso3)
                for agr_file in agr_files:
                    log(f"  AGR 파일: {os.path.basename(agr_file)}")
                    rows, cols = read_data_file(agr_file, [
                        'ReportingCountry', 'ProductCode', 'Agreement_id',
                        'PartnerCountry', 'Nav_flag', 'AvDuty', 'NavDuty', 'Year'
                    ])
                    if rows:
                        rows_inserted = process_agr_data(rows, country_iso3, conn)
                        stats[country_iso3]['agr'] += rows_inserted
                        log(f"    AGR 임포트 완료: {rows_inserted:,} 행")

            elapsed = time.time() - country_start_time
            total_min = stats[country_iso3]['min']
            total_agr = stats[country_iso3]['agr']

            log(f"  {country_iso3} 완료: {total_min + total_agr:,} 행, {elapsed:.1f}초")

            if total_min + total_agr > 0:
                rate = (total_min + total_agr) / elapsed
                log(f"    속도: {rate:.0f} 행/초")

        # 최종 통계 출력
        total_elapsed = time.time() - total_start_time

        log("\n" + "=" * 70)
        log("임포트 완료 요약")
        log("=" * 70)

        total_min_rows = 0
        total_agr_rows = 0

        for country_iso3 in sorted(countries_to_process):
            min_rows = stats[country_iso3]['min']
            agr_rows = stats[country_iso3]['agr']
            total_min_rows += min_rows
            total_agr_rows += agr_rows

            if min_rows > 0 or agr_rows > 0:
                log(f"{country_iso3:>5}: MIN {min_rows:>10,} | AGR {agr_rows:>10,}")

        log("-" * 70)
        log(f"{'합계':>5}: MIN {total_min_rows:>10,} | AGR {total_agr_rows:>10,}")
        log(f"\n총 시간: {total_elapsed:.1f}초")
        log(f"총 행 수: {total_min_rows + total_agr_rows:,}")

        if total_elapsed > 0:
            overall_rate = (total_min_rows + total_agr_rows) / total_elapsed
            log(f"평균 속도: {overall_rate:.0f} 행/초")

        log("=" * 70)

    except KeyboardInterrupt:
        log("\n사용자 중단")
        sys.exit(1)

    except Exception as e:
        log(f"오류: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    finally:
        if conn:
            conn.close()
            log("데이터베이스 연결 종료")


if __name__ == '__main__':
    main()
