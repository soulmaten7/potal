-- ============================================================
-- POTAL Security Fix: RLS Activation & Policy Enforcement
-- 생성일: 2026-04-01
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ⚠️ 반드시 순서대로 실행할 것
-- ============================================================

-- ============================================================
-- PART 1: CRITICAL — FOR ALL USING (true) 정책 교체
-- 이 테이블들은 RLS가 켜져있지만 정책이 모든 접근 허용
-- anon key로 누구나 읽기/쓰기/삭제 가능한 상태
-- ============================================================

-- 1-1. seller_branding (셀러 브랜딩 설정 — 셀러별 격리 필요)
DROP POLICY IF EXISTS seller_branding_service_all ON seller_branding;
CREATE POLICY "seller_branding_select_own" ON seller_branding
  FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "seller_branding_insert_own" ON seller_branding
  FOR INSERT WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "seller_branding_update_own" ON seller_branding
  FOR UPDATE USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "seller_branding_delete_own" ON seller_branding
  FOR DELETE USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- 1-2. tax_exemption_certificates (면세 인증서 — 셀러별 격리 필요)
DROP POLICY IF EXISTS tax_exempt_certs_service_all ON tax_exemption_certificates;
CREATE POLICY "tax_exempt_certs_select_own" ON tax_exemption_certificates
  FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "tax_exempt_certs_insert_own" ON tax_exemption_certificates
  FOR INSERT WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "tax_exempt_certs_update_own" ON tax_exemption_certificates
  FOR UPDATE USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- 1-3. tax_exemption_usage_log (면세 사용 로그)
DROP POLICY IF EXISTS exemption_usage_service_all ON tax_exemption_usage_log;
CREATE POLICY "exemption_usage_select_own" ON tax_exemption_usage_log
  FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "exemption_usage_insert_own" ON tax_exemption_usage_log
  FOR INSERT WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- 1-4. tax_payment_log (세금 납부 로그)
DROP POLICY IF EXISTS tax_payment_service_all ON tax_payment_log;
CREATE POLICY "tax_payment_select_own" ON tax_payment_log
  FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "tax_payment_insert_own" ON tax_payment_log
  FOR INSERT WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- 1-5. export_license_applications (수출 허가 신청)
DROP POLICY IF EXISTS export_license_service_all ON export_license_applications;
CREATE POLICY "export_license_select_own" ON export_license_applications
  FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "export_license_insert_own" ON export_license_applications
  FOR INSERT WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "export_license_update_own" ON export_license_applications
  FOR UPDATE USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- 1-6. customs_clearance_status (통관 상태)
DROP POLICY IF EXISTS customs_status_service_all ON customs_clearance_status;
CREATE POLICY "customs_status_select_own" ON customs_clearance_status
  FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "customs_status_insert_own" ON customs_clearance_status
  FOR INSERT WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- 1-7. erp_connections (ERP 연동 — 민감 자격증명 포함)
DROP POLICY IF EXISTS erp_conn_service_all ON erp_connections;
CREATE POLICY "erp_conn_select_own" ON erp_connections
  FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "erp_conn_insert_own" ON erp_connections
  FOR INSERT WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "erp_conn_update_own" ON erp_connections
  FOR UPDATE USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "erp_conn_delete_own" ON erp_connections
  FOR DELETE USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- 1-8. marketplace_connections (마켓플레이스 연동 — 민감 자격증명 포함)
DROP POLICY IF EXISTS marketplace_conn_service_all ON marketplace_connections;
CREATE POLICY "marketplace_conn_select_own" ON marketplace_connections
  FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "marketplace_conn_insert_own" ON marketplace_connections
  FOR INSERT WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "marketplace_conn_update_own" ON marketplace_connections
  FOR UPDATE USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "marketplace_conn_delete_own" ON marketplace_connections
  FOR DELETE USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- 1-9. seller_nexus_tracking (셀러 Nexus 추적)
DROP POLICY IF EXISTS nexus_tracking_service_all ON seller_nexus_tracking;
CREATE POLICY "nexus_tracking_select_own" ON seller_nexus_tracking
  FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "nexus_tracking_insert_own" ON seller_nexus_tracking
  FOR INSERT WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "nexus_tracking_update_own" ON seller_nexus_tracking
  FOR UPDATE USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- 1-10. whitelabel_configs (화이트라벨 설정)
DROP POLICY IF EXISTS whitelabel_configs_service_all ON whitelabel_configs;
CREATE POLICY "whitelabel_select_own" ON whitelabel_configs
  FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "whitelabel_insert_own" ON whitelabel_configs
  FOR INSERT WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "whitelabel_update_own" ON whitelabel_configs
  FOR UPDATE USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- 1-11. partner_accounts (파트너 계정)
DROP POLICY IF EXISTS partner_accounts_service_all ON partner_accounts;
CREATE POLICY "partner_accounts_select_own" ON partner_accounts
  FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "partner_accounts_insert_own" ON partner_accounts
  FOR INSERT WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "partner_accounts_update_own" ON partner_accounts
  FOR UPDATE USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- 1-12. partner_referrals (파트너 추천)
DROP POLICY IF EXISTS partner_referrals_service_all ON partner_referrals;
CREATE POLICY "partner_referrals_select_own" ON partner_referrals
  FOR SELECT USING (
    referrer_seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
    OR referred_seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
  );
CREATE POLICY "partner_referrals_insert_own" ON partner_referrals
  FOR INSERT WITH CHECK (referrer_seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- 1-13. verification_logs (인증 로그)
DROP POLICY IF EXISTS "service_access_verification" ON verification_logs;
CREATE POLICY "verification_logs_select_own" ON verification_logs
  FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- 1-14. support_chat_logs (지원 채팅 로그 — 민감 대화 내용)
DROP POLICY IF EXISTS "service_access_chat_logs" ON support_chat_logs;
CREATE POLICY "chat_logs_select_own" ON support_chat_logs
  FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "chat_logs_insert_own" ON support_chat_logs
  FOR INSERT WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- 1-15. support_chat_feedback (채팅 피드백)
DROP POLICY IF EXISTS "service_access_chat_feedback" ON support_chat_feedback;
CREATE POLICY "chat_feedback_select_own" ON support_chat_feedback
  FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "chat_feedback_insert_own" ON support_chat_feedback
  FOR INSERT WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- 1-16. support_faq_analytics (FAQ 분석 — 서버 전용)
DROP POLICY IF EXISTS "service_access_faq_analytics" ON support_faq_analytics;
-- 서버(service_role)만 접근. anon/authenticated는 접근 불가.
-- RLS ON + 정책 없음 = 기본 차단 (service_role은 RLS 우회)


-- ============================================================
-- PART 2: HIGH — RLS 미활성화 테이블 중 민감 데이터 포함
-- ============================================================

-- 2-1. profiles (사용자 프로필 — B2C 시절 테이블)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- 2-2. user_roles (사용자 역할 — 자기 역할만 조회 가능)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON user_roles
  FOR SELECT USING (user_id = auth.uid());

-- 2-3. team_invitations (팀 초대 — 이메일 주소 포함)
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_invitations_select_own" ON team_invitations
  FOR SELECT USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
    OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
CREATE POLICY "team_invitations_insert_own" ON team_invitations
  FOR INSERT WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- 2-4. seller_webhooks (웹훅 URL + 시크릿 포함 — 민감)
ALTER TABLE seller_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seller_webhooks_select_own" ON seller_webhooks
  FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "seller_webhooks_insert_own" ON seller_webhooks
  FOR INSERT WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "seller_webhooks_update_own" ON seller_webhooks
  FOR UPDATE USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "seller_webhooks_delete_own" ON seller_webhooks
  FOR DELETE USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- 2-5. api_key_ip_rules (API 키 IP 규칙)
ALTER TABLE api_key_ip_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ip_rules_select_own" ON api_key_ip_rules
  FOR SELECT USING (
    api_key_id IN (
      SELECT ak.id FROM api_keys ak
      JOIN sellers s ON ak.seller_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );
CREATE POLICY "ip_rules_insert_own" ON api_key_ip_rules
  FOR INSERT WITH CHECK (
    api_key_id IN (
      SELECT ak.id FROM api_keys ak
      JOIN sellers s ON ak.seller_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );
CREATE POLICY "ip_rules_delete_own" ON api_key_ip_rules
  FOR DELETE USING (
    api_key_id IN (
      SELECT ak.id FROM api_keys ak
      JOIN sellers s ON ak.seller_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

-- 2-6. notification_preferences (알림 설정)
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_prefs_select_own" ON notification_preferences
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notif_prefs_upsert_own" ON notification_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "notif_prefs_update_own" ON notification_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- 2-7. report_schedules (보고서 스케줄)
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "report_sched_select_own" ON report_schedules
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "report_sched_upsert_own" ON report_schedules
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "report_sched_update_own" ON report_schedules
  FOR UPDATE USING (user_id = auth.uid());

-- 2-8. enterprise_leads (기업 리드 — 회사 정보/연락처 포함)
ALTER TABLE enterprise_leads ENABLE ROW LEVEL SECURITY;
-- 서버(service_role)만 접근. anon/authenticated 직접 접근 불가.

-- 2-9. screening_logs (제재 심사 로그 — 셀러별)
ALTER TABLE screening_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "screening_logs_select_own" ON screening_logs
  FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- 2-10. email_sent_logs (이메일 발송 로그 — 이메일 주소 포함)
ALTER TABLE email_sent_logs ENABLE ROW LEVEL SECURITY;
-- 서버(service_role)만 접근.

-- 2-11. newsletter_subscribers (뉴스레터 구독자 — 이메일 포함)
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
-- 서버(service_role)만 접근.

-- 2-12. batch_jobs (배치 작업 데이터)
ALTER TABLE batch_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "batch_jobs_select_own" ON batch_jobs
  FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- 2-13. locked_rates / rate_locks (견적 데이터)
ALTER TABLE locked_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locked_rates_select_own" ON locked_rates
  FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

ALTER TABLE rate_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rate_locks_select_own" ON rate_locks
  FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- 2-14. classification_feedback (분류 피드백)
ALTER TABLE classification_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classification_fb_select_own" ON classification_feedback
  FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- 2-15. api_audit_log (API 감사 로그)
ALTER TABLE api_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_audit_select_own" ON api_audit_log
  FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- 2-16. webhook_events (웹훅 이벤트)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhook_events_select_own" ON webhook_events
  FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- 2-17. notifications (알림)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- 2-18. hs_classification_audit (분류 감사 추적)
ALTER TABLE hs_classification_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classification_audit_select_own" ON hs_classification_audit
  FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- 2-19. search_logs / search_signals (검색 로그 — B2C, 서버 전용)
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_signals ENABLE ROW LEVEL SECURITY;
-- 서버(service_role)만 접근.

-- 2-20. health_check_logs (시스템 로그 — 서버 전용)
ALTER TABLE health_check_logs ENABLE ROW LEVEL SECURITY;
-- 서버(service_role)만 접근.

-- 2-21. archive_audit_logs (감사 아카이브 — 서버 전용)
ALTER TABLE archive_audit_logs ENABLE ROW LEVEL SECURITY;
-- 서버(service_role)만 접근.

-- 2-22. certification_waitlist (인증 대기자 — 이메일 포함 가능)
ALTER TABLE certification_waitlist ENABLE ROW LEVEL SECURITY;
-- 서버(service_role)만 접근.

-- 2-23. role_permissions (역할 권한 — 읽기 전용 참조)
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "role_permissions_select_all" ON role_permissions
  FOR SELECT USING (true);
-- 역할 정의는 읽기 전용 공개 참조 테이블


-- ============================================================
-- PART 3: MEDIUM — 공개 참조 데이터 (읽기 전용 정책)
-- 이 테이블들은 관세/세금/국가 참조 데이터로 공개 읽기 OK
-- 하지만 쓰기는 서버(service_role)만 가능해야 함
-- ============================================================

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "countries_public_read" ON countries FOR SELECT USING (true);

ALTER TABLE vat_gst_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vat_rates_public_read" ON vat_gst_rates FOR SELECT USING (true);

ALTER TABLE customs_fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customs_fees_public_read" ON customs_fees FOR SELECT USING (true);

ALTER TABLE de_minimis_thresholds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "de_minimis_public_read" ON de_minimis_thresholds FOR SELECT USING (true);

ALTER TABLE de_minimis_exceptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "de_minimis_exc_public_read" ON de_minimis_exceptions FOR SELECT USING (true);

ALTER TABLE fta_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fta_agreements_public_read" ON fta_agreements FOR SELECT USING (true);

ALTER TABLE fta_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fta_members_public_read" ON fta_members FOR SELECT USING (true);

ALTER TABLE embargo_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "embargo_public_read" ON embargo_programs FOR SELECT USING (true);

ALTER TABLE sanctions_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sanctions_public_read" ON sanctions_entries FOR SELECT USING (true);

ALTER TABLE country_regulatory_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "regulatory_notes_public_read" ON country_regulatory_notes FOR SELECT USING (true);

ALTER TABLE macmap_min_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "macmap_min_public_read" ON macmap_min_rates FOR SELECT USING (true);

ALTER TABLE macmap_agr_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "macmap_agr_public_read" ON macmap_agr_rates FOR SELECT USING (true);

ALTER TABLE macmap_ntlc_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "macmap_ntlc_public_read" ON macmap_ntlc_rates FOR SELECT USING (true);

ALTER TABLE macmap_trade_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "macmap_trade_public_read" ON macmap_trade_agreements FOR SELECT USING (true);

ALTER TABLE dangerous_goods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dangerous_goods_public_read" ON dangerous_goods FOR SELECT USING (true);

ALTER TABLE restricted_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "restricted_items_public_read" ON restricted_items FOR SELECT USING (true);

ALTER TABLE product_specific_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "psr_public_read" ON product_specific_rules FOR SELECT USING (true);

ALTER TABLE export_control_chart ENABLE ROW LEVEL SECURITY;
CREATE POLICY "export_control_public_read" ON export_control_chart FOR SELECT USING (true);

ALTER TABLE us_state_tax_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "us_state_tax_public_read" ON us_state_tax_rates FOR SELECT USING (true);

ALTER TABLE us_sales_tax_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "us_sales_tax_public_read" ON us_sales_tax_rates FOR SELECT USING (true);

ALTER TABLE vat_product_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vat_product_public_read" ON vat_product_rates FOR SELECT USING (true);

ALTER TABLE digital_services_tax ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dst_public_read" ON digital_services_tax FOR SELECT USING (true);

ALTER TABLE sub_national_taxes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sub_national_public_read" ON sub_national_taxes FOR SELECT USING (true);

ALTER TABLE trade_remedy_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trade_remedy_cases_public_read" ON trade_remedy_cases FOR SELECT USING (true);

ALTER TABLE trade_remedy_duties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trade_remedy_duties_public_read" ON trade_remedy_duties FOR SELECT USING (true);

ALTER TABLE trade_remedy_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trade_remedy_products_public_read" ON trade_remedy_products FOR SELECT USING (true);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exchange_rates_public_read" ON exchange_rates FOR SELECT USING (true);

ALTER TABLE exchange_rate_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exchange_rate_history_public_read" ON exchange_rate_history FOR SELECT USING (true);

ALTER TABLE hs_price_break_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "price_break_public_read" ON hs_price_break_rules FOR SELECT USING (true);

ALTER TABLE hs_expansion_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expansion_rules_public_read" ON hs_expansion_rules FOR SELECT USING (true);

ALTER TABLE product_hs_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_hs_public_read" ON product_hs_mappings FOR SELECT USING (true);

ALTER TABLE gov_tariff_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gov_tariff_public_read" ON gov_tariff_schedules FOR SELECT USING (true);

ALTER TABLE duty_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "duty_rates_public_read" ON duty_rates FOR SELECT USING (true);

ALTER TABLE additional_tariffs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "additional_tariffs_public_read" ON additional_tariffs FOR SELECT USING (true);

ALTER TABLE country_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "country_profiles_public_read" ON country_profiles FOR SELECT USING (true);

ALTER TABLE vat_validation_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vat_cache_public_read" ON vat_validation_cache FOR SELECT USING (true);

ALTER TABLE precomputed_hs10_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hs10_candidates_public_read" ON precomputed_hs10_candidates FOR SELECT USING (true);

ALTER TABLE precomputed_landed_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "precomputed_lc_public_read" ON precomputed_landed_costs FOR SELECT USING (true);

ALTER TABLE gri_classification_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gri_cache_public_read" ON gri_classification_cache FOR SELECT USING (true);

ALTER TABLE gri_conflict_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gri_conflicts_public_read" ON gri_conflict_patterns FOR SELECT USING (true);


-- ============================================================
-- PART 4: 나머지 서버 전용 테이블
-- ============================================================

ALTER TABLE tariff_update_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_error_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_update_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE divergence_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE secretary_inbox_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantee_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions_load_meta ENABLE ROW LEVEL SECURITY;
-- 정책 없음 = RLS ON 상태에서 기본 차단
-- service_role key는 RLS를 우회하므로 서버 코드 정상 작동


-- ============================================================
-- PART 5: 이미 RLS ON + 정책 없음인 테이블 확인 (018 마이그레이션)
-- wdc_products, hs_code_mappings, hs_keyword_rules
-- 공개 참조 데이터이므로 읽기 정책 추가
-- ============================================================

CREATE POLICY "wdc_products_public_read" ON wdc_products FOR SELECT USING (true);
CREATE POLICY "hs_code_mappings_public_read" ON hs_code_mappings FOR SELECT USING (true);
CREATE POLICY "hs_keyword_rules_public_read" ON hs_keyword_rules FOR SELECT USING (true);


-- ============================================================
-- 완료 확인 쿼리 (실행 후 결과 확인용)
-- ============================================================

-- 모든 테이블의 RLS 상태 확인
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity ASC, tablename;
