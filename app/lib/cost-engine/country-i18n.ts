/**
 * POTAL — Multi-language Country Names
 *
 * Provides country names in 7 languages:
 * - en: English (default, from country-data.ts)
 * - ko: Korean (한국어)
 * - ja: Japanese (日本語)
 * - zh: Chinese Simplified (简体中文)
 * - es: Spanish (Español)
 * - fr: French (Français)
 * - de: German (Deutsch)
 *
 * Usage:
 *   getCountryName('US', 'ko') → '미국'
 *   getCountryName('JP', 'zh') → '日本'
 *   getSupportedLanguages() → ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de']
 */

export type SupportedLanguage = 'en' | 'ko' | 'ja' | 'zh' | 'es' | 'fr' | 'de';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de'];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語',
  zh: '简体中文',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
};

/**
 * Country names by language. Only non-English translations are stored here.
 * English names come from country-data.ts (the `name` field).
 */
const COUNTRY_NAMES: Record<string, Partial<Record<SupportedLanguage, string>>> = {
  // ═══ NORTH AMERICA ═══
  US: { ko: '미국', ja: 'アメリカ合衆国', zh: '美国', es: 'Estados Unidos', fr: 'États-Unis', de: 'Vereinigte Staaten' },
  CA: { ko: '캐나다', ja: 'カナダ', zh: '加拿大', es: 'Canadá', fr: 'Canada', de: 'Kanada' },
  MX: { ko: '멕시코', ja: 'メキシコ', zh: '墨西哥', es: 'México', fr: 'Mexique', de: 'Mexiko' },

  // ═══ EUROPE ═══
  GB: { ko: '영국', ja: 'イギリス', zh: '英国', es: 'Reino Unido', fr: 'Royaume-Uni', de: 'Vereinigtes Königreich' },
  DE: { ko: '독일', ja: 'ドイツ', zh: '德国', es: 'Alemania', fr: 'Allemagne', de: 'Deutschland' },
  FR: { ko: '프랑스', ja: 'フランス', zh: '法国', es: 'Francia', fr: 'France', de: 'Frankreich' },
  IT: { ko: '이탈리아', ja: 'イタリア', zh: '意大利', es: 'Italia', fr: 'Italie', de: 'Italien' },
  ES: { ko: '스페인', ja: 'スペイン', zh: '西班牙', es: 'España', fr: 'Espagne', de: 'Spanien' },
  NL: { ko: '네덜란드', ja: 'オランダ', zh: '荷兰', es: 'Países Bajos', fr: 'Pays-Bas', de: 'Niederlande' },
  BE: { ko: '벨기에', ja: 'ベルギー', zh: '比利时', es: 'Bélgica', fr: 'Belgique', de: 'Belgien' },
  AT: { ko: '오스트리아', ja: 'オーストリア', zh: '奥地利', es: 'Austria', fr: 'Autriche', de: 'Österreich' },
  SE: { ko: '스웨덴', ja: 'スウェーデン', zh: '瑞典', es: 'Suecia', fr: 'Suède', de: 'Schweden' },
  DK: { ko: '덴마크', ja: 'デンマーク', zh: '丹麦', es: 'Dinamarca', fr: 'Danemark', de: 'Dänemark' },
  FI: { ko: '핀란드', ja: 'フィンランド', zh: '芬兰', es: 'Finlandia', fr: 'Finlande', de: 'Finnland' },
  NO: { ko: '노르웨이', ja: 'ノルウェー', zh: '挪威', es: 'Noruega', fr: 'Norvège', de: 'Norwegen' },
  CH: { ko: '스위스', ja: 'スイス', zh: '瑞士', es: 'Suiza', fr: 'Suisse', de: 'Schweiz' },
  PL: { ko: '폴란드', ja: 'ポーランド', zh: '波兰', es: 'Polonia', fr: 'Pologne', de: 'Polen' },
  IE: { ko: '아일랜드', ja: 'アイルランド', zh: '爱尔兰', es: 'Irlanda', fr: 'Irlande', de: 'Irland' },
  PT: { ko: '포르투갈', ja: 'ポルトガル', zh: '葡萄牙', es: 'Portugal', fr: 'Portugal', de: 'Portugal' },
  GR: { ko: '그리스', ja: 'ギリシャ', zh: '希腊', es: 'Grecia', fr: 'Grèce', de: 'Griechenland' },
  CZ: { ko: '체코', ja: 'チェコ', zh: '捷克', es: 'República Checa', fr: 'Tchéquie', de: 'Tschechien' },
  RO: { ko: '루마니아', ja: 'ルーマニア', zh: '罗马尼亚', es: 'Rumanía', fr: 'Roumanie', de: 'Rumänien' },
  HU: { ko: '헝가리', ja: 'ハンガリー', zh: '匈牙利', es: 'Hungría', fr: 'Hongrie', de: 'Ungarn' },
  BG: { ko: '불가리아', ja: 'ブルガリア', zh: '保加利亚', es: 'Bulgaria', fr: 'Bulgarie', de: 'Bulgarien' },
  HR: { ko: '크로아티아', ja: 'クロアチア', zh: '克罗地亚', es: 'Croacia', fr: 'Croatie', de: 'Kroatien' },
  SK: { ko: '슬로바키아', ja: 'スロバキア', zh: '斯洛伐克', es: 'Eslovaquia', fr: 'Slovaquie', de: 'Slowakei' },
  SI: { ko: '슬로베니아', ja: 'スロベニア', zh: '斯洛文尼亚', es: 'Eslovenia', fr: 'Slovénie', de: 'Slowenien' },
  LT: { ko: '리투아니아', ja: 'リトアニア', zh: '立陶宛', es: 'Lituania', fr: 'Lituanie', de: 'Litauen' },
  LV: { ko: '라트비아', ja: 'ラトビア', zh: '拉脱维亚', es: 'Letonia', fr: 'Lettonie', de: 'Lettland' },
  EE: { ko: '에스토니아', ja: 'エストニア', zh: '爱沙尼亚', es: 'Estonia', fr: 'Estonie', de: 'Estland' },
  CY: { ko: '키프로스', ja: 'キプロス', zh: '塞浦路斯', es: 'Chipre', fr: 'Chypre', de: 'Zypern' },
  MT: { ko: '몰타', ja: 'マルタ', zh: '马耳他', es: 'Malta', fr: 'Malte', de: 'Malta' },
  LU: { ko: '룩셈부르크', ja: 'ルクセンブルク', zh: '卢森堡', es: 'Luxemburgo', fr: 'Luxembourg', de: 'Luxemburg' },
  IS: { ko: '아이슬란드', ja: 'アイスランド', zh: '冰岛', es: 'Islandia', fr: 'Islande', de: 'Island' },
  RS: { ko: '세르비아', ja: 'セルビア', zh: '塞尔维亚', es: 'Serbia', fr: 'Serbie', de: 'Serbien' },
  UA: { ko: '우크라이나', ja: 'ウクライナ', zh: '乌克兰', es: 'Ucrania', fr: 'Ukraine', de: 'Ukraine' },
  BA: { ko: '보스니아', ja: 'ボスニア・ヘルツェゴビナ', zh: '波斯尼亚', es: 'Bosnia y Herzegovina', fr: 'Bosnie-Herzégovine', de: 'Bosnien und Herzegowina' },
  ME: { ko: '몬테네그로', ja: 'モンテネグロ', zh: '黑山', es: 'Montenegro', fr: 'Monténégro', de: 'Montenegro' },
  MK: { ko: '북마케도니아', ja: '北マケドニア', zh: '北马其顿', es: 'Macedonia del Norte', fr: 'Macédoine du Nord', de: 'Nordmazedonien' },
  AL: { ko: '알바니아', ja: 'アルバニア', zh: '阿尔巴尼亚', es: 'Albania', fr: 'Albanie', de: 'Albanien' },
  GE: { ko: '조지아', ja: 'ジョージア', zh: '格鲁吉亚', es: 'Georgia', fr: 'Géorgie', de: 'Georgien' },
  MD: { ko: '몰도바', ja: 'モルドバ', zh: '摩尔多瓦', es: 'Moldavia', fr: 'Moldavie', de: 'Moldau' },
  BY: { ko: '벨라루스', ja: 'ベラルーシ', zh: '白俄罗斯', es: 'Bielorrusia', fr: 'Biélorussie', de: 'Belarus' },
  AM: { ko: '아르메니아', ja: 'アルメニア', zh: '亚美尼亚', es: 'Armenia', fr: 'Arménie', de: 'Armenien' },
  AZ: { ko: '아제르바이잔', ja: 'アゼルバイジャン', zh: '阿塞拜疆', es: 'Azerbaiyán', fr: 'Azerbaïdjan', de: 'Aserbaidschan' },
  LI: { ko: '리히텐슈타인', ja: 'リヒテンシュタイン', zh: '列支敦士登', es: 'Liechtenstein', fr: 'Liechtenstein', de: 'Liechtenstein' },
  MC: { ko: '모나코', ja: 'モナコ', zh: '摩纳哥', es: 'Mónaco', fr: 'Monaco', de: 'Monaco' },
  AD: { ko: '안도라', ja: 'アンドラ', zh: '安道尔', es: 'Andorra', fr: 'Andorre', de: 'Andorra' },
  SM: { ko: '산마리노', ja: 'サンマリノ', zh: '圣马力诺', es: 'San Marino', fr: 'Saint-Marin', de: 'San Marino' },
  XK: { ko: '코소보', ja: 'コソボ', zh: '科索沃', es: 'Kosovo', fr: 'Kosovo', de: 'Kosovo' },

  // ═══ AMERICAS ═══
  EC: { ko: '에콰도르', ja: 'エクアドル', zh: '厄瓜多尔', es: 'Ecuador', fr: 'Équateur', de: 'Ecuador' },
  VE: { ko: '베네수엘라', ja: 'ベネズエラ', zh: '委内瑞拉', es: 'Venezuela', fr: 'Venezuela', de: 'Venezuela' },
  BO: { ko: '볼리비아', ja: 'ボリビア', zh: '玻利维亚', es: 'Bolivia', fr: 'Bolivie', de: 'Bolivien' },
  PY: { ko: '파라과이', ja: 'パラグアイ', zh: '巴拉圭', es: 'Paraguay', fr: 'Paraguay', de: 'Paraguay' },
  UY: { ko: '우루과이', ja: 'ウルグアイ', zh: '乌拉圭', es: 'Uruguay', fr: 'Uruguay', de: 'Uruguay' },
  CR: { ko: '코스타리카', ja: 'コスタリカ', zh: '哥斯达黎加', es: 'Costa Rica', fr: 'Costa Rica', de: 'Costa Rica' },
  PA: { ko: '파나마', ja: 'パナマ', zh: '巴拿马', es: 'Panamá', fr: 'Panama', de: 'Panama' },
  GT: { ko: '과테말라', ja: 'グアテマラ', zh: '危地马拉', es: 'Guatemala', fr: 'Guatemala', de: 'Guatemala' },
  HN: { ko: '온두라스', ja: 'ホンジュラス', zh: '洪都拉斯', es: 'Honduras', fr: 'Honduras', de: 'Honduras' },
  SV: { ko: '엘살바도르', ja: 'エルサルバドル', zh: '萨尔瓦多', es: 'El Salvador', fr: 'El Salvador', de: 'El Salvador' },
  NI: { ko: '니카라과', ja: 'ニカラグア', zh: '尼加拉瓜', es: 'Nicaragua', fr: 'Nicaragua', de: 'Nicaragua' },
  DO: { ko: '도미니카공화국', ja: 'ドミニカ共和国', zh: '多米尼加', es: 'República Dominicana', fr: 'République dominicaine', de: 'Dominikanische Republik' },
  JM: { ko: '자메이카', ja: 'ジャマイカ', zh: '牙买加', es: 'Jamaica', fr: 'Jamaïque', de: 'Jamaika' },
  TT: { ko: '트리니다드토바고', ja: 'トリニダード・トバゴ', zh: '特立尼达和多巴哥', es: 'Trinidad y Tobago', fr: 'Trinité-et-Tobago', de: 'Trinidad und Tobago' },
  CU: { ko: '쿠바', ja: 'キューバ', zh: '古巴', es: 'Cuba', fr: 'Cuba', de: 'Kuba' },
  PR: { ko: '푸에르토리코', ja: 'プエルトリコ', zh: '波多黎各', es: 'Puerto Rico', fr: 'Porto Rico', de: 'Puerto Rico' },
  KW: { ko: '쿠웨이트', ja: 'クウェート', zh: '科威特', es: 'Kuwait', fr: 'Koweït', de: 'Kuwait' },
  JO: { ko: '요르단', ja: 'ヨルダン', zh: '约旦', es: 'Jordania', fr: 'Jordanie', de: 'Jordanien' },
  OM: { ko: '오만', ja: 'オマーン', zh: '阿曼', es: 'Omán', fr: 'Oman', de: 'Oman' },
  BH: { ko: '바레인', ja: 'バーレーン', zh: '巴林', es: 'Baréin', fr: 'Bahreïn', de: 'Bahrain' },
  IQ: { ko: '이라크', ja: 'イラク', zh: '伊拉克', es: 'Irak', fr: 'Irak', de: 'Irak' },
  IR: { ko: '이란', ja: 'イラン', zh: '伊朗', es: 'Irán', fr: 'Iran', de: 'Iran' },
  LB: { ko: '레바논', ja: 'レバノン', zh: '黎巴嫩', es: 'Líbano', fr: 'Liban', de: 'Libanon' },
  BR: { ko: '브라질', ja: 'ブラジル', zh: '巴西', es: 'Brasil', fr: 'Brésil', de: 'Brasilien' },
  CL: { ko: '칠레', ja: 'チリ', zh: '智利', es: 'Chile', fr: 'Chili', de: 'Chile' },
  CO: { ko: '콜롬비아', ja: 'コロンビア', zh: '哥伦比亚', es: 'Colombia', fr: 'Colombie', de: 'Kolumbien' },
  AR: { ko: '아르헨티나', ja: 'アルゼンチン', zh: '阿根廷', es: 'Argentina', fr: 'Argentine', de: 'Argentinien' },
  PE: { ko: '페루', ja: 'ペルー', zh: '秘鲁', es: 'Perú', fr: 'Pérou', de: 'Peru' },
  HT: { ko: '아이티', ja: 'ハイチ', zh: '海地', es: 'Haití', fr: 'Haïti', de: 'Haiti' },
  BS: { ko: '바하마', ja: 'バハマ', zh: '巴哈马', es: 'Bahamas', fr: 'Bahamas', de: 'Bahamas' },
  BB: { ko: '바베이도스', ja: 'バルバドス', zh: '巴巴多斯', es: 'Barbados', fr: 'Barbade', de: 'Barbados' },
  BZ: { ko: '벨리즈', ja: 'ベリーズ', zh: '伯利兹', es: 'Belice', fr: 'Belize', de: 'Belize' },
  GY: { ko: '가이아나', ja: 'ガイアナ', zh: '圭亚那', es: 'Guyana', fr: 'Guyana', de: 'Guyana' },
  SR: { ko: '수리남', ja: 'スリナム', zh: '苏里南', es: 'Surinam', fr: 'Suriname', de: 'Surinam' },
  AG: { ko: '앤티가바부다', ja: 'アンティグア・バーブーダ', zh: '安提瓜和巴布达', es: 'Antigua y Barbuda', fr: 'Antigua-et-Barbuda', de: 'Antigua und Barbuda' },
  DM: { ko: '도미니카', ja: 'ドミニカ国', zh: '多米尼克', es: 'Dominica', fr: 'Dominique', de: 'Dominica' },
  GD: { ko: '그레나다', ja: 'グレナダ', zh: '格林纳达', es: 'Granada', fr: 'Grenade', de: 'Grenada' },
  KN: { ko: '세인트키츠네비스', ja: 'セントキッツ・ネイビス', zh: '圣基茨和尼维斯', es: 'San Cristóbal y Nieves', fr: 'Saint-Christophe-et-Niévès', de: 'St. Kitts und Nevis' },
  LC: { ko: '세인트루시아', ja: 'セントルシア', zh: '圣露西亚', es: 'Santa Lucía', fr: 'Sainte-Lucie', de: 'St. Lucia' },
  VC: { ko: '세인트빈센트그레나딘', ja: 'セントビンセント・グレナディーン', zh: '圣文森特和格林纳丁斯', es: 'San Vicente y las Granadinas', fr: 'Saint-Vincent-et-les-Grenadines', de: 'St. Vincent und die Grenadinen' },
  TC: { ko: '터크스케이커스', ja: 'タークス・カイコス諸島', zh: '特克斯和凯科斯群岛', es: 'Islas Turcas y Caicos', fr: 'Îles Turques-et-Caïques', de: 'Turks- und Caicosinseln' },
  AI: { ko: '앙귈라', ja: 'アンギラ', zh: '安圭拉', es: 'Anguila', fr: 'Anguilla', de: 'Anguilla' },
  MS: { ko: '몬세라트', ja: 'モントセラト', zh: '蒙特塞拉特', es: 'Montserrat', fr: 'Montserrat', de: 'Montserrat' },
  SX: { ko: '신트마르턴', ja: 'シント・マールテン', zh: '圣马丁', es: 'Sint Maarten', fr: 'Saint-Martin', de: 'Sint Maarten' },
  VI: { ko: '미국령버진아일랜드', ja: 'アメリカ領バージン諸島', zh: '美属维尔京群岛', es: 'Islas Vírgenes de EE.UU.', fr: 'Îles Vierges des États-Unis', de: 'Amerikanische Jungferninseln' },
  FK: { ko: '포클랜드제도', ja: 'フォークランド諸島', zh: '福克兰群岛', es: 'Islas Malvinas', fr: 'Îles Malouines', de: 'Falklandinseln' },
  GL: { ko: '그린란드', ja: 'グリーンランド', zh: '格陵兰', es: 'Groenlandia', fr: 'Groenland', de: 'Grönland' },
  GF: { ko: '프랑스령기아나', ja: '仏領ギアナ', zh: '法属圭亚那', es: 'Guayana Francesa', fr: 'Guyane française', de: 'Französisch-Guayana' },
  GP: { ko: '과달루프', ja: 'グアドループ', zh: '瓜德罗普', es: 'Guadalupe', fr: 'Guadeloupe', de: 'Guadeloupe' },
  MQ: { ko: '마르티니크', ja: 'マルティニーク', zh: '马提尼克', es: 'Martinica', fr: 'Martinique', de: 'Martinique' },
  PM: { ko: '생피에르미클롱', ja: 'サンピエール・ミクロン', zh: '圣皮埃尔和密克隆群岛', es: 'San Pedro y Miquelón', fr: 'Saint-Pierre-et-Miquelon', de: 'St. Pierre und Miquelon' },
  BQ: { ko: '보네르신트외스타티우스사바', ja: 'ボネール、シント・ユーステイシャス島、サバ島', zh: '博内尔、圣尤斯特歇斯和萨巴', es: 'Bonaire, Sint Eustatius y Saba', fr: 'Bonaire, Sint Eustatius et Saba', de: 'Bonaire, Sint Eustatius und Saba' },
  MF: { ko: '생마르탱', ja: 'サン・マルタン', zh: '圣马丁', es: 'Saint Martin', fr: 'Saint-Martin', de: 'Saint-Martin' },
  BL: { ko: '생바르텔레미', ja: 'サン・バルテルミー', zh: '圣巴泰勒米', es: 'San Bartolomé', fr: 'Saint-Barthélemy', de: 'Saint-Barthélemy' },
  CW: { ko: '퀴라소', ja: 'キュラソー', zh: '库拉索', es: 'Curazao', fr: 'Curaçao', de: 'Curaçao' },
  AW: { ko: '아루바', ja: 'アルバ', zh: '阿鲁巴', es: 'Aruba', fr: 'Aruba', de: 'Aruba' },
  KY: { ko: '케이맨제도', ja: 'ケイマン諸島', zh: '开曼群岛', es: 'Islas Caimán', fr: 'Îles Caïmans', de: 'Kaimaninseln' },
  BM: { ko: '버뮤다', ja: 'バミューダ', zh: '百慕大', es: 'Bermuda', fr: 'Bermudes', de: 'Bermuda' },
  VG: { ko: '영국령버진아일랜드', ja: 'イギリス領バージン諸島', zh: '英属维尔京群岛', es: 'Islas Vírgenes Británicas', fr: 'Îles Vierges britanniques', de: 'Britische Jungferninseln' },
  FO: { ko: '페로제도', ja: 'フェロー諸島', zh: '法罗群岛', es: 'Islas Feroe', fr: 'Îles Féroé', de: 'Färöer' },
  GI: { ko: '지브롤터', ja: 'ジブラルタル', zh: '直布罗陀', es: 'Gibraltar', fr: 'Gibraltar', de: 'Gibraltar' },
  GG: { ko: '건지', ja: 'ガーンジー', zh: '根西岛', es: 'Guernsey', fr: 'Guernesey', de: 'Guernsey' },
  JE: { ko: '저지', ja: 'ジャージー', zh: '泽西岛', es: 'Jersey', fr: 'Jersey', de: 'Jersey' },
  IM: { ko: '맨섬', ja: 'マン島', zh: '曼岛', es: 'Isla de Man', fr: 'Île de Man', de: 'Insel Man' },
  AX: { ko: '올란드제도', ja: 'オーランド諸島', zh: '奥兰群岛', es: 'Islas Åland', fr: 'Îles Åland', de: 'Åland' },
  SJ: { ko: '스발바르얀마옌', ja: 'スヴァーバル諸島・ヤンマイエン島', zh: '斯瓦尔巴和扬马延', es: 'Svalbard y Jan Mayen', fr: 'Svalbard et Jan Mayen', de: 'Spitzbergen und Jan Mayen' },
  CV: { ko: '카보베르데', ja: 'カーボベルデ', zh: '佛得角', es: 'Cabo Verde', fr: 'Cap-Vert', de: 'Kap Verde' },
  GM: { ko: '감비아', ja: 'ガンビア', zh: '冈比亚', es: 'Gambia', fr: 'Gambie', de: 'Gambia' },
  GW: { ko: '기니비소', ja: 'ギニアビサウ', zh: '几内亚比绍', es: 'Guinea-Bisáu', fr: 'Guinée-Bissau', de: 'Guinea-Bissau' },
  CF: { ko: '중앙아프리카공화국', ja: '中央アフリカ', zh: '中非共和国', es: 'República Centroafricana', fr: 'République centrafricaine', de: 'Zentralafrikanische Republik' },
  BI: { ko: '부룬디', ja: 'ブルンジ', zh: '布隆迪', es: 'Burundi', fr: 'Burundi', de: 'Burundi' },
  KM: { ko: '코모로', ja: 'コモロ', zh: '科摩罗', es: 'Comoras', fr: 'Comores', de: 'Komoren' },
  ST: { ko: '상투메프린시페', ja: 'サントメ・プリンシペ', zh: '圣多美和普林西比', es: 'Santo Tomé y Príncipe', fr: 'Sao Tomé-et-Principe', de: 'São Tomé und Príncipe' },
  GQ: { ko: '적도기니', ja: '赤道ギニア', zh: '赤道几内亚', es: 'Guinea Ecuatorial', fr: 'Guinée équatoriale', de: 'Äquatorialguinea' },
  RE: { ko: '레위니옹', ja: 'レユニオン', zh: '留尼汪', es: 'Reunión', fr: 'Réunion', de: 'Réunion' },
  YT: { ko: '마요트', ja: 'マヨット', zh: '马约特', es: 'Mayota', fr: 'Mayotte', de: 'Mayotte' },
  SH: { ko: '세인트헬레나', ja: 'セントヘレナ', zh: '圣赫勒拿', es: 'Santa Elena', fr: 'Sainte-Hélène', de: 'St. Helena' },

  // ═══ ASIA-PACIFIC ═══
  JP: { ko: '일본', ja: '日本', zh: '日本', es: 'Japón', fr: 'Japon', de: 'Japan' },
  KR: { ko: '한국', ja: '韓国', zh: '韩国', es: 'Corea del Sur', fr: 'Corée du Sud', de: 'Südkorea' },
  CN: { ko: '중국', ja: '中国', zh: '中国', es: 'China', fr: 'Chine', de: 'China' },
  HK: { ko: '홍콩', ja: '香港', zh: '香港', es: 'Hong Kong', fr: 'Hong Kong', de: 'Hongkong' },
  TW: { ko: '대만', ja: '台湾', zh: '台湾', es: 'Taiwán', fr: 'Taïwan', de: 'Taiwan' },
  MO: { ko: '마카오', ja: 'マカオ', zh: '澳门', es: 'Macao', fr: 'Macao', de: 'Macau' },
  SG: { ko: '싱가포르', ja: 'シンガポール', zh: '新加坡', es: 'Singapur', fr: 'Singapour', de: 'Singapur' },
  AU: { ko: '호주', ja: 'オーストラリア', zh: '澳大利亚', es: 'Australia', fr: 'Australie', de: 'Australien' },
  NZ: { ko: '뉴질랜드', ja: 'ニュージーランド', zh: '新西兰', es: 'Nueva Zelanda', fr: 'Nouvelle-Zélande', de: 'Neuseeland' },
  IN: { ko: '인도', ja: 'インド', zh: '印度', es: 'India', fr: 'Inde', de: 'Indien' },
  TH: { ko: '태국', ja: 'タイ', zh: '泰国', es: 'Tailandia', fr: 'Thaïlande', de: 'Thailand' },
  VN: { ko: '베트남', ja: 'ベトナム', zh: '越南', es: 'Vietnam', fr: 'Viêt Nam', de: 'Vietnam' },
  MY: { ko: '말레이시아', ja: 'マレーシア', zh: '马来西亚', es: 'Malasia', fr: 'Malaisie', de: 'Malaysia' },
  PH: { ko: '필리핀', ja: 'フィリピン', zh: '菲律宾', es: 'Filipinas', fr: 'Philippines', de: 'Philippinen' },
  ID: { ko: '인도네시아', ja: 'インドネシア', zh: '印度尼西亚', es: 'Indonesia', fr: 'Indonésie', de: 'Indonesien' },
  PK: { ko: '파키스탄', ja: 'パキスタン', zh: '巴基斯坦', es: 'Pakistán', fr: 'Pakistan', de: 'Pakistan' },
  BD: { ko: '방글라데시', ja: 'バングラデシュ', zh: '孟加拉国', es: 'Bangladés', fr: 'Bangladesh', de: 'Bangladesch' },
  LK: { ko: '스리랑카', ja: 'スリランカ', zh: '斯里兰卡', es: 'Sri Lanka', fr: 'Sri Lanka', de: 'Sri Lanka' },
  MM: { ko: '미얀마', ja: 'ミャンマー', zh: '缅甸', es: 'Myanmar', fr: 'Myanmar', de: 'Myanmar' },
  KH: { ko: '캄보디아', ja: 'カンボジア', zh: '柬埔寨', es: 'Camboya', fr: 'Cambodge', de: 'Kambodscha' },
  LA: { ko: '라오스', ja: 'ラオス', zh: '老挝', es: 'Laos', fr: 'Laos', de: 'Laos' },
  NP: { ko: '네팔', ja: 'ネパール', zh: '尼泊尔', es: 'Nepal', fr: 'Népal', de: 'Nepal' },
  BN: { ko: '브루나이', ja: 'ブルネイ', zh: '文莱', es: 'Brunéi', fr: 'Brunei', de: 'Brunei' },
  MN: { ko: '몽골', ja: 'モンゴル', zh: '蒙古', es: 'Mongolia', fr: 'Mongolie', de: 'Mongolei' },
  AF: { ko: '아프가니스탄', ja: 'アフガニスタン', zh: '阿富汗', es: 'Afganistán', fr: 'Afghanistan', de: 'Afghanistan' },
  KZ: { ko: '카자흐스탄', ja: 'カザフスタン', zh: '哈萨克斯坦', es: 'Kazajistán', fr: 'Kazakhstan', de: 'Kasachstan' },
  UZ: { ko: '우즈베키스탄', ja: 'ウズベキスタン', zh: '乌兹别克斯坦', es: 'Uzbekistán', fr: 'Ouzbékistan', de: 'Usbekistan' },
  KG: { ko: '키르기스스탄', ja: 'キルギス', zh: '吉尔吉斯斯坦', es: 'Kirguistán', fr: 'Kirghizistan', de: 'Kirgisistan' },
  TJ: { ko: '타지키스탄', ja: 'タジキスタン', zh: '塔吉克斯坦', es: 'Tayikistán', fr: 'Tadjikistan', de: 'Tadschikistan' },
  TM: { ko: '투르크메니스탄', ja: 'トルクメニスタン', zh: '土库曼斯坦', es: 'Turkmenistán', fr: 'Turkménistan', de: 'Turkmenistan' },
  BT: { ko: '부탄', ja: 'ブータン', zh: '不丹', es: 'Bután', fr: 'Bhoutan', de: 'Bhutan' },
  TL: { ko: '동티모르', ja: '東ティモール', zh: '东帝汶', es: 'Timor Oriental', fr: 'Timor oriental', de: 'Osttimor' },
  MV: { ko: '몰디브', ja: 'モルディブ', zh: '马尔代夫', es: 'Maldivas', fr: 'Maldives', de: 'Malediven' },
  AE: { ko: '아랍에미리트', ja: 'アラブ首長国連邦', zh: '阿联酋', es: 'Emiratos Árabes Unidos', fr: 'Émirats arabes unis', de: 'Vereinigte Arabische Emirate' },
  SA: { ko: '사우디아라비아', ja: 'サウジアラビア', zh: '沙特阿拉伯', es: 'Arabia Saudita', fr: 'Arabie saoudite', de: 'Saudi-Arabien' },
  IL: { ko: '이스라엘', ja: 'イスラエル', zh: '以色列', es: 'Israel', fr: 'Israël', de: 'Israel' },
  TR: { ko: '튀르키예', ja: 'トルコ', zh: '土耳其', es: 'Turquía', fr: 'Turquie', de: 'Türkei' },
  QA: { ko: '카타르', ja: 'カタール', zh: '卡塔尔', es: 'Catar', fr: 'Qatar', de: 'Katar' },
  YE: { ko: '예멘', ja: 'イエメン', zh: '也门', es: 'Yemen', fr: 'Yémen', de: 'Jemen' },
  SY: { ko: '시리아', ja: 'シリア', zh: '叙利亚', es: 'Siria', fr: 'Syrie', de: 'Syrien' },
  PS: { ko: '팔레스타인', ja: 'パレスチナ', zh: '巴勒斯坦', es: 'Palestina', fr: 'Palestine', de: 'Palästina' },

  // ═══ AFRICA ═══
  ZA: { ko: '남아프리카공화국', ja: '南アフリカ', zh: '南非', es: 'Sudáfrica', fr: 'Afrique du Sud', de: 'Südafrika' },
  NG: { ko: '나이지리아', ja: 'ナイジェリア', zh: '尼日利亚', es: 'Nigeria', fr: 'Nigéria', de: 'Nigeria' },
  EG: { ko: '이집트', ja: 'エジプト', zh: '埃及', es: 'Egipto', fr: 'Égypte', de: 'Ägypten' },
  KE: { ko: '케냐', ja: 'ケニア', zh: '肯尼亚', es: 'Kenia', fr: 'Kenya', de: 'Kenia' },
  MA: { ko: '모로코', ja: 'モロッコ', zh: '摩洛哥', es: 'Marruecos', fr: 'Maroc', de: 'Marokko' },
  TN: { ko: '튀니지', ja: 'チュニジア', zh: '突尼斯', es: 'Túnez', fr: 'Tunisie', de: 'Tunesien' },
  DZ: { ko: '알제리', ja: 'アルジェリア', zh: '阿尔及利亚', es: 'Argelia', fr: 'Algérie', de: 'Algerien' },
  LY: { ko: '리비아', ja: 'リビア', zh: '利比亚', es: 'Libia', fr: 'Libye', de: 'Libyen' },
  GH: { ko: '가나', ja: 'ガーナ', zh: '加纳', es: 'Ghana', fr: 'Ghana', de: 'Ghana' },
  CI: { ko: '코트디부아르', ja: 'コートジボワール', zh: '科特迪瓦', es: 'Costa de Marfil', fr: "Côte d'Ivoire", de: 'Elfenbeinküste' },
  SN: { ko: '세네갈', ja: 'セネガル', zh: '塞内加尔', es: 'Senegal', fr: 'Sénégal', de: 'Senegal' },
  CM: { ko: '카메룬', ja: 'カメルーン', zh: '喀麦隆', es: 'Camerún', fr: 'Cameroun', de: 'Kamerun' },
  TZ: { ko: '탄자니아', ja: 'タンザニア', zh: '坦桑尼亚', es: 'Tanzania', fr: 'Tanzanie', de: 'Tansania' },
  UG: { ko: '우간다', ja: 'ウガンダ', zh: '乌干达', es: 'Uganda', fr: 'Ouganda', de: 'Uganda' },
  ET: { ko: '에티오피아', ja: 'エチオピア', zh: '埃塞俄比亚', es: 'Etiopía', fr: 'Éthiopie', de: 'Äthiopien' },
  RW: { ko: '르완다', ja: 'ルワンダ', zh: '卢旺达', es: 'Ruanda', fr: 'Rwanda', de: 'Ruanda' },
  CD: { ko: '콩고민주공화국', ja: 'コンゴ民主共和国', zh: '刚果民主共和国', es: 'República Democrática del Congo', fr: 'République Démocratique du Congo', de: 'Demokratische Republik Kongo' },
  AO: { ko: '앙골라', ja: 'アンゴラ', zh: '安哥拉', es: 'Angola', fr: 'Angola', de: 'Angola' },
  MZ: { ko: '모잠비크', ja: 'モザンビーク', zh: '莫桑比克', es: 'Mozambique', fr: 'Mozambique', de: 'Mosambik' },
  MU: { ko: '모리셔스', ja: 'モーリシャス', zh: '毛里求斯', es: 'Mauricio', fr: 'Maurice', de: 'Mauritius' },
  MG: { ko: '마다가스카르', ja: 'マダガスカル', zh: '马达加斯加', es: 'Madagascar', fr: 'Madagascar', de: 'Madagaskar' },
  BW: { ko: '보츠와나', ja: 'ボツワナ', zh: '博茨瓦纳', es: 'Botsuana', fr: 'Botswana', de: 'Botswana' },
  ZW: { ko: '짐바브웨', ja: 'ジンバブエ', zh: '津巴布韦', es: 'Zimbabue', fr: 'Zimbabwe', de: 'Simbabwe' },
  NA: { ko: '나미비아', ja: 'ナミビア', zh: '纳米比亚', es: 'Namibia', fr: 'Namibie', de: 'Namibia' },
  SD: { ko: '수단', ja: 'スーダン', zh: '苏丹', es: 'Sudán', fr: 'Soudan', de: 'Sudan' },
  ZM: { ko: '잔비아', ja: 'ザンビア', zh: '赞比亚', es: 'Zambia', fr: 'Zambie', de: 'Sambia' },
  MW: { ko: '말라위', ja: 'マラウイ', zh: '马拉维', es: 'Malaui', fr: 'Malawi', de: 'Malawi' },
  BJ: { ko: '베냉', ja: 'ベナン', zh: '贝宁', es: 'Benín', fr: 'Bénin', de: 'Benin' },
  BF: { ko: '부르키나파소', ja: 'ブルキナファソ', zh: '布基纳法索', es: 'Burkina Faso', fr: 'Burkina Faso', de: 'Burkina Faso' },
  ML: { ko: '말리', ja: 'マリ', zh: '马里', es: 'Malí', fr: 'Mali', de: 'Mali' },
  NE: { ko: '니제르', ja: 'ニジェール', zh: '尼日尔', es: 'Níger', fr: 'Niger', de: 'Niger' },
  TG: { ko: '토고', ja: 'トーゴ', zh: '多哥', es: 'Togo', fr: 'Togo', de: 'Togo' },
  GA: { ko: '가봉', ja: 'ガボン', zh: '加蓬', es: 'Gabón', fr: 'Gabon', de: 'Gabun' },
  CG: { ko: '콩고공화국', ja: 'コンゴ共和国', zh: '刚果共和国', es: 'República del Congo', fr: 'République du Congo', de: 'Kongo' },
  GN: { ko: '기니', ja: 'ギニア', zh: '几内亚', es: 'Guinea', fr: 'Guinée', de: 'Guinea' },
  SL: { ko: '시에라리온', ja: 'シエラレオネ', zh: '塞拉利昂', es: 'Sierra Leona', fr: 'Sierra Leone', de: 'Sierra Leone' },
  LR: { ko: '라이베리아', ja: 'ライベリア', zh: '利比里亚', es: 'Liberia', fr: 'Liberia', de: 'Liberia' },
  MR: { ko: '모리타니아', ja: 'モーリタニア', zh: '毛里塔尼亚', es: 'Mauritania', fr: 'Mauritanie', de: 'Mauretanien' },
  TD: { ko: '차드', ja: 'チャド', zh: '乍得', es: 'Chad', fr: 'Tchad', de: 'Tschad' },
  SZ: { ko: '에스와티니', ja: 'エスワティニ', zh: '斯威士兰', es: 'Esuatini', fr: 'Eswatini', de: 'Eswatini' },
  LS: { ko: '레소토', ja: 'レソト', zh: '莱索托', es: 'Lesoto', fr: 'Lesotho', de: 'Lesotho' },
  SC: { ko: '세이셀', ja: 'セーシェル', zh: '塞舌尔', es: 'Seychelles', fr: 'Seychelles', de: 'Seychellen' },
  DJ: { ko: '지부티', ja: 'ジブチ', zh: '吉布提', es: 'Yibuti', fr: 'Djibouti', de: 'Dschibuti' },
  SO: { ko: '소말리아', ja: 'ソマリア', zh: '索马里', es: 'Somalia', fr: 'Somalie', de: 'Somalia' },
  ER: { ko: '에리트레아', ja: 'エリトレア', zh: '厄立特里亚', es: 'Eritrea', fr: 'Érythrée', de: 'Eritrea' },
  SS: { ko: '남수단', ja: '南スーダン', zh: '南苏丹', es: 'Sudán del Sur', fr: 'Soudan du Sud', de: 'Südsudan' },

  // ═══ OCEANIA ═══
  FJ: { ko: '피지', ja: 'フィジー', zh: '斐济', es: 'Fiyi', fr: 'Fidji', de: 'Fidschi' },
  PG: { ko: '파푸아뉴기니', ja: 'パプアニューギニア', zh: '巴布亚新几内亚', es: 'Papúa Nueva Guinea', fr: 'Papouasie-Nouvelle-Guinée', de: 'Papua-Neuguinea' },
  WS: { ko: '사모아', ja: 'サモア', zh: '萨摩亚', es: 'Samoa', fr: 'Samoa', de: 'Samoa' },
  TO: { ko: '통가', ja: 'トンガ', zh: '汤加', es: 'Tonga', fr: 'Tonga', de: 'Tonga' },
  VU: { ko: '바누아투', ja: 'バヌアツ', zh: '瓦努阿图', es: 'Vanuatu', fr: 'Vanuatu', de: 'Vanuatu' },
  SB: { ko: '솔로몬제도', ja: 'ソロモン諸島', zh: '所罗门群岛', es: 'Islas Salomón', fr: 'Îles Salomon', de: 'Salomonen' },
  NC: { ko: '뉴칼레도니아', ja: 'ニューカレドニア', zh: '新喀里多尼亚', es: 'Nueva Caledonia', fr: 'Nouvelle-Calédonie', de: 'Neukaledonien' },
  PF: { ko: '프랑스령폴리네시아', ja: 'フランス領ポリネシア', zh: '法属波利尼西亚', es: 'Polinesia Francesa', fr: 'Polynésie française', de: 'Französisch-Polynesien' },
  GU: { ko: '괌', ja: 'グアム', zh: '关岛', es: 'Guam', fr: 'Guam', de: 'Guam' },
  AS: { ko: '미국령사모아', ja: '米領サモア', zh: '美属萨摩亚', es: 'Samoa Americana', fr: 'Samoa américaines', de: 'Amerikanisch-Samoa' },
  MP: { ko: '북마리아나제도', ja: '北マリアナ諸島', zh: '北马里亚纳群岛', es: 'Islas Marianas del Norte', fr: 'Îles Mariannes du Nord', de: 'Nördliche Marianen' },
  CK: { ko: '쿡제도', ja: 'クック諸島', zh: '库克群岛', es: 'Islas Cook', fr: 'Îles Cook', de: 'Cookinseln' },
  KI: { ko: '키리바시', ja: 'キリバス', zh: '基里巴斯', es: 'Kiribati', fr: 'Kiribati', de: 'Kiribati' },
  MH: { ko: '마셜제도', ja: 'マーシャル諸島', zh: '马绍尔群岛', es: 'Islas Marshall', fr: 'Îles Marshall', de: 'Marshallinseln' },
  FM: { ko: '미크로네시아연방', ja: 'ミクロネシア連邦', zh: '密克罗尼西亚联邦', es: 'Estados Federados de Micronesia', fr: 'États fédérés de Micronésie', de: 'Föderierte Staaten von Mikronesien' },
  PW: { ko: '팔라우', ja: 'パラオ', zh: '帕劳', es: 'Palau', fr: 'Palaos', de: 'Palau' },
  NR: { ko: '나우루', ja: 'ナウル', zh: '瑙鲁', es: 'Nauru', fr: 'Nauru', de: 'Nauru' },
  TV: { ko: '투발루', ja: 'ツバル', zh: '图瓦卢', es: 'Tuvalu', fr: 'Tuvalu', de: 'Tuvalu' },
  NU: { ko: '니우에', ja: 'ニウエ', zh: '纽埃', es: 'Niue', fr: 'Niue', de: 'Niue' },
  WF: { ko: '월리스푸투나', ja: 'ウォリス・フツナ', zh: '瓦利斯和富图纳', es: 'Wallis y Futuna', fr: 'Wallis-et-Futuna', de: 'Wallis und Futuna' },
  TK: { ko: '토켈라우', ja: 'トケラウ', zh: '托克劳', es: 'Tokelau', fr: 'Tokelau', de: 'Tokelau' },

  // ═══ SPECIAL TERRITORIES ═══
  IO: { ko: '영국령인도양지역', ja: 'イギリス領インド洋地域', zh: '英属印度洋地域', es: 'Territorio Británico del Océano Índico', fr: 'Territoire britannique de l\'océan Indien', de: 'Britisches Territorium im Indischen Ozean' },
  CX: { ko: '크리스마스섬', ja: 'クリスマス島', zh: '圣诞岛', es: 'Isla de Navidad', fr: 'Île Christmas', de: 'Weihnachtsinsel' },
  CC: { ko: '코코스제도', ja: 'ココス（キーリング）諸島', zh: '科科斯群岛', es: 'Islas Cocos', fr: 'Îles Cocos (Keeling)', de: 'Kokosinseln' },
  NF: { ko: '노퍼크섬', ja: 'ノーフォーク島', zh: '诺福克岛', es: 'Isla Norfolk', fr: 'Île Norfolk', de: 'Norfolkinsel' },
  KP: { ko: '북한', ja: '朝鮮民主主義人民共和国', zh: '朝鲜民主主义人民共和国', es: 'Corea del Norte', fr: 'Corée du Nord', de: 'Nordkorea' },
};

/**
 * Get country name in specified language.
 * Falls back to English name from country-data.ts.
 */
export function getCountryName(code: string, lang: SupportedLanguage = 'en'): string {
  const upperCode = code.toUpperCase();

  if (lang === 'en') {
    // English names come from country-data.ts
    const { getCountryProfile } = require('./country-data');
    const profile = getCountryProfile(upperCode);
    return profile?.name || upperCode;
  }

  const translations = COUNTRY_NAMES[upperCode];
  if (translations && translations[lang]) {
    return translations[lang]!;
  }

  // Fallback to English
  const { getCountryProfile } = require('./country-data');
  const profile = getCountryProfile(upperCode);
  return profile?.name || upperCode;
}

/**
 * Get all country names for a given language.
 * Returns a map of code → localized name.
 */
export function getAllCountryNames(lang: SupportedLanguage = 'en'): Record<string, string> {
  const { getSupportedCountries, getCountryProfile } = require('./country-data');
  const codes: string[] = getSupportedCountries();
  const result: Record<string, string> = {};

  for (const code of codes) {
    result[code] = getCountryName(code, lang);
  }

  return result;
}

/**
 * Get supported languages list.
 */
export function getSupportedLanguages(): SupportedLanguage[] {
  return [...SUPPORTED_LANGUAGES];
}
