-- 006: 셀러 온보딩 필드 추가 (website, platform)
-- 세션 26: 셀러 가입 시 웹사이트, 플랫폼 정보 수집

ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS platform TEXT;

COMMENT ON COLUMN public.sellers.website IS '셀러 웹사이트/스토어 URL';
COMMENT ON COLUMN public.sellers.platform IS '이커머스 플랫폼 (shopify, woocommerce, magento, bigcommerce, custom, other)';
