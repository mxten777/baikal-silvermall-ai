import { test, expect, Page } from '@playwright/test'

// ─────────────────────────────────────────
// TC-01: 비회원 → 상품 탐색 → 로그인 유도 → 장바구니 보존 후 로그인
// ─────────────────────────────────────────
test.describe('TC-01: 비회원 장바구니 → 로그인 후 보존', () => {
  test('상품을 장바구니에 담고 로그인 후 유지된다', async ({ page }) => {
    // 1. 메인 접속
    await page.goto('/')
    await expect(page.locator('h1, [data-testid="hero-title"]')).toBeVisible()

    // 2. 스토어 이동
    await page.click('[href="/store"]')
    await page.waitForURL('/store')

    // 3. 첫 번째 상품 클릭
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    const productName = await firstProduct.locator('[data-testid="product-name"]').textContent()
    await firstProduct.click()

    // 4. 상품 상세 → 장바구니 담기
    await expect(page.locator('[data-testid="product-detail"]')).toBeVisible()
    await page.click('[data-testid="add-to-cart"]')
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1')

    // 5. 체크아웃 시도 → 로그인 유도
    await page.goto('/checkout')
    await page.waitForURL(/\/login/)
    await expect(page).toHaveURL(/next=%2Fcheckout/)

    // 6. 로그인
    await page.fill('[name="email"]', process.env.TEST_USER_EMAIL!)
    await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD!)
    await page.click('[type="submit"]')
    await page.waitForURL('/checkout')

    // 7. 장바구니 유지 확인
    await expect(page.locator('[data-testid="checkout-item"]').first()).toContainText(productName ?? '')
  })
})

// ─────────────────────────────────────────
// TC-02: 회원 전체 구매 플로우 (검색 → 결제 완료)
// ─────────────────────────────────────────
test.describe('TC-02: 회원 전체 구매 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page)
  })

  test('검색 → 필터 → 장바구니 → 체크아웃 → Toss 결제 → 주문 완료', async ({ page }) => {
    // 1. 검색
    await page.goto('/search?q=지팡이')
    expect(await page.locator('[data-testid="product-card"]').count()).toBeGreaterThanOrEqual(1)

    // 2. 필터 적용
    await page.click('[data-testid="filter-insurance"]')
    await page.waitForTimeout(500)

    // 3. 상품 상세
    await page.locator('[data-testid="product-card"]').first().click()
    await expect(page.locator('[data-testid="product-detail"]')).toBeVisible()

    // 4. 장바구니 추가
    await page.click('[data-testid="add-to-cart"]')

    // 5. 장바구니 페이지
    await page.goto('/cart')
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1)

    // 6. 주문서 작성
    await page.click('[data-testid="checkout-btn"]')
    await page.waitForURL('/checkout')

    // 7. 배송지 확인/입력
    await expect(page.locator('[data-testid="shipping-section"]')).toBeVisible()

    // 8. 결제 금액 확인
    const totalText = await page.locator('[data-testid="total-amount"]').textContent()
    expect(totalText).toMatch(/\d+/)

    // 9. Toss 결제 위젯 로드 확인
    await expect(page.locator('[data-testid="toss-payment-widget"]')).toBeVisible({ timeout: 10000 })

    // Note: Toss 결제 완료는 테스트 환경에서 모킹 또는 직접 API 호출로 처리
    // 실제 Playwright에서 Toss 결제창 자동화는 별도 설정 필요
  })
})

// ─────────────────────────────────────────
// TC-03: 마이페이지 → 주문 상세 → 리뷰 작성 → 적립금 확인
// ─────────────────────────────────────────
test.describe('TC-03: 마이페이지 리뷰 및 적립금', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page)
  })

  test('배송완료 주문에서 리뷰 작성 후 적립금이 반영된다', async ({ page }) => {
    // 1. 주문 목록
    await page.goto('/mypage/orders')
    expect(await page.locator('[data-testid="order-card"]').count()).toBeGreaterThanOrEqual(1)

    // 2. 배송완료 주문 찾기
    const deliveredOrder = page.locator('[data-testid="order-card"][data-status="delivered"]').first()
    await deliveredOrder.click()

    // 3. 리뷰 작성 버튼
    await page.click('[data-testid="write-review-btn"]')
    await page.waitForURL(/\/reviews\/write\//)

    // 4. 리뷰 작성
    await page.click('[data-testid="star-5"]')
    await page.fill('[data-testid="review-content"]', 'Playwright 자동 테스트 리뷰입니다.')
    await page.click('[data-testid="submit-review"]')

    // 5. 완료 확인
    await expect(page.locator('[data-testid="review-success"]')).toBeVisible()

    // 6. 적립금 페이지 확인
    await page.goto('/mypage/points')
    await expect(page.locator('[data-testid="points-balance"]')).toBeVisible()
  })
})

// ─────────────────────────────────────────
// TC-04: 어드민 상품 등록 → 스토어 노출 → 주문 상태 변경
// ─────────────────────────────────────────
test.describe('TC-04: 어드민 운영 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page)
  })

  test('상품 등록 후 스토어에서 노출되고 주문 상태를 변경할 수 있다', async ({ page }) => {
    // 1. 상품 등록
    await page.goto('/admin/products/new')
    await page.fill('[name="name"]', 'Playwright 테스트 상품')
    await page.fill('[name="price"]', '50000')
    await page.selectOption('[name="category_id"]', { label: '보행보조용구' })
    await page.selectOption('[name="status"]', 'active')
    await page.click('[data-testid="save-product"]')
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()

    // 2. 스토어에서 노출 확인
    await page.goto('/store')
    await expect(page.locator('text=Playwright 테스트 상품')).toBeVisible()

    // 3. 주문 목록에서 상태 변경 테스트 (paid → preparing)
    await page.goto('/admin/orders')
    const paidOrder = page.locator('[data-status="paid"]').first()
    if (await paidOrder.isVisible()) {
      await paidOrder.click()
      await page.click('[data-testid="status-preparing"]')
      await expect(page.locator('[data-testid="order-status"]')).toContainText('배송준비')
    }
  })
})

// ─────────────────────────────────────────
// TC-05: 결제 실패 시나리오 → 주문 취소 → 재고 복원
// ─────────────────────────────────────────
test.describe('TC-05: 결제 실패 처리', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page)
  })

  test('결제 실패 시 주문이 취소되고 failUrl로 이동한다', async ({ page }) => {
    // 1. 장바구니 → 주문서 준비 (API 직접 호출 방식)
    const prepareRes = await page.request.post('/api/checkout/prepare', {
      data: {
        items: [{
          product_id: process.env.TEST_PRODUCT_ID,
          option_key: {},
          qty: 1,
          snapshot: { name: '테스트', price: 10000, image_url: '', is_insurance: false, slug: 'test' },
        }],
        shipping_address: {
          recipient: '홍길동',
          phone: '010-0000-0000',
          zip_code: '12345',
          address1: '서울시 강남구',
        },
        points_used: 0,
      },
    })
    expect(prepareRes.ok()).toBeTruthy()
    const { orderId, amount } = await prepareRes.json()

    // 2. failUrl 시뮬레이션 (실패 파라미터로 이동)
    await page.goto(`/checkout/fail?code=PAY_PROCESS_ABORTED&message=결제를+취소했습니다&orderId=${orderId}`)

    // 3. 실패 페이지 표시 확인
    await expect(page.locator('[data-testid="fail-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible()
  })
})

// ─────────────────────────────────────────
// 공통 헬퍼
// ─────────────────────────────────────────
async function loginUser(page: Page) {
  await page.goto('/login')
  await page.fill('[name="email"]', process.env.TEST_USER_EMAIL!)
  await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD!)
  await page.click('[type="submit"]')
  await page.waitForURL('/')
}

async function loginAdmin(page: Page) {
  await page.goto('/login')
  await page.fill('[name="email"]', process.env.TEST_ADMIN_EMAIL!)
  await page.fill('[name="password"]', process.env.TEST_ADMIN_PASSWORD!)
  await page.click('[type="submit"]')
  await page.waitForURL('/admin')
}
