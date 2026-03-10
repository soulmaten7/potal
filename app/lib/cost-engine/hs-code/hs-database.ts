/**
 * POTAL HS Code Database -- WCO HS 2022 Complete
 * Total: 5371 codes across 96 chapters
 * Sources: WCO HS 2022, USITC HTS, EU TARIC, POTAL e-commerce optimized
 * Generated: 2026-03-06 (Session 28)
 */

import type { HsCodeEntry } from './types';

import { CHAPTER_01 } from './chapters/ch01'; // Live Animals (34)
import { CHAPTER_02 } from './chapters/ch02'; // Meat & Edible Meat Offal (68)
import { CHAPTER_03 } from './chapters/ch03'; // Fish & Crustaceans (190)
import { CHAPTER_04 } from './chapters/ch04'; // Dairy, Eggs, Honey (33)
import { CHAPTER_05 } from './chapters/ch05'; // Animal Products NES (16)
import { CHAPTER_06 } from './chapters/ch06'; // Live Trees & Plants (16)
import { CHAPTER_07 } from './chapters/ch07'; // Edible Vegetables (68)
import { CHAPTER_08 } from './chapters/ch08'; // Edible Fruit & Nuts (72)
import { CHAPTER_09 } from './chapters/ch09'; // Coffee, Tea, Spices (42)
import { CHAPTER_10 } from './chapters/ch10'; // Cereals (27)
import { CHAPTER_11 } from './chapters/ch11'; // Milling Products (27)
import { CHAPTER_12 } from './chapters/ch12'; // Oil Seeds & Plants (49)
import { CHAPTER_13 } from './chapters/ch13'; // Lac, Gums, Resins (11)
import { CHAPTER_14 } from './chapters/ch14'; // Vegetable Plaiting Materials (5)
import { CHAPTER_15 } from './chapters/ch15'; // Animal & Vegetable Fats (50)
import { CHAPTER_16 } from './chapters/ch16'; // Meat/Fish Preparations (42)
import { CHAPTER_17 } from './chapters/ch17'; // Sugars & Confectionery (19)
import { CHAPTER_18 } from './chapters/ch18'; // Cocoa & Preparations (12)
import { CHAPTER_19 } from './chapters/ch19'; // Cereal & Bakery Products (20)
import { CHAPTER_20 } from './chapters/ch20'; // Preserved Fruit & Vegetables (56)
import { CHAPTER_21 } from './chapters/ch21'; // Misc Food Preparations (17)
import { CHAPTER_22 } from './chapters/ch22'; // Beverages & Vinegar (25)
import { CHAPTER_23 } from './chapters/ch23'; // Food Industry Residues (24)
import { CHAPTER_24 } from './chapters/ch24'; // Tobacco & Substitutes (10)
import { CHAPTER_25 } from './chapters/ch25'; // Salt, Sulphur, Stone (68)
import { CHAPTER_26 } from './chapters/ch26'; // Ores, Slag, Ash (37)
import { CHAPTER_27 } from './chapters/ch27'; // Mineral Fuels (44)
import { CHAPTER_28 } from './chapters/ch28'; // Inorganic Chemicals (167)
import { CHAPTER_29 } from './chapters/ch29'; // Organic Chemicals (336)
import { CHAPTER_30 } from './chapters/ch30'; // Pharmaceuticals (33)
import { CHAPTER_31 } from './chapters/ch31'; // Fertilizers (23)
import { CHAPTER_32 } from './chapters/ch32'; // Tanning & Dyes (47)
import { CHAPTER_33 } from './chapters/ch33'; // Essential Oils & Perfumes (30)
import { CHAPTER_34 } from './chapters/ch34'; // Soap & Cleansers (26)
import { CHAPTER_35 } from './chapters/ch35'; // Albuminoidal Substances (15)
import { CHAPTER_36 } from './chapters/ch36'; // Explosives (8)
import { CHAPTER_37 } from './chapters/ch37'; // Photographic Supplies (32)
import { CHAPTER_38 } from './chapters/ch38'; // Misc Chemical Products (83)
import { CHAPTER_39 } from './chapters/ch39'; // Plastics & Articles (127)
import { CHAPTER_40 } from './chapters/ch40'; // Rubber & Articles (89)
import { CHAPTER_41 } from './chapters/ch41'; // Raw Hides & Skins (37)
import { CHAPTER_42 } from './chapters/ch42'; // Leather Goods (22)
import { CHAPTER_43 } from './chapters/ch43'; // Fur Articles (15)
import { CHAPTER_44 } from './chapters/ch44'; // Wood & Articles (77)
import { CHAPTER_45 } from './chapters/ch45'; // Cork & Articles (7)
import { CHAPTER_46 } from './chapters/ch46'; // Basketwork (13)
import { CHAPTER_47 } from './chapters/ch47'; // Wood Pulp (21)
import { CHAPTER_48 } from './chapters/ch48'; // Paper & Paperboard (106)
import { CHAPTER_49 } from './chapters/ch49'; // Books & Printed Materials (20)
import { CHAPTER_50 } from './chapters/ch50'; // Silk (9)
import { CHAPTER_51 } from './chapters/ch51'; // Wool & Fine Hair (40)
import { CHAPTER_52 } from './chapters/ch52'; // Cotton (124)
import { CHAPTER_53 } from './chapters/ch53'; // Other Vegetable Textiles (23)
import { CHAPTER_54 } from './chapters/ch54'; // Man-Made Filaments (71)
import { CHAPTER_55 } from './chapters/ch55'; // Man-Made Staple Fibers (107)
import { CHAPTER_56 } from './chapters/ch56'; // Wadding & Nonwovens (31)
import { CHAPTER_57 } from './chapters/ch57'; // Carpets & Rugs (22)
import { CHAPTER_58 } from './chapters/ch58'; // Special Woven Fabrics (39)
import { CHAPTER_59 } from './chapters/ch59'; // Impregnated Textiles (24)
import { CHAPTER_60 } from './chapters/ch60'; // Knitted Fabrics (45)
import { CHAPTER_61 } from './chapters/ch61'; // Knitted Apparel (113)
import { CHAPTER_62 } from './chapters/ch62'; // Woven Apparel (121)
import { CHAPTER_63 } from './chapters/ch63'; // Textile Articles (55)
import { CHAPTER_64 } from './chapters/ch64'; // Footwear (29)
import { CHAPTER_65 } from './chapters/ch65'; // Headwear (11)
import { CHAPTER_66 } from './chapters/ch66'; // Umbrellas (7)
import { CHAPTER_67 } from './chapters/ch67'; // Feathers & Artificial Flowers (10)
import { CHAPTER_68 } from './chapters/ch68'; // Stone & Cement (50)
import { CHAPTER_69 } from './chapters/ch69'; // Ceramics (32)
import { CHAPTER_70 } from './chapters/ch70'; // Glass & Articles (65)
import { CHAPTER_71 } from './chapters/ch71'; // Jewelry & Precious Metals (54)
import { CHAPTER_72 } from './chapters/ch72'; // Iron & Steel (167)
import { CHAPTER_73 } from './chapters/ch73'; // Iron & Steel Articles (127)
import { CHAPTER_74 } from './chapters/ch74'; // Copper & Articles (51)
import { CHAPTER_75 } from './chapters/ch75'; // Nickel & Articles (17)
import { CHAPTER_76 } from './chapters/ch76'; // Aluminum & Articles (36)
import { CHAPTER_78 } from './chapters/ch78'; // Lead & Articles (8)
import { CHAPTER_79 } from './chapters/ch79'; // Zinc & Articles (9)
import { CHAPTER_80 } from './chapters/ch80'; // Tin & Articles (5)
import { CHAPTER_81 } from './chapters/ch81'; // Other Base Metals (48)
import { CHAPTER_82 } from './chapters/ch82'; // Tools & Implements (68)
import { CHAPTER_83 } from './chapters/ch83'; // Base Metal Articles (38)
import { CHAPTER_84 } from './chapters/ch84'; // Machinery & Mechanical (515)
import { CHAPTER_85 } from './chapters/ch85'; // Electrical & Electronics (274)
import { CHAPTER_86 } from './chapters/ch86'; // Railway (23)
import { CHAPTER_87 } from './chapters/ch87'; // Vehicles (75)
import { CHAPTER_88 } from './chapters/ch88'; // Aircraft (15)
import { CHAPTER_89 } from './chapters/ch89'; // Ships (18)
import { CHAPTER_90 } from './chapters/ch90'; // Optical & Medical Instruments (148)
import { CHAPTER_91 } from './chapters/ch91'; // Watches (52)
import { CHAPTER_92 } from './chapters/ch92'; // Musical Instruments (21)
import { CHAPTER_93 } from './chapters/ch93'; // Arms & Ammunition (20)
import { CHAPTER_94 } from './chapters/ch94'; // Furniture (42)
import { CHAPTER_95 } from './chapters/ch95'; // Toys & Sports (35)
import { CHAPTER_96 } from './chapters/ch96'; // Misc Manufactured Articles (52)
import { CHAPTER_97 } from './chapters/ch97'; // Works of Art (9)

export const HS_DATABASE: HsCodeEntry[] = [
  ...CHAPTER_01,
  ...CHAPTER_02,
  ...CHAPTER_03,
  ...CHAPTER_04,
  ...CHAPTER_05,
  ...CHAPTER_06,
  ...CHAPTER_07,
  ...CHAPTER_08,
  ...CHAPTER_09,
  ...CHAPTER_10,
  ...CHAPTER_11,
  ...CHAPTER_12,
  ...CHAPTER_13,
  ...CHAPTER_14,
  ...CHAPTER_15,
  ...CHAPTER_16,
  ...CHAPTER_17,
  ...CHAPTER_18,
  ...CHAPTER_19,
  ...CHAPTER_20,
  ...CHAPTER_21,
  ...CHAPTER_22,
  ...CHAPTER_23,
  ...CHAPTER_24,
  ...CHAPTER_25,
  ...CHAPTER_26,
  ...CHAPTER_27,
  ...CHAPTER_28,
  ...CHAPTER_29,
  ...CHAPTER_30,
  ...CHAPTER_31,
  ...CHAPTER_32,
  ...CHAPTER_33,
  ...CHAPTER_34,
  ...CHAPTER_35,
  ...CHAPTER_36,
  ...CHAPTER_37,
  ...CHAPTER_38,
  ...CHAPTER_39,
  ...CHAPTER_40,
  ...CHAPTER_41,
  ...CHAPTER_42,
  ...CHAPTER_43,
  ...CHAPTER_44,
  ...CHAPTER_45,
  ...CHAPTER_46,
  ...CHAPTER_47,
  ...CHAPTER_48,
  ...CHAPTER_49,
  ...CHAPTER_50,
  ...CHAPTER_51,
  ...CHAPTER_52,
  ...CHAPTER_53,
  ...CHAPTER_54,
  ...CHAPTER_55,
  ...CHAPTER_56,
  ...CHAPTER_57,
  ...CHAPTER_58,
  ...CHAPTER_59,
  ...CHAPTER_60,
  ...CHAPTER_61,
  ...CHAPTER_62,
  ...CHAPTER_63,
  ...CHAPTER_64,
  ...CHAPTER_65,
  ...CHAPTER_66,
  ...CHAPTER_67,
  ...CHAPTER_68,
  ...CHAPTER_69,
  ...CHAPTER_70,
  ...CHAPTER_71,
  ...CHAPTER_72,
  ...CHAPTER_73,
  ...CHAPTER_74,
  ...CHAPTER_75,
  ...CHAPTER_76,
  ...CHAPTER_78,
  ...CHAPTER_79,
  ...CHAPTER_80,
  ...CHAPTER_81,
  ...CHAPTER_82,
  ...CHAPTER_83,
  ...CHAPTER_84,
  ...CHAPTER_85,
  ...CHAPTER_86,
  ...CHAPTER_87,
  ...CHAPTER_88,
  ...CHAPTER_89,
  ...CHAPTER_90,
  ...CHAPTER_91,
  ...CHAPTER_92,
  ...CHAPTER_93,
  ...CHAPTER_94,
  ...CHAPTER_95,
  ...CHAPTER_96,
  ...CHAPTER_97,
];

// Total: 5371 entries across 96 chapters
// E-commerce optimized entries (original POTAL): 442
// WCO HS 2022 expansion: +4929

/**
 * Get a single HS code entry by its 6-digit code
 */
export function getHsEntry(code: string): HsCodeEntry | undefined {
  return HS_DATABASE.find((entry) => entry.code === code);
}

/**
 * Get all HS code entries for a specific chapter (2-digit)
 */
export function getChapterEntries(chapter: string): HsCodeEntry[] {
  return HS_DATABASE.filter((entry) => entry.chapter === chapter);
}

/**
 * Get all HS code entries for a specific category
 */
export function getCategoryEntries(category: string): HsCodeEntry[] {
  return HS_DATABASE.filter((entry) => entry.category === category);
}
