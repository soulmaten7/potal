#!/usr/bin/env python3
"""
MacMap 대량 데이터 가져오기 스크립트
Supabase PostgreSQL에 MIN/AGR 파일을 빠르게 가져옵니다.

사용법:
  pip install psycopg2-binary
  python import_macmap_bulk.py --db-url "postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres" --type both
  python import_macmap_bulk.py --db-url "..." --type min --country USA
  python import_macmap_bulk.py --db-url "..." --type agr
"""

import os
import glob
import argparse
import sys
import time
import csv
from io import StringIO
from pathlib import Path
from datetime import datetime

# psycopg2를 사용하여 PostgreSQL에 연결합니다.
try:
    import psycopg2
    from psycopg2 import sql
except ImportError:
    print("오류: psycopg2가 설치되지 않았습니다.")
    print("설치: pip install psycopg2-binary")
    sys.exit(1)

# ========================================================================
# M49 → ISO2 국가 코드 매핑 (직접 내장)
# ========================================================================
# 이 사전은 MacMap 데이터의 M49 숫자 코드를 ISO 2글자 코드로 변환합니다.
M49_TO_ISO2_FULL = {
    '004': 'AF',  # 아프가니스탄
    '008': 'AL',  # 알바니아
    '012': 'DZ',  # 알제리
    '016': 'AS',  # 미국령 사모아
    '020': 'AD',  # 안도라
    '024': 'AO',  # 앙골라
    '028': 'AG',  # 앤티가 바부다
    '031': 'AZ',  # 아제르바이잔
    '032': 'AR',  # 아르헨티나
    '036': 'AU',  # 호주
    '040': 'AT',  # 오스트리아
    '044': 'BS',  # 바하마
    '048': 'BH',  # 바레인
    '050': 'BD',  # 방글라데시
    '051': 'AM',  # 아르메니아
    '052': 'BB',  # 바베이도스
    '056': 'BE',  # 벨기에
    '060': 'BM',  # 버뮤다
    '064': 'BT',  # 부탄
    '068': 'BO',  # 볼리비아
    '070': 'BA',  # 보스니아 헤르체고비나
    '072': 'BW',  # 보츠와나
    '074': 'BV',  # 부베 섬
    '076': 'BR',  # 브라질
    '084': 'BZ',  # 벨리즈
    '086': 'IO',  # 영국령 인도양 영토
    '090': 'SB',  # 솔로몬 제도
    '092': 'VG',  # 영국령 버진아일랜드
    '096': 'BN',  # 브루나이
    '100': 'BG',  # 불가리아
    '104': 'MM',  # 미얀마
    '108': 'BI',  # 부룬디
    '112': 'BY',  # 벨라루스
    '116': 'KH',  # 캄보디아
    '120': 'CM',  # 카메룬
    '124': 'CA',  # 캐나다
    '132': 'CV',  # 카보베르데
    '136': 'KY',  # 케이맨 제도
    '140': 'CF',  # 중앙아프리카 공화국
    '144': 'LK',  # 스리랑카
    '148': 'TD',  # 차드
    '152': 'CL',  # 칠레
    '156': 'CN',  # 중국
    '162': 'CX',  # 크리스마스섬
    '166': 'CC',  # 코코스 제도
    '170': 'CO',  # 콜롬비아
    '174': 'KM',  # 코모로
    '175': 'YT',  # 마요트
    '178': 'CG',  # 콩고 (공화국)
    '180': 'CD',  # 콩고 (민주공화국)
    '184': 'CK',  # 쿡 제도
    '188': 'CR',  # 코스타리카
    '191': 'HR',  # 크로아티아
    '192': 'CU',  # 쿠바
    '196': 'CY',  # 키프로스
    '203': 'CZ',  # 체코
    '204': 'BJ',  # 베냉
    '208': 'DK',  # 덴마크
    '212': 'DM',  # 도미니카
    '214': 'DO',  # 도미니카 공화국
    '218': 'EC',  # 에콰도르
    '222': 'SV',  # 엘살바도르
    '226': 'GQ',  # 적도기니
    '231': 'ET',  # 에티오피아
    '232': 'ER',  # 에리트레아
    '233': 'EE',  # 에스토니아
    '234': 'FO',  # 페로 제도
    '238': 'FK',  # 포클랜드 제도
    '239': 'GS',  # 사우스조지아
    '242': 'FJ',  # 피지
    '246': 'FI',  # 핀란드
    '251': 'FR',  # 프랑스
    '254': 'GF',  # 프랑스령 기아나
    '258': 'PF',  # 프랑스령 폴리네시아
    '260': 'TF',  # 프랑스령 남부 지역
    '262': 'DJ',  # 지부티
    '266': 'GA',  # 가봉
    '268': 'GE',  # 조지아
    '270': 'GM',  # 감비아
    '275': 'PS',  # 팔레스타인
    '276': 'DE',  # 독일
    '288': 'GH',  # 가나
    '292': 'GI',  # 지브롤터
    '296': 'KI',  # 키리바시
    '300': 'GR',  # 그리스
    '304': 'GL',  # 그린란드
    '308': 'GD',  # 그레나다
    '316': 'GU',  # 괌
    '320': 'GT',  # 과테말라
    '324': 'GN',  # 기니
    '328': 'GY',  # 가이아나
    '332': 'HT',  # 아이티
    '334': 'HM',  # 허드 섬
    '340': 'HN',  # 온두라스
    '344': 'HK',  # 홍콩
    '348': 'HU',  # 헝가리
    '352': 'IS',  # 아이슬란드
    '356': 'IN',  # 인도 (표준 M49)
    '360': 'ID',  # 인도네시아
    '364': 'IR',  # 이란
    '368': 'IQ',  # 이라크
    '372': 'IE',  # 아일랜드
    '376': 'IL',  # 이스라엘
    '381': 'IT',  # 이탈리아 (ITC 코드)
    '384': 'CI',  # 코트디부아르
    '388': 'JM',  # 자메이카
    '392': 'JP',  # 일본
    '398': 'KZ',  # 카자흐스탄
    '400': 'JO',  # 요르단
    '404': 'KE',  # 케냐
    '408': 'KP',  # 북한
    '410': 'KR',  # 남한
    '414': 'KW',  # 쿠웨이트
    '417': 'KG',  # 키르기스스탄
    '418': 'LA',  # 라오스
    '422': 'LB',  # 레바논
    '426': 'LS',  # 레소토
    '428': 'LV',  # 라트비아
    '430': 'LR',  # 라이베리아
    '434': 'LY',  # 리비아
    '438': 'LI',  # 리히텐슈타인
    '440': 'LT',  # 리투아니아
    '442': 'LU',  # 룩셈부르크
    '446': 'MO',  # 마카오
    '450': 'MG',  # 마다가스카르
    '454': 'MW',  # 말라위
    '458': 'MY',  # 말레이시아
    '462': 'MV',  # 몰디브
    '466': 'ML',  # 말리
    '470': 'MT',  # 몰타
    '478': 'MR',  # 모리타니
    '480': 'MU',  # 모리셔스
    '484': 'MX',  # 멕시코
    '488': 'MN',  # 몽골 (ITC 변형)
    '490': 'TW',  # 대만 (ITC 코드)
    '496': 'MN',  # 몽골 (표준 M49)
    '498': 'MD',  # 몰도바
    '499': 'ME',  # 몬테네그로
    '500': 'MS',  # 몬트세랫
    '504': 'MA',  # 모로코
    '508': 'MZ',  # 모잠비크
    '512': 'OM',  # 오만
    '516': 'NA',  # 나미비아
    '520': 'NR',  # 나우루
    '524': 'NP',  # 네팔
    '528': 'NL',  # 네덜란드
    '530': 'AN',  # 네덜란드령 앤틸리스 (구식)
    '533': 'AW',  # 아루바
    '540': 'NC',  # 뉴칼레도니아
    '548': 'VU',  # 바누아투
    '554': 'NZ',  # 뉴질랜드
    '558': 'NI',  # 니카라과
    '562': 'NE',  # 니제르
    '566': 'NG',  # 나이지리아
    '570': 'NU',  # 니우에
    '574': 'NF',  # 노퍼크섬
    '579': 'NO',  # 노르웨이
    '580': 'MP',  # 북마리아나 제도
    '582': 'FM',  # 미크로네시아 (ITC 변형)
    '583': 'FM',  # 미크로네시아
    '584': 'MH',  # 마셜 제도
    '585': 'PW',  # 팔라우
    '586': 'PK',  # 파키스탄
    '591': 'PA',  # 파나마
    '598': 'PG',  # 파푸아뉴기니
    '600': 'PY',  # 파라과이
    '604': 'PE',  # 페루
    '608': 'PH',  # 필리핀
    '612': 'PN',  # 핏케언 제도
    '616': 'PL',  # 폴란드
    '620': 'PT',  # 포르투갈
    '624': 'GW',  # 기니비사우
    '626': 'TL',  # 동티모르
    '630': 'PR',  # 푸에르토리코
    '634': 'QA',  # 카타르
    '642': 'RO',  # 루마니아
    '643': 'RU',  # 러시아
    '646': 'RW',  # 르완다
    '654': 'SH',  # 세인트헬레나
    '659': 'KN',  # 세인트키츠네비스
    '660': 'AI',  # 앙귈라
    '662': 'LC',  # 세인트루시아
    '666': 'PM',  # 생피에르 미켈롱
    '670': 'VC',  # 세인트빈센트
    '674': 'SM',  # 산마리노
    '678': 'ST',  # 상투메프린시페
    '682': 'SA',  # 사우디아라비아
    '686': 'SN',  # 세네갈
    '688': 'RS',  # 세르비아
    '690': 'SC',  # 세이셸
    '694': 'SL',  # 시에라리온
    '699': 'IN',  # 인도 (ITC 커스텀 코드)
    '702': 'SG',  # 싱가포르
    '703': 'SK',  # 슬로바키아
    '704': 'VN',  # 베트남
    '705': 'SI',  # 슬로베니아
    '706': 'SO',  # 소말리아
    '710': 'ZA',  # 남아프리카
    '716': 'ZW',  # 짐바브웨
    '724': 'ES',  # 스페인
    '728': 'SS',  # 남수단
    '732': 'EH',  # 서사하라
    '736': 'SD',  # 수단
    '740': 'SR',  # 수리남
    '744': 'SJ',  # 스발바르
    '748': 'SZ',  # 에스와티니
    '752': 'SE',  # 스웨덴
    '757': 'CH',  # 스위스 (ITC 코드)
    '760': 'SY',  # 시리아
    '762': 'TJ',  # 타지키스탄
    '764': 'TH',  # 태국
    '768': 'TG',  # 토고
    '772': 'TK',  # 토켈라우
    '776': 'TO',  # 통가
    '780': 'TT',  # 트리니다드토바고
    '784': 'AE',  # 아랍에미리트
    '788': 'TN',  # 튀니지
    '792': 'TR',  # 터키
    '795': 'TM',  # 투르크메니스탄
    '796': 'TC',  # 터크스케이코스
    '798': 'TV',  # 투발루
    '800': 'UG',  # 우간다
    '804': 'UA',  # 우크라이나
    '807': 'MK',  # 북마케도니아
    '818': 'EG',  # 이집트
    '826': 'GB',  # 영국
    '834': 'TZ',  # 탄자니아
    '849': 'VI',  # 미국령 버진아일랜드
    '850': 'VI',  # 미국령 버진아일랜드 (변형)
    '854': 'BF',  # 부르키나파소
    '858': 'UY',  # 우루과이
    '860': 'UZ',  # 우즈베키스탄
    '862': 'VE',  # 베네수엘라
    '876': 'WF',  # 월리스푸투나
    '882': 'WS',  # 사모아
    '887': 'YE',  # 예멘
    '894': 'ZM',  # 잠비아
    '895': 'XX',  # 기타 미분류
    '918': 'EU',  # 유럽연합 (ITC 커스텀 코드)
    '842': 'US',  # 미국 (ITC 변형)
}

# ISO3 폴더 이름 → M49 코드 매핑 (폴더 확인용)
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

# ========================================================================
# 도우미 함수들
# ========================================================================

def convert_m49_to_iso2(m49_code):
    """
    M49 숫자 코드를 ISO2 코드로 변환합니다.
    예: '842' → 'US'
    """
    if not m49_code:
        return None
    m49_str = str(m49_code).strip()
    return M49_TO_ISO2_FULL.get(m49_str, None)


def try_open_file(filepath):
    """
    파일을 여러 인코딩으로 시도해서 엽니다.
    인코딩 순서: utf-8 → latin-1 → cp1252
    """
    for encoding in ['utf-8', 'latin-1', 'cp1252']:
        try:
            return open(filepath, 'r', encoding=encoding, errors='replace')
        except Exception:
            continue
    raise IOError(f"파일을 열 수 없습니다: {filepath}")


def find_latest_files(country_dir, file_type):
    """
    국가 디렉토리에서 최신 MIN 또는 AGR 파일을 찾습니다.
    file_type: 'min' 또는 'agr'

    반환: (최신 데이터 파일 경로, 최신 설명 파일 경로)
    """
    pattern_suffix = '_mfn.txt' if file_type == 'min' else f'_{file_type}.txt'
    pattern = os.path.join(country_dir, f'*{pattern_suffix}')

    files = glob.glob(pattern)
    # _desc 파일 제외
    files = [f for f in files if '_desc' not in f and '_tr' not in f]

    if not files:
        return None, None

    # 파일명에서 연도를 추출하여 최신 버전을 찾습니다
    def extract_year(filepath):
        basename = os.path.basename(filepath)
        parts = basename.split('_')
        for p in parts:
            if p.isdigit() and len(p) == 4:
                return int(p)
        return 0

    files.sort(key=extract_year, reverse=True)
    latest_file = files[0]

    # 설명 파일 찾기
    desc_file = latest_file.replace(pattern_suffix, f'{pattern_suffix[:-4]}_desc.txt')
    if not os.path.exists(desc_file):
        desc_file = None

    return latest_file, desc_file


def get_country_name(iso3):
    """
    ISO3 코드를 보기 좋은 이름으로 변환합니다.
    (실제로는 ISO3를 그대로 사용하고, M49가 있으면 표시)
    """
    m49 = ISO3_TO_M49.get(iso3, '?')
    return f"{iso3} (M49: {m49})"


def parse_data_row(row, file_type, reporting_m49):
    """
    한 행의 데이터를 파싱하여 정규화된 행으로 변환합니다.

    MIN 파일 열: Revision, ReportingCountry, Year, ProductCode, PartnerCountry, AvDuty, Source
    AGR 파일 열: Revision, ReportingCountry, Year, ProductCode, Agreement_id, PartnerCountry, Nav_flag, AvDuty, NavDuty, Source

    반환: (정규화된 행) 또는 None (건너뜨린 경우)
    """
    try:
        # 필수 필드
        revision = row.get('Revision', '').strip()
        reporting_country = row.get('ReportingCountry', '').strip()
        year = row.get('Year', '').strip()
        product_code = row.get('ProductCode', '').strip()
        partner_country = row.get('PartnerCountry', '').strip()
        source = row.get('Source', 'Market Access Map').strip()

        # 필드 검증
        if not product_code or not year:
            return None

        # M49을 ISO2로 변환
        reporting_iso2 = convert_m49_to_iso2(reporting_m49)
        partner_iso2 = convert_m49_to_iso2(partner_country)

        if not reporting_iso2 or not partner_iso2:
            return None

        # 기본 행
        normalized_row = {
            'revision': revision,
            'reporting_country': reporting_iso2,
            'year': year,
            'product_code': product_code,
            'partner_country': partner_iso2,
            'source': source,
        }

        # AGR 전용 필드
        if file_type == 'agr':
            agreement_id = row.get('Agreement_id', '').strip()
            nav_flag = row.get('Nav_flag', '0').strip()
            av_duty = row.get('AvDuty', '0').strip()
            nav_duty = row.get('NavDuty', '').strip()

            normalized_row.update({
                'agreement_id': agreement_id,
                'nav_flag': nav_flag,
                'av_duty': av_duty,
                'nav_duty': nav_duty,
            })
        # MIN 전용 필드
        else:
            av_duty = row.get('AvDuty', '0').strip()
            normalized_row['av_duty'] = av_duty

        return normalized_row

    except Exception as e:
        print(f"  경고: 행 파싱 오류: {e}")
        return None


def format_min_insert_values(rows):
    """
    MIN 행들을 INSERT를 위한 VALUES 문자열로 포매팅합니다.

    형식: (revision, reporting_country, year, product_code, partner_country, av_duty, source)
    """
    csv_buffer = StringIO()
    writer = csv.writer(csv_buffer, delimiter='\t')

    for row in rows:
        # COPY 형식에 맞게 작성
        writer.writerow([
            row['revision'],
            row['reporting_country'],
            row['year'],
            row['product_code'],
            row['partner_country'],
            row['av_duty'],
            row['source'],
        ])

    return csv_buffer.getvalue()


def format_agr_insert_values(rows):
    """
    AGR 행들을 INSERT를 위한 VALUES 문자열로 포매팅합니다.

    형식: (revision, reporting_country, year, product_code, agreement_id, partner_country, nav_flag, av_duty, nav_duty, source)
    """
    csv_buffer = StringIO()
    writer = csv.writer(csv_buffer, delimiter='\t')

    for row in rows:
        # COPY 형식에 맞게 작성
        writer.writerow([
            row['revision'],
            row['reporting_country'],
            row['year'],
            row['product_code'],
            row['agreement_id'],
            row['partner_country'],
            row['nav_flag'],
            row['av_duty'],
            row['nav_duty'],
            row['source'],
        ])

    return csv_buffer.getvalue()


def bulk_insert_min_copy(conn, rows, batch_size=10000):
    """
    MIN 데이터를 PostgreSQL COPY 명령어로 빠르게 가져옵니다.
    """
    cur = conn.cursor()

    try:
        # 배치 단위로 처리
        for i in range(0, len(rows), batch_size):
            batch = rows[i:i+batch_size]

            # TSV 형식으로 포매팅
            csv_data = format_min_insert_values(batch)

            # COPY 명령어 사용 (매우 빠름)
            cur.copy_expert(
                """
                COPY macmap_min_rates
                (revision, reporting_country, year, product_code, partner_country, av_duty, source)
                FROM STDIN
                WITH (FORMAT csv, DELIMITER E'\t', NULL '')
                """,
                StringIO(csv_data)
            )
            conn.commit()

        cur.close()
        return len(rows)

    except Exception as e:
        conn.rollback()
        cur.close()
        raise e


def bulk_insert_agr_copy(conn, rows, batch_size=10000):
    """
    AGR 데이터를 PostgreSQL COPY 명령어로 빠르게 가져옵니다.
    """
    cur = conn.cursor()

    try:
        # 배치 단위로 처리
        for i in range(0, len(rows), batch_size):
            batch = rows[i:i+batch_size]

            # TSV 형식으로 포매팅
            csv_data = format_agr_insert_values(batch)

            # COPY 명령어 사용 (매우 빠름)
            cur.copy_expert(
                """
                COPY macmap_agr_rates
                (revision, reporting_country, year, product_code, agreement_id, partner_country, nav_flag, av_duty, nav_duty, source)
                FROM STDIN
                WITH (FORMAT csv, DELIMITER E'\t', NULL '')
                """,
                StringIO(csv_data)
            )
            conn.commit()

        cur.close()
        return len(rows)

    except Exception as e:
        conn.rollback()
        cur.close()
        raise e


def bulk_insert_min_fallback(conn, rows, batch_size=10000):
    """
    COPY가 실패한 경우 일반 INSERT를 사용합니다 (느림).
    """
    cur = conn.cursor()
    rows_inserted = 0

    try:
        for i in range(0, len(rows), batch_size):
            batch = rows[i:i+batch_size]

            # 값 문자열 생성
            values = []
            for row in batch:
                # NULL 처리
                av_duty = row['av_duty'] if row['av_duty'] else '0'

                values.append(
                    f"('{row['revision']}', '{row['reporting_country']}', {row['year']}, "
                    f"'{row['product_code']}', '{row['partner_country']}', {av_duty}, '{row['source']}')"
                )

            query = sql.SQL(
                "INSERT INTO macmap_min_rates "
                "(revision, reporting_country, year, product_code, partner_country, av_duty, source) "
                "VALUES " + ", ".join(values) +
                " ON CONFLICT (reporting_country, year, product_code, partner_country) "
                "DO UPDATE SET av_duty = EXCLUDED.av_duty"
            )

            cur.execute(query)
            conn.commit()
            rows_inserted += len(batch)

        cur.close()
        return rows_inserted

    except Exception as e:
        conn.rollback()
        cur.close()
        raise e


def bulk_insert_agr_fallback(conn, rows, batch_size=10000):
    """
    COPY가 실패한 경우 일반 INSERT를 사용합니다 (느림).
    """
    cur = conn.cursor()
    rows_inserted = 0

    try:
        for i in range(0, len(rows), batch_size):
            batch = rows[i:i+batch_size]

            # 값 문자열 생성
            values = []
            for row in batch:
                # NULL 처리
                av_duty = row['av_duty'] if row['av_duty'] else '0'

                values.append(
                    f"('{row['revision']}', '{row['reporting_country']}', {row['year']}, "
                    f"'{row['product_code']}', '{row['agreement_id']}', "
                    f"'{row['partner_country']}', {row['nav_flag']}, {av_duty}, "
                    f"'{row['nav_duty']}', '{row['source']}')"
                )

            query = sql.SQL(
                "INSERT INTO macmap_agr_rates "
                "(revision, reporting_country, year, product_code, agreement_id, partner_country, "
                "nav_flag, av_duty, nav_duty, source) "
                "VALUES " + ", ".join(values) +
                " ON CONFLICT (reporting_country, year, product_code, agreement_id, partner_country) "
                "DO UPDATE SET av_duty = EXCLUDED.av_duty"
            )

            cur.execute(query)
            conn.commit()
            rows_inserted += len(batch)

        cur.close()
        return rows_inserted

    except Exception as e:
        conn.rollback()
        cur.close()
        raise e


def process_country(conn, country_iso3, file_type, data_dir):
    """
    한 국가의 데이터를 처리하고 가져옵니다.

    반환: (성공 여부, 처리된 행 수, 소요 시간)
    """
    country_dir = os.path.join(data_dir, country_iso3)

    if not os.path.isdir(country_dir):
        return False, 0, 0

    # 파일 찾기
    if file_type == 'min':
        data_file, desc_file = find_latest_files(country_dir, 'mfn')
    elif file_type == 'agr':
        data_file, desc_file = find_latest_files(country_dir, 'agr')
    else:
        return False, 0, 0

    if not data_file:
        return False, 0, 0

    # M49 코드 확인
    reporting_m49 = ISO3_TO_M49.get(country_iso3)
    if not reporting_m49:
        print(f"  경고: {country_iso3}의 M49 코드를 알 수 없습니다")
        return False, 0, 0

    start_time = time.time()

    try:
        # 파일 읽기 및 파싱
        rows = []

        with try_open_file(data_file) as f:
            reader = csv.DictReader(f, delimiter='\t')
            row_num = 0

            for raw_row in reader:
                row_num += 1

                # 행 정규화
                parsed_row = parse_data_row(raw_row, file_type, reporting_m49)
                if parsed_row:
                    rows.append(parsed_row)

        if not rows:
            return False, 0, 0

        # 데이터 가져오기 (COPY 시도)
        try:
            if file_type == 'min':
                rows_inserted = bulk_insert_min_copy(conn, rows)
            else:
                rows_inserted = bulk_insert_agr_copy(conn, rows)

        except Exception as copy_error:
            # COPY 실패 시 일반 INSERT로 재시도
            print(f"    COPY 실패, INSERT로 재시도: {copy_error}")

            if file_type == 'min':
                rows_inserted = bulk_insert_min_fallback(conn, rows)
            else:
                rows_inserted = bulk_insert_agr_fallback(conn, rows)

        elapsed = time.time() - start_time

        return True, rows_inserted, elapsed

    except Exception as e:
        print(f"  오류: {e}")
        elapsed = time.time() - start_time
        return False, 0, elapsed


def main():
    # 명령행 인수 파싱
    parser = argparse.ArgumentParser(
        description='MacMap MIN/AGR 데이터를 Supabase PostgreSQL에 대량 가져오기',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
예제:
  python import_macmap_bulk.py --db-url "postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres" --type both
  python import_macmap_bulk.py --db-url "..." --type min --country USA
  python import_macmap_bulk.py --db-url "..." --type agr
"""
    )

    parser.add_argument(
        '--db-url',
        required=True,
        help='PostgreSQL 연결 문자열 (예: postgresql://user:pass@host:5432/db)'
    )
    parser.add_argument(
        '--type',
        required=True,
        choices=['min', 'agr', 'both'],
        help='가져올 파일 타입 (min: 최혜국, agr: 협정 특혜율, both: 둘 다)'
    )
    parser.add_argument(
        '--country',
        default=None,
        help='특정 국가만 처리 (ISO3 코드, 예: USA, CHN). 생략하면 모든 국가 처리'
    )

    args = parser.parse_args()

    # 데이터 디렉토리
    data_dir = '/sessions/quirky-bold-thompson/mnt/portal/data/itc_macmap/by_country'

    print("=" * 70)
    print("MacMap 대량 가져오기 시작")
    print("=" * 70)
    print(f"시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"타입: {args.type}")
    if args.country:
        print(f"국가: {args.country}")
    print()

    # PostgreSQL 연결
    try:
        conn = psycopg2.connect(args.db_url)
        print("✓ Supabase PostgreSQL 연결 성공")
    except Exception as e:
        print(f"✗ 연결 오류: {e}")
        sys.exit(1)

    # 처리할 타입 결정
    file_types = []
    if args.type == 'min':
        file_types = ['min']
    elif args.type == 'agr':
        file_types = ['agr']
    else:
        file_types = ['min', 'agr']

    # 처리할 국가 목록
    if args.country:
        countries = [args.country.upper()]
    else:
        countries = sorted([d for d in os.listdir(data_dir)
                          if os.path.isdir(os.path.join(data_dir, d)) and d in ISO3_TO_M49])

    # 통계
    total_start = time.time()
    stats = {
        'min': {'success': 0, 'failed': 0, 'rows': 0, 'time': 0},
        'agr': {'success': 0, 'failed': 0, 'rows': 0, 'time': 0},
    }

    # 각 국가 처리
    for file_type in file_types:
        print(f"\n{'='*70}")
        print(f"타입: {file_type.upper()} - 처리 중...")
        print(f"{'='*70}")

        for country_iso3 in countries:
            country_name = get_country_name(country_iso3)

            success, rows_inserted, elapsed = process_country(
                conn, country_iso3, file_type, data_dir
            )

            if success:
                speed = rows_inserted / elapsed if elapsed > 0 else 0
                print(f"✓ {country_name:20s} | {rows_inserted:>10,} 행 | "
                      f"{elapsed:>6.2f}초 | {speed:>10,.0f} 행/초")

                stats[file_type]['success'] += 1
                stats[file_type]['rows'] += rows_inserted
                stats[file_type]['time'] += elapsed
            else:
                print(f"✗ {country_name:20s} | 건너뜀")
                stats[file_type]['failed'] += 1

    # 연결 종료
    conn.close()

    # 최종 요약
    total_elapsed = time.time() - total_start
    total_rows = stats['min']['rows'] + stats['agr']['rows']

    print(f"\n{'='*70}")
    print("최종 요약")
    print(f"{'='*70}")

    if 'min' in file_types:
        print(f"MIN (최혜국):")
        print(f"  성공: {stats['min']['success']:>3} 국가")
        print(f"  실패: {stats['min']['failed']:>3} 국가")
        print(f"  행:   {stats['min']['rows']:>15,}")
        print(f"  시간: {stats['min']['time']:>10.2f}초")

    if 'agr' in file_types:
        print(f"AGR (협정 특혜율):")
        print(f"  성공: {stats['agr']['success']:>3} 국가")
        print(f"  실패: {stats['agr']['failed']:>3} 국가")
        print(f"  행:   {stats['agr']['rows']:>15,}")
        print(f"  시간: {stats['agr']['time']:>10.2f}초")

    print(f"\n총 합계:")
    print(f"  전체 행: {total_rows:>15,}")
    print(f"  전체 시간: {total_elapsed:>10.2f}초")

    if total_elapsed > 0:
        overall_speed = total_rows / total_elapsed
        print(f"  처리 속도: {overall_speed:>10,.0f} 행/초")

    print(f"\n완료: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == '__main__':
    main()
