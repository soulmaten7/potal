/**
 * Mock Data for Portal - 테스트용 상품 데이터
 * API 한도 초과 시 UI 테스트를 위한 풍부한 Mock Data
 */

import { addAmazonAffiliateTag } from '../utils/affiliate';

// Amazon 링크에 태그 추가 헬퍼 (유틸리티 함수 사용)
const addAmazonTag = (url) => {
  return addAmazonAffiliateTag(url);
};

export const mockProducts = {
  Amazon: [
    { id: 1, name: 'Echo Dot 5th Gen', price: '$29.99', price_num: 29.99, image: null, link: addAmazonTag('https://www.amazon.com/dp/B09B8V1LZ3'), site: 'Amazon', shipping: 'Prime' },
    { id: 2, name: 'Fire TV Stick 4K', price: '$24.99', price_num: 24.99, image: null, link: addAmazonTag('https://www.amazon.com/dp/B08XVYZ1Y5'), site: 'Amazon', shipping: 'Prime' },
    { id: 3, name: 'Kindle Paperwhite', price: '$99.99', price_num: 99.99, image: null, link: addAmazonTag('https://www.amazon.com/dp/B08KTZ8249'), site: 'Amazon', shipping: 'Prime' },
    { id: 4, name: 'Ring Doorbell', price: '$99.99', price_num: 99.99, image: null, link: addAmazonTag('https://www.amazon.com/dp/B08N5WRWNW'), site: 'Amazon', shipping: 'Prime' },
    { id: 5, name: 'Blink Security Camera', price: '$29.99', price_num: 29.99, image: null, link: addAmazonTag('https://www.amazon.com/dp/B07XJ8C8F5'), site: 'Amazon', shipping: 'Prime' },
    { id: 6, name: 'Amazon Basics Backpack', price: '$19.99', price_num: 19.99, image: null, link: addAmazonTag('https://www.amazon.com/dp/B07D5V5V8H'), site: 'Amazon', shipping: 'Prime' },
    { id: 7, name: 'Echo Show 8', price: '$79.99', price_num: 79.99, image: null, link: addAmazonTag('https://www.amazon.com/dp/B08J8H1X1S'), site: 'Amazon', shipping: 'Prime' },
    { id: 8, name: 'Fire Tablet 10"', price: '$149.99', price_num: 149.99, image: null, link: addAmazonTag('https://www.amazon.com/dp/B08F7PTF53'), site: 'Amazon', shipping: 'Prime' },
    { id: 9, name: 'Alexa Smart Plug', price: '$24.99', price_num: 24.99, image: null, link: addAmazonTag('https://www.amazon.com/dp/B07QK2C1DT'), site: 'Amazon', shipping: 'Prime' },
    { id: 10, name: 'Amazon Basics Charger', price: '$12.99', price_num: 12.99, image: null, link: addAmazonTag('https://www.amazon.com/dp/B07XJ8C8F5'), site: 'Amazon', shipping: 'Prime' },
  ],
  Walmart: [
    { id: 11, name: 'ONN TV 50" 4K', price: '$228.00', price_num: 228.00, image: null, link: 'https://www.walmart.com/ip/ONN-50-Class-4K-UHD-2160P-LED-Smart-TV-Roku-TV-100012586/123456789', site: 'Walmart', shipping: '2nd Day' },
    { id: 12, name: 'HyperX Gaming Headset', price: '$49.99', price_num: 49.99, image: null, link: 'https://www.walmart.com/ip/HyperX-Cloud-Stinger-Gaming-Headset/123456790', site: 'Walmart', shipping: '2nd Day' },
    { id: 13, name: 'Mainstays Mattress', price: '$79.99', price_num: 79.99, image: null, link: 'https://www.walmart.com/ip/Mainstays-8-Inch-Memory-Foam-Mattress/123456791', site: 'Walmart', shipping: '2nd Day' },
    { id: 14, name: 'Ozark Trail Cooler', price: '$29.99', price_num: 29.99, image: null, link: 'https://www.walmart.com/ip/Ozark-Trail-52-Quart-High-Performance-Cooler/123456792', site: 'Walmart', shipping: '2nd Day' },
    { id: 15, name: 'Great Value Coffee', price: '$4.98', price_num: 4.98, image: null, link: 'https://www.walmart.com/ip/Great-Value-Original-Roast-Coffee/123456793', site: 'Walmart', shipping: '2nd Day' },
    { id: 16, name: 'Equate Vitamins', price: '$8.97', price_num: 8.97, image: null, link: 'https://www.walmart.com/ip/Equate-Daily-Multivitamin/123456794', site: 'Walmart', shipping: '2nd Day' },
    { id: 17, name: 'Onn Streaming Device', price: '$19.88', price_num: 19.88, image: null, link: 'https://www.walmart.com/ip/Onn-4K-Streaming-Device/123456795', site: 'Walmart', shipping: '2nd Day' },
    { id: 18, name: 'Timex Watch', price: '$24.99', price_num: 24.99, image: null, link: 'https://www.walmart.com/ip/Timex-Weekender-Watch/123456796', site: 'Walmart', shipping: '2nd Day' },
    { id: 19, name: 'Hanes T-Shirt Pack', price: '$12.98', price_num: 12.98, image: null, link: 'https://www.walmart.com/ip/Hanes-ComfortSoft-T-Shirt-6-Pack/123456797', site: 'Walmart', shipping: '2nd Day' },
    { id: 20, name: 'Better Homes Bedding', price: '$19.99', price_num: 19.99, image: null, link: 'https://www.walmart.com/ip/Better-Homes-Garden-Bedding-Set/123456798', site: 'Walmart', shipping: '2nd Day' },
  ],
  'eBay': [
    { id: 21, name: 'Vintage Watch Collection', price: '$89.99', price_num: 89.99, image: null, link: 'https://www.ebay.com/itm/vintage-watch-collection/123456799', site: 'eBay', shipping: 'Free Shipping' },
    { id: 22, name: 'Gaming Console Bundle', price: '$299.99', price_num: 299.99, image: null, link: 'https://www.ebay.com/itm/gaming-console-bundle/123456800', site: 'eBay', shipping: 'Free Shipping' },
    { id: 23, name: 'Designer Handbag', price: '$199.99', price_num: 199.99, image: null, link: 'https://www.ebay.com/itm/designer-handbag/123456801', site: 'eBay', shipping: 'Free Shipping' },
    { id: 24, name: 'Smartphone Unlocked', price: '$449.99', price_num: 449.99, image: null, link: 'https://www.ebay.com/itm/smartphone-unlocked/123456802', site: 'eBay', shipping: 'Free Shipping' },
    { id: 25, name: 'Vintage Camera', price: '$129.99', price_num: 129.99, image: null, link: 'https://www.ebay.com/itm/vintage-camera/123456803', site: 'eBay', shipping: 'Free Shipping' },
    { id: 26, name: 'Collectible Action Figure', price: '$39.99', price_num: 39.99, image: null, link: 'https://www.ebay.com/itm/collectible-action-figure/123456804', site: 'eBay', shipping: 'Free Shipping' },
    { id: 27, name: 'Vintage Vinyl Records', price: '$24.99', price_num: 24.99, image: null, link: 'https://www.ebay.com/itm/vintage-vinyl-records/123456805', site: 'eBay', shipping: 'Free Shipping' },
    { id: 28, name: 'Antique Jewelry', price: '$179.99', price_num: 179.99, image: null, link: 'https://www.ebay.com/itm/antique-jewelry/123456806', site: 'eBay', shipping: 'Free Shipping' },
    { id: 29, name: 'Rare Book Collection', price: '$59.99', price_num: 59.99, image: null, link: 'https://www.ebay.com/itm/rare-book-collection/123456807', site: 'eBay', shipping: 'Free Shipping' },
    { id: 30, name: 'Vintage Electronics', price: '$79.99', price_num: 79.99, image: null, link: 'https://www.ebay.com/itm/vintage-electronics/123456808', site: 'eBay', shipping: 'Free Shipping' },
  ],
  Temu: [
    { id: 31, name: 'Budget Phone Case', price: '$4.99', price_num: 4.99, image: null, link: 'https://www.temu.com/budget-phone-case/123456809', site: 'Temu', shipping: 'Free Shipping' },
    { id: 32, name: 'Affordable Home Decor', price: '$9.99', price_num: 9.99, image: null, link: 'https://www.temu.com/affordable-home-decor/123456810', site: 'Temu', shipping: 'Free Shipping' },
    { id: 33, name: 'Cheap Fashion Accessories', price: '$6.99', price_num: 6.99, image: null, link: 'https://www.temu.com/cheap-fashion-accessories/123456811', site: 'Temu', shipping: 'Free Shipping' },
    { id: 34, name: 'Budget Electronics', price: '$12.99', price_num: 12.99, image: null, link: 'https://www.temu.com/budget-electronics/123456812', site: 'Temu', shipping: 'Free Shipping' },
    { id: 35, name: 'Affordable Kitchen Tools', price: '$8.99', price_num: 8.99, image: null, link: 'https://www.temu.com/affordable-kitchen-tools/123456813', site: 'Temu', shipping: 'Free Shipping' },
    { id: 36, name: 'Budget Beauty Products', price: '$5.99', price_num: 5.99, image: null, link: 'https://www.temu.com/budget-beauty-products/123456814', site: 'Temu', shipping: 'Free Shipping' },
    { id: 37, name: 'Cheap Phone Accessories', price: '$3.99', price_num: 3.99, image: null, link: 'https://www.temu.com/cheap-phone-accessories/123456815', site: 'Temu', shipping: 'Free Shipping' },
    { id: 38, name: 'Affordable Pet Supplies', price: '$7.99', price_num: 7.99, image: null, link: 'https://www.temu.com/affordable-pet-supplies/123456816', site: 'Temu', shipping: 'Free Shipping' },
    { id: 39, name: 'Budget Fitness Gear', price: '$11.99', price_num: 11.99, image: null, link: 'https://www.temu.com/budget-fitness-gear/123456817', site: 'Temu', shipping: 'Free Shipping' },
    { id: 40, name: 'Cheap Home Organization', price: '$9.99', price_num: 9.99, image: null, link: 'https://www.temu.com/cheap-home-organization/123456818', site: 'Temu', shipping: 'Free Shipping' },
  ],
  Target: [
    { id: 41, name: 'Roomba Robot Vacuum', price: '$199.99', price_num: 199.99, image: null, link: 'https://www.target.com/p/roomba-robot-vacuum/123456819', site: 'Target', shipping: 'Free Shipping' },
    { id: 42, name: 'KitchenAid Mixer', price: '$179.99', price_num: 179.99, image: null, link: 'https://www.target.com/p/kitchenaid-mixer/123456820', site: 'Target', shipping: 'Free Shipping' },
    { id: 43, name: 'Nest Thermostat', price: '$119.99', price_num: 119.99, image: null, link: 'https://www.target.com/p/nest-thermostat/123456821', site: 'Target', shipping: 'Free Shipping' },
    { id: 44, name: 'Dyson V15 Vacuum', price: '$599.99', price_num: 599.99, image: null, link: 'https://www.target.com/p/dyson-v15-vacuum/123456822', site: 'Target', shipping: 'Free Shipping' },
    { id: 45, name: 'Instant Pot Duo', price: '$89.99', price_num: 89.99, image: null, link: 'https://www.target.com/p/instant-pot-duo/123456823', site: 'Target', shipping: 'Free Shipping' },
    { id: 46, name: 'AirPods Pro 2', price: '$249.99', price_num: 249.99, image: null, link: 'https://www.target.com/p/airpods-pro-2/123456824', site: 'Target', shipping: 'Free Shipping' },
    { id: 47, name: 'Samsung 55" TV', price: '$449.99', price_num: 449.99, image: null, link: 'https://www.target.com/p/samsung-55-tv/123456825', site: 'Target', shipping: 'Free Shipping' },
    { id: 48, name: 'Nike Air Max', price: '$129.99', price_num: 129.99, image: null, link: 'https://www.target.com/p/nike-air-max/123456826', site: 'Target', shipping: 'Free Shipping' },
    { id: 49, name: 'LEGO Star Wars Set', price: '$79.99', price_num: 79.99, image: null, link: 'https://www.target.com/p/lego-star-wars-set/123456827', site: 'Target', shipping: 'Free Shipping' },
    { id: 50, name: 'Yeti Tumbler', price: '$34.99', price_num: 34.99, image: null, link: 'https://www.target.com/p/yeti-tumbler/123456828', site: 'Target', shipping: 'Free Shipping' },
  ],
  'Best Buy': [
    { id: 51, name: '4K Ultra HD TV 55"', price: '$449.99', price_num: 449.99, image: null, link: 'https://www.bestbuy.com/site/4k-ultra-hd-tv-55/123456829', site: 'Best Buy', shipping: 'Free Shipping' },
    { id: 52, name: 'Gaming Mouse', price: '$49.99', price_num: 49.99, image: null, link: 'https://www.bestbuy.com/site/gaming-mouse/123456830', site: 'Best Buy', shipping: 'Free Shipping' },
    { id: 53, name: 'Wireless Earbuds', price: '$29.99', price_num: 29.99, image: null, link: 'https://www.bestbuy.com/site/wireless-earbuds/123456831', site: 'Best Buy', shipping: 'Free Shipping' },
    { id: 54, name: 'MacBook Air M2', price: '$999.99', price_num: 999.99, image: null, link: 'https://www.bestbuy.com/site/macbook-air-m2/123456832', site: 'Best Buy', shipping: 'Free Shipping' },
    { id: 55, name: 'Sony WH-1000XM5', price: '$399.99', price_num: 399.99, image: null, link: 'https://www.bestbuy.com/site/sony-wh-1000xm5/123456833', site: 'Best Buy', shipping: 'Free Shipping' },
    { id: 56, name: 'Nintendo Switch OLED', price: '$349.99', price_num: 349.99, image: null, link: 'https://www.bestbuy.com/site/nintendo-switch-oled/123456834', site: 'Best Buy', shipping: 'Free Shipping' },
    { id: 57, name: 'iPad Air', price: '$599.99', price_num: 599.99, image: null, link: 'https://www.bestbuy.com/site/ipad-air/123456835', site: 'Best Buy', shipping: 'Free Shipping' },
    { id: 58, name: 'Samsung Galaxy Watch', price: '$249.99', price_num: 249.99, image: null, link: 'https://www.bestbuy.com/site/samsung-galaxy-watch/123456836', site: 'Best Buy', shipping: 'Free Shipping' },
    { id: 59, name: 'LG Monitor 27"', price: '$199.99', price_num: 199.99, image: null, link: 'https://www.bestbuy.com/site/lg-monitor-27/123456837', site: 'Best Buy', shipping: 'Free Shipping' },
    { id: 60, name: 'Logitech Keyboard', price: '$79.99', price_num: 79.99, image: null, link: 'https://www.bestbuy.com/site/logitech-keyboard/123456838', site: 'Best Buy', shipping: 'Free Shipping' },
  ],
  'Home Depot': [
    { id: 61, name: 'Power Drill Set', price: '$79.99', price_num: 79.99, image: null, link: 'https://www.homedepot.com/p/power-drill-set/123456839', site: 'Home Depot', shipping: 'Free Shipping' },
    { id: 62, name: 'Paint Brush Set', price: '$19.99', price_num: 19.99, image: null, link: 'https://www.homedepot.com/p/paint-brush-set/123456840', site: 'Home Depot', shipping: 'Free Shipping' },
    { id: 63, name: 'Garden Tools Kit', price: '$49.99', price_num: 49.99, image: null, link: 'https://www.homedepot.com/p/garden-tools-kit/123456841', site: 'Home Depot', shipping: 'Free Shipping' },
    { id: 64, name: 'Light Fixture', price: '$89.99', price_num: 89.99, image: null, link: 'https://www.homedepot.com/p/light-fixture/123456842', site: 'Home Depot', shipping: 'Free Shipping' },
    { id: 65, name: 'Hardware Toolbox', price: '$39.99', price_num: 39.99, image: null, link: 'https://www.homedepot.com/p/hardware-toolbox/123456843', site: 'Home Depot', shipping: 'Free Shipping' },
    { id: 66, name: 'Lawn Mower', price: '$299.99', price_num: 299.99, image: null, link: 'https://www.homedepot.com/p/lawn-mower/123456844', site: 'Home Depot', shipping: 'Free Shipping' },
    { id: 67, name: 'Paint Roller Set', price: '$14.99', price_num: 14.99, image: null, link: 'https://www.homedepot.com/p/paint-roller-set/123456845', site: 'Home Depot', shipping: 'Free Shipping' },
    { id: 68, name: 'Screwdriver Set', price: '$24.99', price_num: 24.99, image: null, link: 'https://www.homedepot.com/p/screwdriver-set/123456846', site: 'Home Depot', shipping: 'Free Shipping' },
    { id: 69, name: 'Extension Cord', price: '$12.99', price_num: 12.99, image: null, link: 'https://www.homedepot.com/p/extension-cord/123456847', site: 'Home Depot', shipping: 'Free Shipping' },
    { id: 70, name: 'Work Gloves', price: '$9.99', price_num: 9.99, image: null, link: 'https://www.homedepot.com/p/work-gloves/123456848', site: 'Home Depot', shipping: 'Free Shipping' },
  ],
  Costco: [
    { id: 71, name: 'Bulk Paper Towels', price: '$24.99', price_num: 24.99, image: null, link: 'https://www.costco.com/bulk-paper-towels/123456849', site: 'Costco', shipping: 'Free Shipping' },
    { id: 72, name: 'Family Size Snacks', price: '$18.99', price_num: 18.99, image: null, link: 'https://www.costco.com/family-size-snacks/123456850', site: 'Costco', shipping: 'Free Shipping' },
    { id: 73, name: 'Bulk Toilet Paper', price: '$19.99', price_num: 19.99, image: null, link: 'https://www.costco.com/bulk-toilet-paper/123456851', site: 'Costco', shipping: 'Free Shipping' },
    { id: 74, name: 'Large Coffee Pack', price: '$29.99', price_num: 29.99, image: null, link: 'https://www.costco.com/large-coffee-pack/123456852', site: 'Costco', shipping: 'Free Shipping' },
    { id: 75, name: 'Bulk Cleaning Supplies', price: '$34.99', price_num: 34.99, image: null, link: 'https://www.costco.com/bulk-cleaning-supplies/123456853', site: 'Costco', shipping: 'Free Shipping' },
    { id: 76, name: 'Family Size Detergent', price: '$22.99', price_num: 22.99, image: null, link: 'https://www.costco.com/family-size-detergent/123456854', site: 'Costco', shipping: 'Free Shipping' },
    { id: 77, name: 'Bulk Batteries', price: '$16.99', price_num: 16.99, image: null, link: 'https://www.costco.com/bulk-batteries/123456855', site: 'Costco', shipping: 'Free Shipping' },
    { id: 78, name: 'Large Pack Water', price: '$8.99', price_num: 8.99, image: null, link: 'https://www.costco.com/large-pack-water/123456856', site: 'Costco', shipping: 'Free Shipping' },
    { id: 79, name: 'Bulk Pet Food', price: '$39.99', price_num: 39.99, image: null, link: 'https://www.costco.com/bulk-pet-food/123456857', site: 'Costco', shipping: 'Free Shipping' },
    { id: 80, name: 'Family Size Cereal', price: '$12.99', price_num: 12.99, image: null, link: 'https://www.costco.com/family-size-cereal/123456858', site: 'Costco', shipping: 'Free Shipping' },
  ],
  Wayfair: [
    { id: 81, name: 'Modern Sofa', price: '$599.99', price_num: 599.99, image: null, link: 'https://www.wayfair.com/modern-sofa/123456859', site: 'Wayfair', shipping: 'Free Shipping' },
    { id: 82, name: 'Dining Table Set', price: '$449.99', price_num: 449.99, image: null, link: 'https://www.wayfair.com/dining-table-set/123456860', site: 'Wayfair', shipping: 'Free Shipping' },
    { id: 83, name: 'Bedroom Dresser', price: '$299.99', price_num: 299.99, image: null, link: 'https://www.wayfair.com/bedroom-dresser/123456861', site: 'Wayfair', shipping: 'Free Shipping' },
    { id: 84, name: 'Coffee Table', price: '$199.99', price_num: 199.99, image: null, link: 'https://www.wayfair.com/coffee-table/123456862', site: 'Wayfair', shipping: 'Free Shipping' },
    { id: 85, name: 'Bookshelf', price: '$149.99', price_num: 149.99, image: null, link: 'https://www.wayfair.com/bookshelf/123456863', site: 'Wayfair', shipping: 'Free Shipping' },
    { id: 86, name: 'Accent Chair', price: '$179.99', price_num: 179.99, image: null, link: 'https://www.wayfair.com/accent-chair/123456864', site: 'Wayfair', shipping: 'Free Shipping' },
    { id: 87, name: 'TV Stand', price: '$249.99', price_num: 249.99, image: null, link: 'https://www.wayfair.com/tv-stand/123456865', site: 'Wayfair', shipping: 'Free Shipping' },
    { id: 88, name: 'Nightstand', price: '$89.99', price_num: 89.99, image: null, link: 'https://www.wayfair.com/nightstand/123456866', site: 'Wayfair', shipping: 'Free Shipping' },
    { id: 89, name: 'Dining Chairs Set', price: '$199.99', price_num: 199.99, image: null, link: 'https://www.wayfair.com/dining-chairs-set/123456867', site: 'Wayfair', shipping: 'Free Shipping' },
    { id: 90, name: 'Console Table', price: '$129.99', price_num: 129.99, image: null, link: 'https://www.wayfair.com/console-table/123456868', site: 'Wayfair', shipping: 'Free Shipping' },
  ],
  Apple: [
    { id: 91, name: 'iPhone 15 Pro', price: '$999.99', price_num: 999.99, image: null, link: 'https://www.apple.com/shop/buy-iphone/iphone-15-pro', site: 'Apple', shipping: 'Free Shipping' },
    { id: 92, name: 'MacBook Pro 14"', price: '$1,999.99', price_num: 1999.99, image: null, link: 'https://www.apple.com/shop/buy-mac/macbook-pro-14', site: 'Apple', shipping: 'Free Shipping' },
    { id: 93, name: 'AirPods Pro', price: '$249.99', price_num: 249.99, image: null, link: 'https://www.apple.com/shop/product/MQD83AM/A/airpods-pro', site: 'Apple', shipping: 'Free Shipping' },
    { id: 94, name: 'iPad Pro', price: '$799.99', price_num: 799.99, image: null, link: 'https://www.apple.com/shop/buy-ipad/ipad-pro', site: 'Apple', shipping: 'Free Shipping' },
    { id: 95, name: 'Apple Watch Series 9', price: '$399.99', price_num: 399.99, image: null, link: 'https://www.apple.com/shop/buy-watch/apple-watch-series-9', site: 'Apple', shipping: 'Free Shipping' },
    { id: 96, name: 'MacBook Air M2', price: '$1,199.99', price_num: 1199.99, image: null, link: 'https://www.apple.com/shop/buy-mac/macbook-air-m2', site: 'Apple', shipping: 'Free Shipping' },
    { id: 97, name: 'AirPods Max', price: '$549.99', price_num: 549.99, image: null, link: 'https://www.apple.com/shop/product/MGYH3AM/A/airpods-max', site: 'Apple', shipping: 'Free Shipping' },
    { id: 98, name: 'Magic Keyboard', price: '$149.99', price_num: 149.99, image: null, link: 'https://www.apple.com/shop/product/MK2A3AM/A/magic-keyboard', site: 'Apple', shipping: 'Free Shipping' },
    { id: 99, name: 'Magic Mouse', price: '$79.99', price_num: 79.99, image: null, link: 'https://www.apple.com/shop/product/MMMQ3AM/A/magic-mouse', site: 'Apple', shipping: 'Free Shipping' },
    { id: 100, name: 'Apple Pencil', price: '$129.99', price_num: 129.99, image: null, link: 'https://www.apple.com/shop/product/MK0C2AM/A/apple-pencil', site: 'Apple', shipping: 'Free Shipping' },
  ],
  AliExpress: [
    { id: 101, name: 'Budget Electronics', price: '$15.99', price_num: 15.99, image: null, link: 'https://www.aliexpress.com/item/budget-electronics/123456869', site: 'AliExpress', shipping: 'Global Shipping' },
    { id: 102, name: 'Phone Accessories', price: '$8.99', price_num: 8.99, image: null, link: 'https://www.aliexpress.com/item/phone-accessories/123456870', site: 'AliExpress', shipping: 'Global Shipping' },
    { id: 103, name: 'Home Decor Items', price: '$12.99', price_num: 12.99, image: null, link: 'https://www.aliexpress.com/item/home-decor-items/123456871', site: 'AliExpress', shipping: 'Global Shipping' },
    { id: 104, name: 'Fashion Accessories', price: '$6.99', price_num: 6.99, image: null, link: 'https://www.aliexpress.com/item/fashion-accessories/123456872', site: 'AliExpress', shipping: 'Global Shipping' },
    { id: 105, name: 'Kitchen Gadgets', price: '$9.99', price_num: 9.99, image: null, link: 'https://www.aliexpress.com/item/kitchen-gadgets/123456873', site: 'AliExpress', shipping: 'Global Shipping' },
    { id: 106, name: 'Beauty Products', price: '$7.99', price_num: 7.99, image: null, link: 'https://www.aliexpress.com/item/beauty-products/123456874', site: 'AliExpress', shipping: 'Global Shipping' },
    { id: 107, name: 'Phone Cases', price: '$4.99', price_num: 4.99, image: null, link: 'https://www.aliexpress.com/item/phone-cases/123456875', site: 'AliExpress', shipping: 'Global Shipping' },
    { id: 108, name: 'Jewelry Pieces', price: '$5.99', price_num: 5.99, image: null, link: 'https://www.aliexpress.com/item/jewelry-pieces/123456876', site: 'AliExpress', shipping: 'Global Shipping' },
    { id: 109, name: 'Tech Accessories', price: '$11.99', price_num: 11.99, image: null, link: 'https://www.aliexpress.com/item/tech-accessories/123456877', site: 'AliExpress', shipping: 'Global Shipping' },
    { id: 110, name: 'Home Organization', price: '$10.99', price_num: 10.99, image: null, link: 'https://www.aliexpress.com/item/home-organization/123456878', site: 'AliExpress', shipping: 'Global Shipping' },
  ],
  'Macy\'s': [
    { id: 111, name: 'Designer Handbag', price: '$199.99', price_num: 199.99, image: null, link: 'https://www.macys.com/designer-handbag/123456879', site: 'Macy\'s', shipping: 'Free Shipping' },
    { id: 112, name: 'Fashion Watch', price: '$149.99', price_num: 149.99, image: null, link: 'https://www.macys.com/fashion-watch/123456880', site: 'Macy\'s', shipping: 'Free Shipping' },
    { id: 113, name: 'Perfume Set', price: '$79.99', price_num: 79.99, image: null, link: 'https://www.macys.com/perfume-set/123456881', site: 'Macy\'s', shipping: 'Free Shipping' },
    { id: 114, name: 'Designer Sunglasses', price: '$129.99', price_num: 129.99, image: null, link: 'https://www.macys.com/designer-sunglasses/123456882', site: 'Macy\'s', shipping: 'Free Shipping' },
    { id: 115, name: 'Jewelry Set', price: '$89.99', price_num: 89.99, image: null, link: 'https://www.macys.com/jewelry-set/123456883', site: 'Macy\'s', shipping: 'Free Shipping' },
    { id: 116, name: 'Designer Wallet', price: '$99.99', price_num: 99.99, image: null, link: 'https://www.macys.com/designer-wallet/123456884', site: 'Macy\'s', shipping: 'Free Shipping' },
    { id: 117, name: 'Fashion Scarf', price: '$39.99', price_num: 39.99, image: null, link: 'https://www.macys.com/fashion-scarf/123456885', site: 'Macy\'s', shipping: 'Free Shipping' },
    { id: 118, name: 'Designer Belt', price: '$79.99', price_num: 79.99, image: null, link: 'https://www.macys.com/designer-belt/123456886', site: 'Macy\'s', shipping: 'Free Shipping' },
    { id: 119, name: 'Luxury Candle', price: '$29.99', price_num: 29.99, image: null, link: 'https://www.macys.com/luxury-candle/123456887', site: 'Macy\'s', shipping: 'Free Shipping' },
    { id: 120, name: 'Designer Keychain', price: '$19.99', price_num: 19.99, image: null, link: 'https://www.macys.com/designer-keychain/123456888', site: 'Macy\'s', shipping: 'Free Shipping' },
  ],
  'Lowe\'s': [
    { id: 121, name: 'Paint Gallon', price: '$34.99', price_num: 34.99, image: null, link: 'https://www.lowes.com/paint-gallon/123456889', site: 'Lowe\'s', shipping: 'Free Shipping' },
    { id: 122, name: 'Hardware Tool Set', price: '$49.99', price_num: 49.99, image: null, link: 'https://www.lowes.com/hardware-tool-set/123456890', site: 'Lowe\'s', shipping: 'Free Shipping' },
    { id: 123, name: 'Garden Hose', price: '$24.99', price_num: 24.99, image: null, link: 'https://www.lowes.com/garden-hose/123456891', site: 'Lowe\'s', shipping: 'Free Shipping' },
    { id: 124, name: 'Light Bulb Pack', price: '$12.99', price_num: 12.99, image: null, link: 'https://www.lowes.com/light-bulb-pack/123456892', site: 'Lowe\'s', shipping: 'Free Shipping' },
    { id: 125, name: 'Paint Brush Kit', price: '$18.99', price_num: 18.99, image: null, link: 'https://www.lowes.com/paint-brush-kit/123456893', site: 'Lowe\'s', shipping: 'Free Shipping' },
    { id: 126, name: 'Extension Ladder', price: '$89.99', price_num: 89.99, image: null, link: 'https://www.lowes.com/extension-ladder/123456894', site: 'Lowe\'s', shipping: 'Free Shipping' },
    { id: 127, name: 'Tool Storage Box', price: '$39.99', price_num: 39.99, image: null, link: 'https://www.lowes.com/tool-storage-box/123456895', site: 'Lowe\'s', shipping: 'Free Shipping' },
    { id: 128, name: 'Garden Shovel', price: '$14.99', price_num: 14.99, image: null, link: 'https://www.lowes.com/garden-shovel/123456896', site: 'Lowe\'s', shipping: 'Free Shipping' },
    { id: 129, name: 'Paint Roller', price: '$8.99', price_num: 8.99, image: null, link: 'https://www.lowes.com/paint-roller/123456897', site: 'Lowe\'s', shipping: 'Free Shipping' },
    { id: 130, name: 'Hardware Screws Pack', price: '$6.99', price_num: 6.99, image: null, link: 'https://www.lowes.com/hardware-screws-pack/123456898', site: 'Lowe\'s', shipping: 'Free Shipping' },
  ],
  Shein: [
    { id: 131, name: 'Trendy Top', price: '$12.99', price_num: 12.99, image: null, link: 'https://www.shein.com/trendy-top/123456899', site: 'Shein', shipping: 'Free Shipping' },
    { id: 132, name: 'Fashion Dress', price: '$19.99', price_num: 19.99, image: null, link: 'https://www.shein.com/fashion-dress/123456900', site: 'Shein', shipping: 'Free Shipping' },
    { id: 133, name: 'Casual Pants', price: '$15.99', price_num: 15.99, image: null, link: 'https://www.shein.com/casual-pants/123456901', site: 'Shein', shipping: 'Free Shipping' },
    { id: 134, name: 'Stylish Jacket', price: '$24.99', price_num: 24.99, image: null, link: 'https://www.shein.com/stylish-jacket/123456902', site: 'Shein', shipping: 'Free Shipping' },
    { id: 135, name: 'Fashion Shoes', price: '$29.99', price_num: 29.99, image: null, link: 'https://www.shein.com/fashion-shoes/123456903', site: 'Shein', shipping: 'Free Shipping' },
    { id: 136, name: 'Trendy Accessories', price: '$8.99', price_num: 8.99, image: null, link: 'https://www.shein.com/trendy-accessories/123456904', site: 'Shein', shipping: 'Free Shipping' },
    { id: 137, name: 'Fashion Bag', price: '$16.99', price_num: 16.99, image: null, link: 'https://www.shein.com/fashion-bag/123456905', site: 'Shein', shipping: 'Free Shipping' },
    { id: 138, name: 'Stylish Jewelry', price: '$9.99', price_num: 9.99, image: null, link: 'https://www.shein.com/stylish-jewelry/123456906', site: 'Shein', shipping: 'Free Shipping' },
    { id: 139, name: 'Trendy Hat', price: '$11.99', price_num: 11.99, image: null, link: 'https://www.shein.com/trendy-hat/123456907', site: 'Shein', shipping: 'Free Shipping' },
    { id: 140, name: 'Fashion Scarf', price: '$7.99', price_num: 7.99, image: null, link: 'https://www.shein.com/fashion-scarf/123456908', site: 'Shein', shipping: 'Free Shipping' },
  ],
  'Kohl\'s': [
    { id: 141, name: 'Branded T-Shirt', price: '$19.99', price_num: 19.99, image: null, link: 'https://www.kohls.com/branded-t-shirt/123456909', site: 'Kohl\'s', shipping: 'Free Shipping' },
    { id: 142, name: 'Fashion Jeans', price: '$39.99', price_num: 39.99, image: null, link: 'https://www.kohls.com/fashion-jeans/123456910', site: 'Kohl\'s', shipping: 'Free Shipping' },
    { id: 143, name: 'Casual Sneakers', price: '$49.99', price_num: 49.99, image: null, link: 'https://www.kohls.com/casual-sneakers/123456911', site: 'Kohl\'s', shipping: 'Free Shipping' },
    { id: 144, name: 'Branded Hoodie', price: '$44.99', price_num: 44.99, image: null, link: 'https://www.kohls.com/branded-hoodie/123456912', site: 'Kohl\'s', shipping: 'Free Shipping' },
    { id: 145, name: 'Fashion Jacket', price: '$59.99', price_num: 59.99, image: null, link: 'https://www.kohls.com/fashion-jacket/123456913', site: 'Kohl\'s', shipping: 'Free Shipping' },
    { id: 146, name: 'Branded Shorts', price: '$24.99', price_num: 24.99, image: null, link: 'https://www.kohls.com/branded-shorts/123456914', site: 'Kohl\'s', shipping: 'Free Shipping' },
    { id: 147, name: 'Casual Pants', price: '$34.99', price_num: 34.99, image: null, link: 'https://www.kohls.com/casual-pants/123456915', site: 'Kohl\'s', shipping: 'Free Shipping' },
    { id: 148, name: 'Fashion Dress', price: '$39.99', price_num: 39.99, image: null, link: 'https://www.kohls.com/fashion-dress/123456916', site: 'Kohl\'s', shipping: 'Free Shipping' },
    { id: 149, name: 'Branded Sweater', price: '$49.99', price_num: 49.99, image: null, link: 'https://www.kohls.com/branded-sweater/123456917', site: 'Kohl\'s', shipping: 'Free Shipping' },
    { id: 150, name: 'Fashion Accessories', price: '$14.99', price_num: 14.99, image: null, link: 'https://www.kohls.com/fashion-accessories/123456918', site: 'Kohl\'s', shipping: 'Free Shipping' },
  ],
  Sephora: [
    { id: 151, name: 'Luxury Foundation', price: '$49.99', price_num: 49.99, image: null, link: 'https://www.sephora.com/luxury-foundation/123456919', site: 'Sephora', shipping: 'Free Shipping' },
    { id: 152, name: 'Designer Perfume', price: '$89.99', price_num: 89.99, image: null, link: 'https://www.sephora.com/designer-perfume/123456920', site: 'Sephora', shipping: 'Free Shipping' },
    { id: 153, name: 'High-End Lipstick', price: '$29.99', price_num: 29.99, image: null, link: 'https://www.sephora.com/high-end-lipstick/123456921', site: 'Sephora', shipping: 'Free Shipping' },
    { id: 154, name: 'Luxury Skincare Set', price: '$79.99', price_num: 79.99, image: null, link: 'https://www.sephora.com/luxury-skincare-set/123456922', site: 'Sephora', shipping: 'Free Shipping' },
    { id: 155, name: 'Designer Mascara', price: '$24.99', price_num: 24.99, image: null, link: 'https://www.sephora.com/designer-mascara/123456923', site: 'Sephora', shipping: 'Free Shipping' },
    { id: 156, name: 'Luxury Eyeshadow Palette', price: '$59.99', price_num: 59.99, image: null, link: 'https://www.sephora.com/luxury-eyeshadow-palette/123456924', site: 'Sephora', shipping: 'Free Shipping' },
    { id: 157, name: 'High-End Serum', price: '$69.99', price_num: 69.99, image: null, link: 'https://www.sephora.com/high-end-serum/123456925', site: 'Sephora', shipping: 'Free Shipping' },
    { id: 158, name: 'Designer Blush', price: '$34.99', price_num: 34.99, image: null, link: 'https://www.sephora.com/designer-blush/123456926', site: 'Sephora', shipping: 'Free Shipping' },
    { id: 159, name: 'Luxury Face Mask', price: '$19.99', price_num: 19.99, image: null, link: 'https://www.sephora.com/luxury-face-mask/123456927', site: 'Sephora', shipping: 'Free Shipping' },
    { id: 160, name: 'High-End Cleanser', price: '$39.99', price_num: 39.99, image: null, link: 'https://www.sephora.com/high-end-cleanser/123456928', site: 'Sephora', shipping: 'Free Shipping' },
  ],
  Chewy: [
    { id: 161, name: 'Premium Dog Food', price: '$49.99', price_num: 49.99, image: null, link: 'https://www.chewy.com/premium-dog-food/123456929', site: 'Chewy', shipping: 'Free Shipping' },
    { id: 162, name: 'Cat Litter', price: '$24.99', price_num: 24.99, image: null, link: 'https://www.chewy.com/cat-litter/123456930', site: 'Chewy', shipping: 'Free Shipping' },
    { id: 163, name: 'Dog Toys Pack', price: '$19.99', price_num: 19.99, image: null, link: 'https://www.chewy.com/dog-toys-pack/123456931', site: 'Chewy', shipping: 'Free Shipping' },
    { id: 164, name: 'Cat Food', price: '$34.99', price_num: 34.99, image: null, link: 'https://www.chewy.com/cat-food/123456932', site: 'Chewy', shipping: 'Free Shipping' },
    { id: 165, name: 'Pet Bed', price: '$39.99', price_num: 39.99, image: null, link: 'https://www.chewy.com/pet-bed/123456933', site: 'Chewy', shipping: 'Free Shipping' },
    { id: 166, name: 'Dog Leash Set', price: '$14.99', price_num: 14.99, image: null, link: 'https://www.chewy.com/dog-leash-set/123456934', site: 'Chewy', shipping: 'Free Shipping' },
    { id: 167, name: 'Cat Scratching Post', price: '$29.99', price_num: 29.99, image: null, link: 'https://www.chewy.com/cat-scratching-post/123456935', site: 'Chewy', shipping: 'Free Shipping' },
    { id: 168, name: 'Pet Grooming Kit', price: '$24.99', price_num: 24.99, image: null, link: 'https://www.chewy.com/pet-grooming-kit/123456936', site: 'Chewy', shipping: 'Free Shipping' },
    { id: 169, name: 'Dog Treats', price: '$12.99', price_num: 12.99, image: null, link: 'https://www.chewy.com/dog-treats/123456937', site: 'Chewy', shipping: 'Free Shipping' },
    { id: 170, name: 'Pet Carrier', price: '$44.99', price_num: 44.99, image: null, link: 'https://www.chewy.com/pet-carrier/123456938', site: 'Chewy', shipping: 'Free Shipping' },
  ],
  Etsy: [
    { id: 171, name: 'Handmade Jewelry', price: '$34.99', price_num: 34.99, image: null, link: 'https://www.etsy.com/listing/handmade-jewelry/123456939', site: 'Etsy', shipping: 'Free Shipping' },
    { id: 172, name: 'Custom Art Print', price: '$24.99', price_num: 24.99, image: null, link: 'https://www.etsy.com/listing/custom-art-print/123456940', site: 'Etsy', shipping: 'Free Shipping' },
    { id: 173, name: 'Handmade Soap Set', price: '$19.99', price_num: 19.99, image: null, link: 'https://www.etsy.com/listing/handmade-soap-set/123456941', site: 'Etsy', shipping: 'Free Shipping' },
    { id: 174, name: 'Vintage Poster', price: '$29.99', price_num: 29.99, image: null, link: 'https://www.etsy.com/listing/vintage-poster/123456942', site: 'Etsy', shipping: 'Free Shipping' },
    { id: 175, name: 'Handmade Candle', price: '$16.99', price_num: 16.99, image: null, link: 'https://www.etsy.com/listing/handmade-candle/123456943', site: 'Etsy', shipping: 'Free Shipping' },
    { id: 176, name: 'Custom T-Shirt', price: '$24.99', price_num: 24.99, image: null, link: 'https://www.etsy.com/listing/custom-t-shirt/123456944', site: 'Etsy', shipping: 'Free Shipping' },
    { id: 177, name: 'Handmade Pottery', price: '$39.99', price_num: 39.99, image: null, link: 'https://www.etsy.com/listing/handmade-pottery/123456945', site: 'Etsy', shipping: 'Free Shipping' },
    { id: 178, name: 'Vintage Decor', price: '$19.99', price_num: 19.99, image: null, link: 'https://www.etsy.com/listing/vintage-decor/123456946', site: 'Etsy', shipping: 'Free Shipping' },
    { id: 179, name: 'Handmade Bag', price: '$44.99', price_num: 44.99, image: null, link: 'https://www.etsy.com/listing/handmade-bag/123456947', site: 'Etsy', shipping: 'Free Shipping' },
    { id: 180, name: 'Custom Wall Art', price: '$34.99', price_num: 34.99, image: null, link: 'https://www.etsy.com/listing/custom-wall-art/123456948', site: 'Etsy', shipping: 'Free Shipping' },
  ],
  Newegg: [
    { id: 181, name: 'Gaming Graphics Card', price: '$499.99', price_num: 499.99, image: null, link: 'https://www.newegg.com/gaming-graphics-card/123456949', site: 'Newegg', shipping: 'Free Shipping' },
    { id: 182, name: 'Gaming Monitor', price: '$299.99', price_num: 299.99, image: null, link: 'https://www.newegg.com/gaming-monitor/123456950', site: 'Newegg', shipping: 'Free Shipping' },
    { id: 183, name: 'Mechanical Keyboard', price: '$89.99', price_num: 89.99, image: null, link: 'https://www.newegg.com/mechanical-keyboard/123456951', site: 'Newegg', shipping: 'Free Shipping' },
    { id: 184, name: 'Gaming Mouse', price: '$59.99', price_num: 59.99, image: null, link: 'https://www.newegg.com/gaming-mouse/123456952', site: 'Newegg', shipping: 'Free Shipping' },
    { id: 185, name: 'PC Case', price: '$79.99', price_num: 79.99, image: null, link: 'https://www.newegg.com/pc-case/123456953', site: 'Newegg', shipping: 'Free Shipping' },
    { id: 186, name: 'Power Supply Unit', price: '$89.99', price_num: 89.99, image: null, link: 'https://www.newegg.com/power-supply-unit/123456954', site: 'Newegg', shipping: 'Free Shipping' },
    { id: 187, name: 'RAM Memory Kit', price: '$129.99', price_num: 129.99, image: null, link: 'https://www.newegg.com/ram-memory-kit/123456955', site: 'Newegg', shipping: 'Free Shipping' },
    { id: 188, name: 'SSD Storage', price: '$79.99', price_num: 79.99, image: null, link: 'https://www.newegg.com/ssd-storage/123456956', site: 'Newegg', shipping: 'Free Shipping' },
    { id: 189, name: 'CPU Cooler', price: '$49.99', price_num: 49.99, image: null, link: 'https://www.newegg.com/cpu-cooler/123456957', site: 'Newegg', shipping: 'Free Shipping' },
    { id: 190, name: 'Motherboard', price: '$199.99', price_num: 199.99, image: null, link: 'https://www.newegg.com/motherboard/123456958', site: 'Newegg', shipping: 'Free Shipping' },
  ],
  Zappos: [
    { id: 191, name: 'Running Shoes', price: '$119.99', price_num: 119.99, image: null, link: 'https://www.zappos.com/running-shoes/123456959', site: 'Zappos', shipping: 'Free Shipping' },
    { id: 192, name: 'Casual Sneakers', price: '$89.99', price_num: 89.99, image: null, link: 'https://www.zappos.com/casual-sneakers/123456960', site: 'Zappos', shipping: 'Free Shipping' },
    { id: 193, name: 'Dress Shoes', price: '$149.99', price_num: 149.99, image: null, link: 'https://www.zappos.com/dress-shoes/123456961', site: 'Zappos', shipping: 'Free Shipping' },
    { id: 194, name: 'Boots', price: '$179.99', price_num: 179.99, image: null, link: 'https://www.zappos.com/boots/123456962', site: 'Zappos', shipping: 'Free Shipping' },
    { id: 195, name: 'Sandals', price: '$49.99', price_num: 49.99, image: null, link: 'https://www.zappos.com/sandals/123456963', site: 'Zappos', shipping: 'Free Shipping' },
    { id: 196, name: 'Athletic Shoes', price: '$99.99', price_num: 99.99, image: null, link: 'https://www.zappos.com/athletic-shoes/123456964', site: 'Zappos', shipping: 'Free Shipping' },
    { id: 197, name: 'Fashion Sneakers', price: '$129.99', price_num: 129.99, image: null, link: 'https://www.zappos.com/fashion-sneakers/123456965', site: 'Zappos', shipping: 'Free Shipping' },
    { id: 198, name: 'Hiking Boots', price: '$159.99', price_num: 159.99, image: null, link: 'https://www.zappos.com/hiking-boots/123456966', site: 'Zappos', shipping: 'Free Shipping' },
    { id: 199, name: 'Slip-On Shoes', price: '$69.99', price_num: 69.99, image: null, link: 'https://www.zappos.com/slip-on-shoes/123456967', site: 'Zappos', shipping: 'Free Shipping' },
    { id: 200, name: 'Formal Shoes', price: '$139.99', price_num: 139.99, image: null, link: 'https://www.zappos.com/formal-shoes/123456968', site: 'Zappos', shipping: 'Free Shipping' },
  ],
};

// 모든 상품을 하나의 배열로 반환 (검색 결과용)
export const getAllMockProducts = () => {
  return Object.values(mockProducts).flat();
};

// 스토어별로 상품 가져오기
export const getMockProductsByStore = (storeName) => {
  return mockProducts[storeName] || [];
};

// 검색어로 필터링
export const searchMockProducts = (query) => {
  const allProducts = getAllMockProducts();
  const queryLower = query.toLowerCase();
  return allProducts.filter(product => 
    product.name.toLowerCase().includes(queryLower) ||
    product.site.toLowerCase().includes(queryLower)
  );
};
