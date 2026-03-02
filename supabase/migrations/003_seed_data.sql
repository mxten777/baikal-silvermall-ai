-- =============================================================
-- Migration: 003_seed_data.sql
-- 초기 시드 데이터 (카테고리 + 샘플 상품 30개)
-- =============================================================

-- ─────────────────────────────────────────
-- 카테고리
-- ─────────────────────────────────────────
INSERT INTO public.categories (slug, name, description, sort_order) VALUES
('walking-aids',        '보행보조용구',   '지팡이·보행기·휠체어 등 이동 보조 용구',     1),
('bath-hygiene',        '목욕위생용구',   '샤워의자·목욕 리프트 등 위생 보조 용구',     2),
('bed-care',            '침상케어',       '침대·이동변기·욕창예방 매트리스·체위변환',   3),
('pressure-sore',       '욕창예방용구',   '에어 매트리스·체위변환 쿠션·저반발 베개',    4),
('meal-assist',         '식사보조용구',   '기울어진 식판·구부러진 숟가락·시루젓가락',   5),
('care-assist',         '케어보조용구',   '이동 슬링·호이스트·리프트', 6),
('health-management',   '건강관리용품',   '혈압계·혈당계·체온계 등',                      7);

-- ─────────────────────────────────────────
-- 브랜드
-- ─────────────────────────────────────────
INSERT INTO public.brands (name) VALUES
('케어맥스'),('실버케어'),('메디하우스'),('안심케어'),('건강나래');

-- ─────────────────────────────────────────
-- 태그
-- ─────────────────────────────────────────
INSERT INTO public.tags (name, label) VALUES
('mobility_low',        '거동불편'),
('mobility_medium',     '부분거동'),
('bedsore_risk_high',   '욕창위험높음'),
('bedsore_risk_medium', '욕창위험중간'),
('toileting_assist',    '배변도움필요'),
('meal_assist',         '식사도움필요'),
('cognitive_decline',   '인지저하'),
('fall_risk',           '낙상위험'),
('grade_1_2',           '1~2등급 적합'),
('grade_3_5',           '3~5등급 적합');

-- ─────────────────────────────────────────
-- 상품 30개 (active)
-- ─────────────────────────────────────────
WITH cat AS (
  SELECT id, slug FROM public.categories
),
br AS (
  SELECT id, name FROM public.brands
)
INSERT INTO public.products (
  category_id, brand_id, slug, name, description,
  price, sale_price, product_type, is_insurance,
  status, shipping_info, care_info
)
SELECT c.id, b.id, p.slug, p.name, p.descr,
       p.price, p.sale_price, p.ptype::product_type,
       p.insured, 'active'::product_status,
       '{"free_threshold":30000,"base_fee":3000,"return_fee":3000}'::jsonb,
       p.care_info::jsonb
FROM (VALUES
  -- 보행보조
  ('walking-aids','케어맥스','cane-t-handle','T형 지팡이 400g 경량','노인용 T형 알루미늄 지팡이, 높이조절 가능',29000,24900,'purchase',true,'{"suitable_grades":["3","4","5"],"target_conditions":["mobility_low","fall_risk"]}'),
  ('walking-aids','실버케어','quad-cane-4leg','4각 지팡이 안정형','사방 4개 접지점으로 안정감 극대화',38000,32900,'purchase',true,'{"suitable_grades":["3","4","5"],"target_conditions":["mobility_low","fall_risk"]}'),
  ('walking-aids','메디하우스','rollator-4wheel','4륜 보행기 브레이크형','시트·바구니 포함, 접이식 4륜 보행기',189000,169000,'purchase',true,'{"suitable_grades":["1","2","3"],"target_conditions":["mobility_low","fall_risk"]}'),
  ('walking-aids','안심케어','wheelchair-standard','표준형 수동 휠체어','등받이 접이식, 발판 분리, 18인치 시트',320000,289000,'both',true,'{"suitable_grades":["1","2","3"],"target_conditions":["mobility_low"]}'),
  ('walking-aids','건강나래','wheelchair-lightweight','경량 휠체어 12kg','알루미늄 경량 프레임 자가추진형',420000,389000,'both',true,'{"suitable_grades":["1","2"],"target_conditions":["mobility_low"]}'),
  -- 목욕위생
  ('bath-hygiene','케어맥스','shower-chair-basic','목욕의자 기본형','미끄럼방지 PVC 목욕의자, 등받이 포함',39000,34900,'purchase',true,'{"suitable_grades":["3","4","5"],"target_conditions":["mobility_low","fall_risk"]}'),
  ('bath-hygiene','실버케어','shower-chair-armrest','팔걸이 목욕의자','팔걸이·등받이·미끄럼방지 발판 포함',65000,58000,'purchase',true,'{"suitable_grades":["2","3","4"],"target_conditions":["mobility_low"]}'),
  ('bath-hygiene','메디하우스','bath-board-120','목욕 판자 120cm','욕조 위 거치형 미끄럼방지 목욕 보드',49000,42000,'purchase',true,'{"suitable_grades":["3","4","5"],"target_conditions":["mobility_medium"]}'),
  ('bath-hygiene','안심케어','grab-bar-set','목욕 안전 손잡이 세트','벽부착형 스테인레스 손잡이 2P',68000,59000,'purchase',false,'{"suitable_grades":["3","4","5"],"target_conditions":["fall_risk"]}'),
  ('bath-hygiene','건강나래','portable-bidet-basic','이동식 좌변기 기본형','침상 옆 이동형 좌변기, 버킷 포함',89000,79000,'purchase',true,'{"suitable_grades":["3","4","5"],"target_conditions":["toileting_assist"]}'),
  -- 침상케어
  ('bed-care','케어맥스','overbed-table','이동식 식탁 테이블','높이조절 C자 오버베드 테이블',79000,69000,'purchase',false,'{"suitable_grades":["1","2","3"],"target_conditions":["mobility_low"]}'),
  ('bed-care','실버케어','bedrail-half','침대 반 난간','침대 측면 반난간, SUS 프레임',68000,59000,'purchase',true,'{"suitable_grades":["1","2","3","4"],"target_conditions":["fall_risk"]}'),
  ('bed-care','메디하우스','turning-sheet','체위변환 슬라이딩 시트','욕창 예방 & 이동 편의 슬라이딩 시트 2매',42000,37000,'purchase',true,'{"suitable_grades":["1","2"],"target_conditions":["bedsore_risk_high","mobility_low"]}'),
  ('bed-care','안심케어','positioning-wedge','체위변환 웨지 쿠션','옆으로 눕히기 쉬운 삼각 웨지 쿠션',55000,49000,'purchase',true,'{"suitable_grades":["1","2"],"target_conditions":["bedsore_risk_high"]}'),
  -- 욕창예방
  ('pressure-sore','케어맥스','air-mattress-standard','교대 압력 에어매트리스 표준','자동 교대 압력 에어 매트리스 + 펌프',320000,289000,'both',true,'{"suitable_grades":["1","2"],"target_conditions":["bedsore_risk_high","mobility_low"]}'),
  ('pressure-sore','실버케어','air-mattress-premium','교대 압력 에어매트리스 프리미엄','소음 최소화, 10cm 셀, 자동 압력 조절',489000,449000,'both',true,'{"suitable_grades":["1","2"],"target_conditions":["bedsore_risk_high","mobility_low"]}'),
  ('pressure-sore','메디하우스','heel-cushion','발뒤꿈치 욕창예방 쿠션','메모리폼 발꿈치 보호 쿠션 1쌍',32000,27900,'purchase',true,'{"suitable_grades":["1","2","3"],"target_conditions":["bedsore_risk_high","mobility_low"]}'),
  ('pressure-sore','안심케어','seat-cushion-gel','젤 방석 욕창예방','저반발 젤+폼 혼합 방석, 커버 세탁 가능',78000,69000,'purchase',true,'{"suitable_grades":["2","3","4"],"target_conditions":["bedsore_risk_medium","mobility_medium"]}'),
  -- 식사보조
  ('meal-assist','케어맥스','tilting-plate','기울어진 식판 세트','손이 불편한 어르신용 기울기 식판+커버',28000,23900,'purchase',false,'{"suitable_grades":["3","4","5"],"target_conditions":["meal_assist"]}'),
  ('meal-assist','건강나래','bent-spoon-set','구부러진 스푼 세트','오른손·왼손 구분 고각도 스푼 2P',19000,16900,'purchase',false,'{"suitable_grades":["3","4","5"],"target_conditions":["meal_assist"]}'),
  ('meal-assist','실버케어','non-slip-mat','미끄럼방지 식탁 매트','식기 고정 식탁 매트 2매 세트',14000,11900,'purchase',false,'{"suitable_grades":["3","4","5"],"target_conditions":["meal_assist"]}'),
  -- 케어보조
  ('care-assist','케어맥스','transfer-belt','이동 보조 허리벨트','요양보호사·보호자 이동 보조 벨트 M/L',39000,34900,'purchase',false,'{"suitable_grades":["1","2","3"],"target_conditions":["mobility_low"]}'),
  ('care-assist','메디하우스','gait-belt-padded','쿠션 이동 보조벨트','패딩 처리 이동 보조 허리벨트',48000,42000,'purchase',false,'{"suitable_grades":["1","2","3"],"target_conditions":["mobility_low"]}'),
  -- 건강관리
  ('health-management','건강나래','bp-monitor-wrist','손목형 혈압계','자동 가압 손목형 혈압계, 불규칙허리 감지',68000,59000,'purchase',false,'{"suitable_grades":["3","4","5"],"target_conditions":[]}'),
  ('health-management','안심케어','bp-monitor-arm','팔뚝형 자동혈압계','대형 커프, 음성 안내, 60회 메모리',89000,79000,'purchase',false,'{"suitable_grades":["3","4","5"],"target_conditions":[]}'),
  ('health-management','케어맥스','blood-glucose-meter','혈당측정기 세트','스트립 50매+채혈기+알코올솜 포함',49000,44900,'purchase',false,'{"suitable_grades":["3","4","5"],"target_conditions":[]}'),
  ('health-management','실버케어','pulse-oximeter','손가락 혈중산소 측정기','SpO2·맥박 측정, 대형 가시, 자동 전원',22000,18900,'purchase',false,'{"suitable_grades":["1","2","3","4","5"],"target_conditions":[]}'),
  ('health-management','메디하우스','thermometer-infrared','비접촉 적외선 체온계','1초 측정, 이마·귀 겸용, 발열 경보',28000,24900,'purchase',false,'{"suitable_grades":["1","2","3","4","5"],"target_conditions":[]}'),
  ('walking-aids','케어맥스','forearm-crutch','팔꿈치 목발 1쌍','알루미늄 경량 팔꿈치 목발, 높이조절',58000,49000,'purchase',true,'{"suitable_grades":["3","4","5"],"target_conditions":["mobility_medium","fall_risk"]}'),
  ('bath-hygiene','건강나래','portable-bidet-premium','이동식 좌변기 프리미엄','소프트 시트+스플래시 방지 커버 포함',129000,115000,'purchase',true,'{"suitable_grades":["2","3","4"],"target_conditions":["toileting_assist","mobility_low"]}')
) AS p(cat_slug, brand_name, slug, name, descr, price, sale_price, ptype, insured, care_info)
JOIN cat c ON c.slug = p.cat_slug
JOIN br b ON b.name = p.brand_name;

-- ─────────────────────────────────────────
-- 공지사항 샘플
-- ─────────────────────────────────────────
INSERT INTO public.notices (title, content, is_pinned, is_published) VALUES
('[공지] 복지용구 급여 서비스 이용 안내', '장기요양 수급자는 연간 한도 내에서 복지용구를 구입하거나 대여할 수 있습니다. 급여 품목(🟢 표시)은 본인 부담률 15%가 적용됩니다. 자세한 내용은 가이드 메뉴를 확인하세요.', TRUE, TRUE),
('[공지] 배송 안내', '평일 오전 12시 이전 결제 완료 건은 당일 발송됩니다. 도서·산간 지역은 추가 배송비가 발생할 수 있습니다.', FALSE, TRUE);
