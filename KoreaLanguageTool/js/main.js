// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarCollapse = document.getElementById('sidebarCollapse');
const mainContent = document.getElementById('content');
const commonModal = new bootstrap.Modal(document.getElementById('commonModal'));

// Loading Management
function showLoading(message = '로딩 중...') {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = overlay.querySelector('.loading-text');
    loadingText.textContent = message;
    overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'none';
}

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Virtual scrolling for large datasets
class VirtualScroller {
    constructor(container, itemHeight, items, renderItem) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.items = items;
        this.renderItem = renderItem;
        this.visibleItems = Math.ceil(container.clientHeight / itemHeight) + 2;
        this.scrollTop = 0;
        this.startIndex = 0;
        this.endIndex = this.visibleItems;
        
        this.init();
    }
    
    init() {
        this.container.style.position = 'relative';
        this.container.style.overflow = 'auto';
        
        // Create spacer elements
        this.topSpacer = document.createElement('div');
        this.bottomSpacer = document.createElement('div');
        this.contentContainer = document.createElement('div');
        
        this.container.appendChild(this.topSpacer);
        this.container.appendChild(this.contentContainer);
        this.container.appendChild(this.bottomSpacer);
        
        this.container.addEventListener('scroll', this.handleScroll.bind(this));
        this.render();
    }
    
    handleScroll() {
        this.scrollTop = this.container.scrollTop;
        this.updateVisibleRange();
        this.render();
    }
    
    updateVisibleRange() {
        this.startIndex = Math.floor(this.scrollTop / this.itemHeight);
        this.endIndex = Math.min(this.startIndex + this.visibleItems, this.items.length);
    }
    
    render() {
        // Update spacers
        this.topSpacer.style.height = `${this.startIndex * this.itemHeight}px`;
        this.bottomSpacer.style.height = `${(this.items.length - this.endIndex) * this.itemHeight}px`;
        
        // Render visible items
        this.contentContainer.innerHTML = '';
        for (let i = this.startIndex; i < this.endIndex; i++) {
            const item = this.items[i];
            const element = this.renderItem(item, i);
            element.style.position = 'absolute';
            element.style.top = `${i * this.itemHeight}px`;
            element.style.width = '100%';
            this.contentContainer.appendChild(element);
        }
    }
    
    updateItems(newItems) {
        this.items = newItems;
        this.render();
    }
}

// State Management
let state = {
    items: JSON.parse(localStorage.getItem('items')) || [],
    partners: JSON.parse(localStorage.getItem('partners')) || [],
    purchases: JSON.parse(localStorage.getItem('purchases')) || [],
    sales: JSON.parse(localStorage.getItem('sales')) || [],
    currentPage: 'dashboard',
    sidebarCollapsed: false,
    partnersCurrentPage: 1,
    itemsCurrentPage: 1,
    purchasesCurrentPage: 1,
    salesCurrentPage: 1,
    inventoryCurrentPage: 1
};

// 기업별 데이터 관리 함수들
function getCompanyKey(businessNumber) {
    return `company_${businessNumber.replace(/-/g, '')}`;
}

function loadCompanyData(businessNumber) {
    if (!businessNumber) {
        state.items = [];
        state.partners = [];
        state.purchases = [];
        state.sales = [];
        return;
    }
    const companyKey = getCompanyKey(businessNumber);
    const companyData = JSON.parse(localStorage.getItem(companyKey)) || {
        items: [],
        partners: [],
        purchases: [],
        sales: []
    };
    
    state.items = companyData.items || [];
    state.partners = companyData.partners || [];
    state.purchases = companyData.purchases || [];
    state.sales = companyData.sales || [];
}

function saveCompanyData(businessNumber) {
    const companyKey = getCompanyKey(businessNumber);
    const companyData = {
        items: state.items,
        partners: state.partners,
        purchases: state.purchases,
        sales: state.sales
    };
    localStorage.setItem(companyKey, JSON.stringify(companyData));
}

function getCurrentCompanyBusinessNumber() {
    if (isAdmin()) {
        return localStorage.getItem('adminViewingBusinessNumber');
    }
    return localStorage.getItem('loginBusinessNumber');
}

// 기존 saveCompanyState 함수를 수정
function saveCompanyState() {
    const businessNumber = getCurrentCompanyBusinessNumber();
    if (businessNumber) {
        saveCompanyData(businessNumber);
    }
}

// 회원가입 및 관리자 승인 시스템
function getPendingUsers() {
    return JSON.parse(localStorage.getItem('pendingUsers')) || [];
}

function savePendingUsers(users) {
    localStorage.setItem('pendingUsers', JSON.stringify(users));
}

function getApprovedUsers() {
    return JSON.parse(localStorage.getItem('approvedUsers')) || [];
}

function saveApprovedUsers(users) {
    localStorage.setItem('approvedUsers', JSON.stringify(users));
}

function isAdmin() {
    return localStorage.getItem('isAdmin') === 'true';
}

function showAdminLoginModal() {
    state.currentPage = 'adminLogin';
    const content = `
        <form id="adminLoginForm">
            <div class="mb-3">
                <label class="form-label">관리자 아이디</label>
                <input type="text" class="form-control" name="adminId" required>
            </div>
            <div class="mb-3">
                <label class="form-label">관리자 비밀번호</label>
                <input type="password" class="form-control" name="adminPassword" required>
            </div>
        </form>
    `;
    showModal('관리자 로그인', content);
    
    // 모달 저장 버튼 텍스트 변경
    const saveBtn = document.getElementById('modalSaveBtn');
    if (saveBtn) {
        saveBtn.style.display = 'block';
        saveBtn.textContent = '로그인';
    }
}

function adminLogin() {
    const form = document.getElementById('adminLoginForm');
    const formData = new FormData(form);
    const adminId = formData.get('adminId');
    const adminPassword = formData.get('adminPassword');
    
    // ⚠️ 배포 전에 이 정보를 변경하세요!
    // 보안을 위해 기본 관리자 계정 정보를 변경하는 것을 권장합니다.
    if (adminId === 'wapeople' && adminPassword === 'rudckfcjd1!') {
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('loginUserId', 'admin');
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.removeItem('adminViewingBusinessNumber'); // Clear previous selection

        commonModal.hide();
        showToast('관리자로 로그인되었습니다.');
        navigateTo('dashboard');
        renderLogoutBtn();
    } else {
        alert('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
}

function showSignupModal() {
    state.currentPage = 'signup';
    const content = `
        <form id="signupForm">
            <div class="mb-3">
                <label class="form-label">사업자등록번호 <span class="text-danger">*</span></label>
                <input type="text" class="form-control" name="businessNumber" id="signupBusinessNumberInput" required 
                    placeholder="000-00-00000" maxlength="12">
                <div class="form-text">형식: 000-00-00000</div>
            </div>
            <div class="mb-3">
                <label class="form-label">기업명 <span class="text-danger">*</span></label>
                <input type="text" class="form-control" name="companyName" required>
            </div>
            <div class="mb-3">
                <label class="form-label">아이디 <span class="text-danger">*</span></label>
                <input type="text" class="form-control" name="userId" required>
            </div>
            <div class="mb-3">
                <label class="form-label">비밀번호 <span class="text-danger">*</span></label>
                <input type="password" class="form-control" name="password" required>
            </div>
            <div class="mb-3">
                <label class="form-label">비밀번호 확인 <span class="text-danger">*</span></label>
                <input type="password" class="form-control" name="passwordConfirm" required>
            </div>
        </form>
    `;
    showModal('회원가입', content);
    
    // 모달 저장 버튼 텍스트 변경
    const saveBtn = document.getElementById('modalSaveBtn');
    if (saveBtn) {
        saveBtn.textContent = '회원가입';
    }
    
    // 사업자등록번호 자동 하이픈 추가
    const businessNumberInput = document.getElementById('signupBusinessNumberInput');
    businessNumberInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length > 0) {
            if (value.length <= 3) {
                value = value;
            } else if (value.length <= 5) {
                value = value.slice(0, 3) + '-' + value.slice(3);
            } else {
                value = value.slice(0, 3) + '-' + value.slice(3, 5) + '-' + value.slice(5, 10);
            }
        }
        e.target.value = value;
    });
}

function saveSignup() {
    const form = document.getElementById('signupForm');
    const formData = new FormData(form);
    const signupData = Object.fromEntries(formData.entries());
    
    // 필수 항목 검증
    if (!signupData.businessNumber || !signupData.companyName || !signupData.userId || !signupData.password || !signupData.passwordConfirm) {
        alert('모든 필수 항목을 입력해주세요.');
        return;
    }
    
    // 사업자등록번호 형식 검증
    const businessNumberPattern = /^[0-9]{3}-[0-9]{2}-[0-9]{5}$/;
    if (!businessNumberPattern.test(signupData.businessNumber)) {
        alert('사업자등록번호 형식이 올바르지 않습니다. (예: 000-00-00000)');
        return;
    }
    
    // 비밀번호 확인
    if (signupData.password !== signupData.passwordConfirm) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }
    
    // 이미 승인된 사용자인지 확인
    const approvedUsers = getApprovedUsers();
    const isAlreadyApproved = approvedUsers.some(user => 
        user.businessNumber === signupData.businessNumber || user.userId === signupData.userId
    );
    
    if (isAlreadyApproved) {
        alert('이미 등록된 사업자등록번호 또는 아이디입니다.');
        return;
    }
    
    // 대기 중인 사용자인지 확인
    const pendingUsers = getPendingUsers();
    const isAlreadyPending = pendingUsers.some(user => 
        user.businessNumber === signupData.businessNumber || user.userId === signupData.userId
    );
    
    if (isAlreadyPending) {
        alert('이미 승인 대기 중인 사업자등록번호 또는 아이디입니다.');
        return;
    }
    
    // 대기 목록에 추가
    const newUser = {
        ...signupData,
        createdAt: new Date().toISOString(),
        status: 'pending'
    };
    
    pendingUsers.push(newUser);
    savePendingUsers(pendingUsers);
    
    commonModal.hide();
    showToast('회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.');
}

function showAdminPanel() {
    const pendingUsers = getPendingUsers();
    const approvedUsers = getApprovedUsers();
    
    const content = `
        <div class="admin-panel-container">
            <!-- 통계 요약 -->
            <div class="row mb-4">
                <div class="col-md-6 mb-3 mb-md-0">
                    <div class="card border-warning h-100">
                        <div class="card-header bg-warning text-dark">
                            <h6 class="mb-0"><i class='bx bx-time'></i> 승인 대기 중</h6>
                        </div>
                        <div class="card-body text-center d-flex flex-column justify-content-center align-items-center">
                            <div class="display-4 text-warning">${pendingUsers.length}</div>
                            <div class="text-muted">명의 사용자가 승인을 기다리고 있습니다</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card border-success h-100">
                        <div class="card-header bg-success text-white">
                            <h6 class="mb-0"><i class='bx bx-check-circle'></i> 승인된 사용자</h6>
                        </div>
                        <div class="card-body text-center d-flex flex-column justify-content-center align-items-center">
                            <div class="display-4 text-success">${approvedUsers.length}</div>
                            <div class="text-muted">명의 사용자가 승인되었습니다</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 사용자 관리 테이블 -->
            <div class="row">
                <div class="col-md-6 mb-3 mb-md-0">
                    <div class="card">
                        <div class="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
                            <h6 class="mb-0"><i class='bx bx-time'></i> 승인 대기 중인 사용자</h6>
                            <span class="badge bg-dark">${pendingUsers.length}명</span>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                                <table class="table table-hover mb-0">
                                    <thead class="table-light sticky-top">
                                        <tr>
                                            <th>사업자번호</th>
                                            <th>기업명</th>
                                            <th>아이디</th>
                                            <th>신청일</th>
                                            <th>관리</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${pendingUsers.length === 0 ? `
                                            <tr>
                                                <td colspan="5" class="text-center text-muted py-5">
                                                    <i class='bx bx-info-circle' style="font-size: 2rem; margin-bottom: 0.5rem;"></i><br>
                                                    승인 대기 중인 사용자가 없습니다
                                                </td>
                                            </tr>
                                        ` : pendingUsers.map(user => `
                                            <tr>
                                                <td><span class="badge bg-secondary">${user.businessNumber}</span></td>
                                                <td><strong>${user.companyName}</strong></td>
                                                <td><code>${user.userId}</code></td>
                                                <td><small>${new Date(user.createdAt).toLocaleDateString()}</small></td>
                                                <td>
                                                    <div class="btn-group btn-group-sm" role="group">
                                                        <button class="btn btn-success" onclick="approveUser('${user.businessNumber}', '${user.userId}')" title="승인">
                                                            <i class='bx bx-check'></i>
                                                        </button>
                                                        <button class="btn btn-danger" onclick="rejectUser('${user.businessNumber}', '${user.userId}')" title="거절">
                                                            <i class='bx bx-x'></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                            <h6 class="mb-0"><i class='bx bx-check-circle'></i> 승인된 사용자</h6>
                            <span class="badge bg-light text-dark">${approvedUsers.length}명</span>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                                <table class="table table-hover mb-0">
                                    <thead class="table-light sticky-top">
                                        <tr>
                                            <th>사업자번호</th>
                                            <th>기업명</th>
                                            <th>아이디</th>
                                            <th>승인일</th>
                                            <th>관리</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${approvedUsers.length === 0 ? `
                                            <tr>
                                                <td colspan="5" class="text-center text-muted py-5">
                                                    <i class='bx bx-info-circle' style="font-size: 2rem; margin-bottom: 0.5rem;"></i><br>
                                                    승인된 사용자가 없습니다
                                                </td>
                                            </tr>
                                        ` : approvedUsers.map(user => `
                                            <tr>
                                                <td><span class="badge bg-primary">${user.businessNumber}</span></td>
                                                <td><strong>${user.companyName}</strong></td>
                                                <td><code>${user.userId}</code></td>
                                                <td><small>${new Date(user.approvedAt).toLocaleDateString()}</small></td>
                                                <td>
                                                    <button class="btn btn-warning btn-sm" onclick="revokeUser('${user.businessNumber}', '${user.userId}')" title="승인취소">
                                                        <i class='bx bx-undo'></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 관리자 안내 -->
            <div class="row mt-4">
                <div class="col-12">
                    <div class="alert alert-info">
                        <h6><i class='bx bx-info-circle'></i> 관리자 안내</h6>
                        <ul class="mb-0">
                            <li><strong>승인:</strong> 사용자의 가입을 승인하여 로그인을 허용합니다.</li>
                            <li><strong>거절:</strong> 사용자의 가입을 거절하여 대기 목록에서 제거합니다.</li>
                            <li><strong>승인취소:</strong> 이미 승인된 사용자의 권한을 취소합니다.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 모달 크기를 크게 설정
    const modal = document.getElementById('commonModal');
    const modalDialog = modal.querySelector('.modal-dialog');
    modalDialog.className = 'modal-dialog modal-xl';
    
    showModal('관리자 패널', content);
    
    // 모달 저장 버튼 숨기기 (관리자 패널에서는 불필요)
    const saveBtn = document.getElementById('modalSaveBtn');
    if (saveBtn) {
        saveBtn.style.display = 'none';
    }
}

function approveUser(businessNumber, userId) {
    const pendingUsers = getPendingUsers();
    const approvedUsers = getApprovedUsers();
    
    const userIndex = pendingUsers.findIndex(user => 
        user.businessNumber === businessNumber && user.userId === userId
    );
    
    if (userIndex !== -1) {
        const user = pendingUsers[userIndex];
        user.status = 'approved';
        user.approvedAt = new Date().toISOString();
        
        approvedUsers.push(user);
        pendingUsers.splice(userIndex, 1);
        
        savePendingUsers(pendingUsers);
        saveApprovedUsers(approvedUsers);
        
        showToast('사용자가 승인되었습니다.');
        showAdminPanel(); // 패널 새로고침
    }
}

function rejectUser(businessNumber, userId) {
    if (confirm('정말로 이 사용자의 가입을 거절하시겠습니까?')) {
        const pendingUsers = getPendingUsers();
        const userIndex = pendingUsers.findIndex(user => 
            user.businessNumber === businessNumber && user.userId === userId
        );
        
        if (userIndex !== -1) {
            pendingUsers.splice(userIndex, 1);
            savePendingUsers(pendingUsers);
            showToast('사용자 가입이 거절되었습니다.');
            showAdminPanel(); // 패널 새로고침
        }
    }
}

function revokeUser(businessNumber, userId) {
    if (confirm('정말로 이 사용자의 승인을 취소하시겠습니까?')) {
        const approvedUsers = getApprovedUsers();
        const userIndex = approvedUsers.findIndex(user =>
            user.businessNumber === businessNumber && user.userId === userId
        );

        if (userIndex !== -1) {
            approvedUsers.splice(userIndex, 1);
            saveApprovedUsers(approvedUsers);
            showToast('사용자 승인이 취소되었습니다.');
            showAdminPanel(); // 패널 새로고침
        }
    }
}

function getCompanyNameFromBNo(businessNumber) {
    if (!businessNumber) return null;
    const approvedUsers = getApprovedUsers();
    const user = approvedUsers.find(u => u.businessNumber === businessNumber);
    return user ? user.companyName : null;
}

// 전역 함수로 등록
window.showSignupModal = showSignupModal;
window.saveSignup = saveSignup;
window.showAdminPanel = showAdminPanel;
window.approveUser = approveUser;
window.rejectUser = rejectUser;
window.revokeUser = revokeUser;
window.adminLogin = adminLogin;
window.showAdminLoginModal = showAdminLoginModal;

// Event Listeners - 하나로 통합
window.addEventListener('DOMContentLoaded', () => {
    // Sidebar toggle
    sidebarCollapse.addEventListener('click', () => {
        state.sidebarCollapsed = !state.sidebarCollapsed;
        sidebar.classList.toggle('collapsed', state.sidebarCollapsed);
        mainContent.classList.toggle('collapsed', state.sidebarCollapsed);
    });

    // Navigation
    document.querySelectorAll('#sidebar a[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.closest('a').dataset.page;
            navigateTo(page);
        });
    });

    // Modal Save Button (유일한 이벤트 핸들러)
    document.getElementById('modalSaveBtn').addEventListener('click', () => {
        const currentPage = state.currentPage;
        switch(currentPage) {
            case 'items':
                if (window.saveItem) saveItem();
                break;
            case 'partners':
                if (window.savePartner) savePartner();
                break;
            case 'purchase':
                if (window.savePurchase) savePurchase();
                break;
            case 'sales':
                if (window.saveSales) saveSales();
                break;
            case 'signup':
                if (window.saveSignup) saveSignup();
                break;
            case 'adminLogin':
                if (window.adminLogin) adminLogin();
                break;
        }
    });

    // 로그아웃 버튼 렌더
    renderLogoutBtn();

    // 로그인 상태에 따라 첫 화면 결정
    if (isLoggedIn()) {
        const businessNumber = getCurrentCompanyBusinessNumber();
        // Admin can be logged in without a company selected. Regular user must have a business number.
        if (isAdmin() || businessNumber) {
            loadCompanyData(businessNumber); // Handles null for admin
            navigateTo('dashboard');
        } else {
             // This case should only be for a regular user with missing data, which is an error state.
             // Forcing logout is a safe way to handle it.
            logout();
        }
    } else {
        navigateTo('login');
    }
});

// Navigation
function navigateTo(page) {
    // 로그인하지 않은 경우 무조건 로그인 페이지로 이동
    if (!isLoggedIn() && page !== 'login') {
        state.currentPage = 'login';
        updateActiveNavItem();
        loadPageContent('login');
        renderLogoutBtn();
        return;
    }
    state.currentPage = page;
    updateActiveNavItem();
    loadPageContent(page);
    renderLogoutBtn(); // 페이지 변경 시 로그아웃 버튼 다시 렌더링
}

function updateActiveNavItem() {
    document.querySelectorAll('#sidebar li').forEach(item => {
        item.classList.remove('active');
    });
    const link = document.querySelector(`#sidebar a[data-page="${state.currentPage}"]`);
    if (link) {
      link.parentElement.classList.add('active');
    }
}

// Page Content Loading
function loadPageContent(page) {
    switch(page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'items':
            loadItems();
            break;
        case 'partners':
            loadPartners();
            break;
        case 'purchase':
            loadPurchases();
            break;
        case 'sales':
            loadSales();
            break;
        case 'inventory':
            loadInventory();
            break;
        case 'monthly':
            loadMonthlyView();
            break;
        case 'login':
            loadLogin();
            break;
    }
}

function loadMonthlyView() {
    if (!isLoggedIn()) {
        navigateTo('login');
        return;
    }
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const content = `
        <div class="card">
            <div class="card-header d-flex flex-wrap align-items-center gap-2">
                <h5 class="mb-0 me-3">월별 매입/매출 조회</h5>
                <input type="number" id="monthlyYear" class="form-control" style="width:100px;" min="2000" max="2100" value="${thisYear}">
                <span class="mx-1">년</span>
                <input type="number" id="monthlyMonth" class="form-control" style="width:70px;" min="1" max="12" value="${thisMonth}">
                <span class="mx-1">월</span>
                <button class="btn btn-primary ms-2" id="monthlySearchBtn"><i class='bx bx-search'></i> 조회</button>
                <button class="btn btn-outline-secondary ms-2" id="monthlyAllBtn">전체</button>
                <select id="monthlyPartnerSelect" class="form-select ms-2" style="width:auto; min-width:120px;">
                    <option value="">거래처 전체</option>
                    ${state.partners.map(p => `<option value="${p.businessNumber}">${p.name}</option>`).join('')}
                </select>
                <select id="monthlyItemSelect" class="form-select ms-2" style="width:auto; min-width:120px;">
                    <option value="">품목 전체</option>
                    ${state.items.map(i => `<option value="${i.code}">${i.name}</option>`).join('')}
                </select>
            </div>
            <div class="card-body">
                <div id="monthlySummary" class="mb-4"></div>
        <div class="row">
                    <div class="col-md-6">
                        <h6>매입 내역</h6>
                        <div class="table-responsive">
                            <table class="table table-sm monthly-table">
                                <colgroup>
                                    <col style="width:16%">
                                    <col style="width:22%">
                                    <col style="width:22%">
                                    <col style="width:20%">
                                    <col style="width:20%">
                                </colgroup>
                                <thead><tr>
                                    <th>일자</th>
                                    <th>거래처</th>
                                    <th>품목</th>
                                    <th>공급가액</th>
                                    <th>세액</th>
                                </tr></thead>
                                <tbody id="monthlyPurchaseTable"></tbody>
                            </table>
                </div>
            </div>
                    <div class="col-md-6">
                        <h6>매출 내역</h6>
                        <div class="table-responsive">
                            <table class="table table-sm monthly-table">
                                <colgroup>
                                    <col style="width:16%">
                                    <col style="width:22%">
                                    <col style="width:22%">
                                    <col style="width:20%">
                                    <col style="width:20%">
                                </colgroup>
                                <thead><tr>
                                    <th>일자</th>
                                    <th>출고처</th>
                                    <th>품목</th>
                                    <th>공급가액</th>
                                    <th>세액</th>
                                </tr></thead>
                                <tbody id="monthlySalesTable"></tbody>
                            </table>
                </div>
            </div>
                </div>
            </div>
                </div>
    `;
    mainContent.innerHTML = content;
    document.getElementById('monthlySearchBtn').addEventListener('click', () => {
        enableMonthlyInputs(true);
        renderMonthlyTables(false);
    });
    document.getElementById('monthlyAllBtn').addEventListener('click', () => {
        document.getElementById('monthlyYear').value = '';
        document.getElementById('monthlyMonth').value = '';
        enableMonthlyInputs(false);
        renderMonthlyTables(true);
    });
    document.getElementById('monthlyPartnerSelect').addEventListener('change', () => renderMonthlyTables());
    document.getElementById('monthlyItemSelect').addEventListener('change', () => renderMonthlyTables());
    enableMonthlyInputs(true);
    renderMonthlyTables(false);
}

function enableMonthlyInputs(enable) {
    document.getElementById('monthlyYear').disabled = !enable;
    document.getElementById('monthlyMonth').disabled = !enable;
}

function renderMonthlyTables(showAll = false) {
    let purchases, sales;
    const partnerVal = document.getElementById('monthlyPartnerSelect').value;
    const itemVal = document.getElementById('monthlyItemSelect').value;
    if (showAll) {
        purchases = state.purchases;
        sales = state.sales;
    } else {
        const year = document.getElementById('monthlyYear').value;
        const month = document.getElementById('monthlyMonth').value.padStart(2, '0');
        purchases = state.purchases.filter(p => p.date && p.date.startsWith(`${year}-${month}`));
        sales = state.sales.filter(s => s.date && s.date.startsWith(`${year}-${month}`));
    }
    // 거래처 필터
    if (partnerVal) {
        purchases = purchases.filter(p => p.partner === partnerVal);
        sales = sales.filter(s => s.partner === partnerVal);
    }
    // 품목 필터
    if (itemVal) {
        purchases = purchases.filter(p => p.item === itemVal);
        sales = sales.filter(s => s.item === itemVal);
    }
    // 매입 테이블
    document.getElementById('monthlyPurchaseTable').innerHTML = purchases.map(p => {
        const partner = state.partners.find(x => x.businessNumber === p.partner);
        const item = state.items.find(x => x.code === p.item);
        return `<tr><td>${p.date}</td><td>${partner ? partner.name : ''}</td><td>${item ? item.name : ''}</td><td>${formatCurrency(p.supplyAmount)}</td><td>${formatCurrency(p.taxAmount)}</td></tr>`;
    }).join('');
    // 매출 테이블
    document.getElementById('monthlySalesTable').innerHTML = sales.map(s => {
        const partner = state.partners.find(x => x.businessNumber === s.partner);
        const item = state.items.find(x => x.code === s.item);
        return `<tr><td>${s.date}</td><td>${partner ? partner.name : ''}</td><td>${item ? item.name : ''}</td><td>${formatCurrency(s.supplyAmount)}</td><td>${formatCurrency(s.taxAmount)}</td></tr>`;
    }).join('');
    // 요약
    const purchaseTotal = purchases.reduce((sum, p) => sum + Number(p.supplyAmount||0), 0);
    const purchaseTax = purchases.reduce((sum, p) => sum + Number(p.taxAmount||0), 0);
    const salesTotal = sales.reduce((sum, s) => sum + Number(s.supplyAmount||0), 0);
    const salesTax = sales.reduce((sum, s) => sum + Number(s.taxAmount||0), 0);
    document.getElementById('monthlySummary').innerHTML = `
        <div class="row text-center">
            <div class="col-md-3 mb-2"><div class="p-2 bg-light rounded">매입 합계<br><b>${formatCurrency(purchaseTotal)}</b></div></div>
            <div class="col-md-3 mb-2"><div class="p-2 bg-light rounded">매입 세액<br><b>${formatCurrency(purchaseTax)}</b></div></div>
            <div class="col-md-3 mb-2"><div class="p-2 bg-light rounded">매출 합계<br><b>${formatCurrency(salesTotal)}</b></div></div>
            <div class="col-md-3 mb-2"><div class="p-2 bg-light rounded">매출 세액<br><b>${formatCurrency(salesTax)}</b></div></div>
            </div>
    `;
}

// Dashboard
function calculateDashboardSummary() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const currentMonthPrefix = `${year}-${month}`;

    const monthlyPurchases = state.purchases.filter(p => p.date && p.date.startsWith(currentMonthPrefix));
    const monthlySales = state.sales.filter(s => s.date && s.date.startsWith(currentMonthPrefix));

    const monthlyPurchaseTotal = monthlyPurchases.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);
    const monthlySalesTotal = monthlySales.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);

    let lowStockCount = 0;
    const inventoryWithStock = state.items.map(item => {
        const stock = (state.purchases.filter(p => p.item === item.code).reduce((sum, p) => sum + Number(p.quantity), 0)) -
                      (state.sales.filter(s => s.item === item.code).reduce((sum, s) => sum + Number(s.quantity), 0));
        if (stock <= item.minStock) {
            lowStockCount++;
        }
        return { ...item, stock };
    });
    
    const lowStockItems = inventoryWithStock.filter(item => item.stock <= item.minStock).sort((a,b) => a.stock - b.stock);

    const salesByItem = {};
    monthlySales.forEach(sale => {
        const item = state.items.find(i => i.code === sale.item);
        if (item) {
            if (!salesByItem[sale.item]) {
                salesByItem[sale.item] = { name: item.name, amount: 0 };
            }
            salesByItem[sale.item].amount += Number(sale.totalAmount || 0);
        }
    });

    const topSellingItems = Object.values(salesByItem)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

    return {
        monthlyPurchaseTotal,
        monthlySalesTotal,
        totalItemCount: state.items.length,
        lowStockCount,
        lowStockItems,
        monthlyPurchases,
        monthlySales,
        topSellingItems
    };
}

function renderDashboardCharts(summary) {
    // Monthly trend chart
    const months = Array.from({length: 12}, (_, i) => (i+1) + '월');
    const nowYear = new Date().getFullYear();
    let monthlyPurchaseData = Array(12).fill(0);
    let monthlySalesData = Array(12).fill(0);
    state.purchases.forEach(p => {
        if (p.date) {
            const [y, m] = p.date.split('-');
            if (Number(y) === nowYear) monthlyPurchaseData[Number(m)-1] += Number(p.totalAmount || 0);
        }
    });
    state.sales.forEach(s => {
        if (s.date) {
            const [y, m] = s.date.split('-');
            if (Number(y) === nowYear) monthlySalesData[Number(m)-1] += Number(s.totalAmount || 0);
        }
    });

    if (window.dashboardMonthlyChartObj) {
        window.dashboardMonthlyChartObj.destroy();
        window.dashboardMonthlyChartObj = null;
    }
    
    const ctx1 = document.getElementById('dashboardMonthlyChart')?.getContext('2d');
    if(ctx1) {
        window.dashboardMonthlyChartObj = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    { label: '매출', data: monthlySalesData, backgroundColor: 'rgba(55, 178, 77, 0.5)', borderColor: '#37B24D', fill: true, tension: 0.3 },
                    { label: '매입', data: monthlyPurchaseData, backgroundColor: 'rgba(62, 142, 251, 0.5)', borderColor: '#3E8EFB', fill: true, tension: 0.3 }
                ]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { position: 'top' } }, 
                scales: { y: { beginAtZero: true } } 
            }
        });
    }

    // Top Selling Items Chart
    if (window.dashboardTopItemsChartObj) {
        window.dashboardTopItemsChartObj.destroy();
        window.dashboardTopItemsChartObj = null;
    }
    const ctx2 = document.getElementById('dashboardTopItemsChart')?.getContext('2d');
    if (ctx2) {
        if (summary.topSellingItems && summary.topSellingItems.length > 0) {
            window.dashboardTopItemsChartObj = new Chart(ctx2, {
                type: 'pie',
                data: {
                    labels: summary.topSellingItems.map(i => i.name),
                    datasets: [{
                        label: '매출액',
                        data: summary.topSellingItems.map(i => i.amount),
                        backgroundColor: ['#3182F6', '#1E40AF', '#60A5FA', '#93C5FD', '#BFDBFE'],
                        borderColor: '#fff',
                        borderWidth: 2,
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', align: 'start', labels: { boxWidth: 12, padding: 20 } },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${formatCurrency(context.raw)}`;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            ctx2.canvas.parentNode.innerHTML = `<div class="text-center p-4 text-muted d-flex flex-column align-items-center justify-content-center h-100">
                <i class='bx bx-info-circle' style="font-size: 3rem; color: #ccc;"></i>
                <p class="mt-2 mb-0">이번 달 매출 데이터가 없습니다.</p>
            </div>`;
        }
    }
}

function renderInventoryAlerts(summary) {
    const container = document.getElementById('inventoryAlertsContainer');
    if (!container) return;

    if (summary.lowStockItems.length === 0) {
        container.innerHTML = `<div class="text-center p-4 text-muted d-flex flex-column align-items-center justify-content-center h-100">
            <i class='bx bx-check-shield' style="font-size: 3rem; color: #37B24D;"></i>
            <p class="mt-2 mb-0">재고 부족 품목이 없습니다.</p>
        </div>`;
        return;
    }

    container.innerHTML = `
        <ul class="list-group list-group-flush">
            ${summary.lowStockItems.slice(0, 7).map(item => {
                let statusClass = 'safe';
                let statusText = '재고 충족';
                let statusIcon = 'bx-check-circle';
                
                if (item.stock <= 0) {
                    statusClass = 'critical';
                    statusText = '재고 부족';
                    statusIcon = 'bx-error-circle';
                } else if (item.stock <= item.minStock) {
                    statusClass = 'warning';
                    statusText = '저재고';
                    statusIcon = 'bx-warning';
                }
                
                return `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <div class="fw-bold">${item.name}</div>
                            <small class="text-muted">최소: ${item.minStock} / 현재: ${item.stock}</small>
                </div>
                        <span class="badge-inventory ${statusClass}">
                            <i class='bx ${statusIcon}'></i>
                            ${statusText}
                        </span>
                    </li>
                `;
            }).join('')}
        </ul>
    `;
}

function renderActivityFeed() {
    const container = document.getElementById('activityFeedContainer');
    if (!container) return;

    const purchases = state.purchases.map(p => ({...p, type: '매입', timestamp: p.createdAt, key: p.id}));
    const sales = state.sales.map(s => ({...s, type: '매출', timestamp: s.createdAt, key: s.id}));
    const items = state.items.map(i => ({...i, type: '품목', timestamp: i.createdAt || i.updatedAt, action: i.updatedAt ? '수정' : '등록', key: i.code}));
    
    const feed = [...purchases, ...sales, ...items]
        .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 7);

    if (feed.length === 0) {
        container.innerHTML = `<div class="text-center p-4 text-muted">최근 활동이 없습니다.</div>`;
        return;
    }
    
    const iconMap = {
        '매입': 'bx-log-in',
        '매출': 'bx-log-out',
        '품목': 'bx-box'
    };

    container.innerHTML = `
        <ul class="list-group list-group-flush">
            ${feed.map(item => {
                let title = '';
                let details = '';
                switch(item.type) {
                    case '매입':
                        title = `${state.partners.find(p => p.businessNumber === item.partner)?.name || '알 수 없음'}`;
                        details = `${state.items.find(i => i.code === item.item)?.name || '품목'} ${item.quantity}개 입고`;
                        break;
                    case '매출':
                        title = `${state.partners.find(p => p.businessNumber === item.partner)?.name || '알 수 없음'}`;
                        details = `${state.items.find(i => i.code === item.item)?.name || '품목'} ${item.quantity}개 출고`;
                        break;
                    case '품목':
                        title = `품목 ${item.action}: ${item.name}`;
                        details = `품목 코드: ${item.code}`;
                        break;
                }
                return `
                    <li class="list-group-item d-flex align-items-center">
                        <div class="activity-icon ${item.type.toLowerCase()}"><i class='bx ${iconMap[item.type]}'></i></div>
                        <div class="ms-3">
                            <div class="fw-bold">${title}</div>
                            <small class="text-muted">${details} - ${new Date(item.timestamp).toLocaleDateString()}</small>
        </div>
                    </li>
                `
            }).join('')}
        </ul>
    `;
}

function renderDashboardContent() {
    const summary = calculateDashboardSummary();
    
    const dashboardContainer = document.getElementById('dashboard-container');
    if (!dashboardContainer) return;
    
    dashboardContainer.innerHTML = `
        <div class="row">
            <div class="col-lg-3 col-md-6 mb-4">
                <div class="dashboard-card summary-card card-sales">
                    <div class="card-icon"><i class='bx bx-trending-up'></i></div>
                    <div class="card-content">
                        <div class="label">이달의 매출</div>
                        <div class="value">${formatCurrency(summary.monthlySalesTotal)}</div>
            </div>
        </div>
                    </div>
            <div class="col-lg-3 col-md-6 mb-4">
                <div class="dashboard-card summary-card card-purchase">
                    <div class="card-icon"><i class='bx bx-trending-down'></i></div>
                    <div class="card-content">
                        <div class="label">이달의 매입</div>
                        <div class="value">${formatCurrency(summary.monthlyPurchaseTotal)}</div>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-4">
                <div class="dashboard-card summary-card card-inventory">
                    <div class="card-icon"><i class='bx bx-box'></i></div>
                    <div class="card-content">
                        <div class="label">총 품목</div>
                        <div class="value">${summary.totalItemCount} <span class="unit">개</span></div>
                    </div>
                    </div>
                </div>
            <div class="col-lg-3 col-md-6 mb-4">
                <div class="dashboard-card summary-card card-alert">
                    <div class="card-icon"><i class='bx bx-error-circle'></i></div>
                    <div class="card-content">
                        <div class="label">재고 부족</div>
                        <div class="value">${summary.lowStockCount} <span class="unit">개</span></div>
            </div>
                </div>
            </div>
        </div>
        <div class="row row-deck">
            <div class="col-lg-8 mb-4">
                <div class="card h-100">
                    <div class="card-header"><h5>${new Date().getFullYear()}년 월별 추이</h5></div>
                    <div class="card-body">
                        <div class="chart-container">
                            <canvas id="dashboardMonthlyChart"></canvas>
                </div>
            </div>
                </div>
            </div>
            <div class="col-lg-4 mb-4">
                <div class="card h-100">
                    <div class="card-header"><h5>재고 경고</h5></div>
                    <div class="card-body p-0" id="inventoryAlertsContainer">
                        <!-- Inventory alerts will be rendered here -->
                </div>
            </div>
        </div>
        </div>
        <div class="row row-deck">
            <div class="col-lg-7 mb-4">
                <div class="card h-100">
                    <div class="card-header"><h5>최근 활동</h5></div>
                    <div class="card-body p-0" id="activityFeedContainer">
                        <!-- Activity feed will be rendered here -->
                    </div>
                </div>
            </div>
            <div class="col-lg-5 mb-4">
                <div class="card h-100">
                    <div class="card-header"><h5>매출 상위 품목 (이번 달)</h5></div>
                    <div class="card-body">
                        <div class="chart-container">
                            <canvas id="dashboardTopItemsChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
                    </div>
    `;

    renderDashboardCharts(summary);
    renderInventoryAlerts(summary);
    renderActivityFeed();
}

function loadDashboard() {
    // Destroy charts from previous render to prevent memory leaks and duplication
    if (window.dashboardMonthlyChartObj) {
        window.dashboardMonthlyChartObj.destroy();
        window.dashboardMonthlyChartObj = null;
    }
    if (window.dashboardTopItemsChartObj) {
        window.dashboardTopItemsChartObj.destroy();
        window.dashboardTopItemsChartObj = null;
    }

    if (!isLoggedIn()) {
        navigateTo('login');
        return;
    }

    showLoading('대시보드를 불러오는 중...');

    setTimeout(() => {
        const businessNumber = getCurrentCompanyBusinessNumber();
        let welcomeMessage = '';
        const userId = localStorage.getItem('loginUserId');

        if (isAdmin()) {
            const approvedUsers = getApprovedUsers();
            const companyName = getCompanyNameFromBNo(businessNumber);
            
            welcomeMessage = `
                <div class="admin-welcome-container">
                    <div class="row align-items-center">
                        <div class="col">
                            <h4 class="mb-1">관리자님, 환영합니다.</h4>
                            <p class="mb-0">${companyName ? `현재 <strong>${companyName}</strong>의 대시보드를 보고 있습니다.` : '관리할 기업을 선택해주세요.'}</p>
                    </div>
                        <div class="col-md-4 col-lg-3 col-12 ms-auto">
                            <div class="input-group">
                                <label class="input-group-text" for="companySwitchSelect"><i class='bx bx-buildings'></i></label>
                                <select class="form-select" id="companySwitchSelect">
                                    <option value="">-- 기업 선택 --</option>
                                    ${approvedUsers.map(user => `
                                        <option value="${user.businessNumber}" ${businessNumber === user.businessNumber ? 'selected' : ''}>
                                            ${user.companyName}
                                        </option>
                                    `).join('')}
                                </select>
                </div>
                        </div>
                    </div>
                </div>
            `;

        } else {
            const companyName = getCompanyNameFromBNo(businessNumber);
            welcomeMessage = `
                <div class="col">
                    <h4 class="dashboard-welcome mb-1">${companyName || userId}님, 환영합니다.</h4>
                    <p class="text-muted mb-0">오늘도 힘내세요!</p>
            </div>
            `;
        }

        mainContent.innerHTML = `
            <div class="row align-items-center mb-4 dashboard-header">
                ${welcomeMessage}
                </div>
            <div id="dashboard-container">
                <!-- Dashboard content will be rendered here -->
            </div>
        `;

        if (isAdmin()) {
            const companySwitchSelect = document.getElementById('companySwitchSelect');
            if (companySwitchSelect) {
                companySwitchSelect.addEventListener('change', (e) => {
                    const selectedBusinessNumber = e.target.value;
                    if (selectedBusinessNumber) {
                        localStorage.setItem('adminViewingBusinessNumber', selectedBusinessNumber);
                        loadCompanyData(selectedBusinessNumber);
                    } else {
                        localStorage.removeItem('adminViewingBusinessNumber');
                        state.items = []; state.partners = []; state.purchases = []; state.sales = [];
                    }
                    
                    // 대시보드 및 다른 페이지 새로고침
                    const currentPage = state.currentPage;
                    navigateTo(currentPage === 'dashboard' ? 'dashboard' : currentPage);
                });
            }
        }

        const showData = businessNumber || !isAdmin();
        if (showData) {
            renderDashboardContent();
        } else {
            document.getElementById('dashboard-container').innerHTML = `
                <div class="alert alert-info text-center mt-4 p-5">
                    <h4><i class='bx bx-info-circle me-2'></i>기업을 선택하세요</h4>
                    <p class="lead">상단의 기업 전환 메뉴에서 관리할 기업을 선택하여 대시보드를 확인하세요.</p>
                </div>
            `;
        }
        
        hideLoading();
    }, 100);
}

// Items Management
function loadItems() {
    if (!isLoggedIn()) {
        navigateTo('login');
        return;
    }
    
    showLoading('품목 목록을 불러오는 중...');
    
    setTimeout(() => {
        const content = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">품목 관리</h5>
                    <button class="btn btn-primary" onclick="showItemModal()">
                        <i class='bx bx-plus'></i> 품목 등록
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>품목코드</th>
                                    <th>품목명</th>
                                    <th>분류</th>
                                    <th>단위</th>
                                    <th>최소재고</th>
                                    <th>현재재고</th>
                                    <th>상태</th>
                                    <th>관리</th>
                                </tr>
                            </thead>
                            <tbody id="itemsTableBody">
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        mainContent.innerHTML = content;
        loadItemsTable();
        hideLoading();
    }, 100);
}

function loadItemsTable() {
    const tbody = document.getElementById('itemsTableBody');
    tbody.innerHTML = '';

    state.items.forEach(item => {
        // 재고현황과 동일하게 현재재고 계산
        const purchases = state.purchases.filter(p => p.item === item.code);
        const sales = state.sales.filter(s => s.item === item.code);
        let totalPurchasedQuantity = 0;
        purchases.forEach(p => {
            totalPurchasedQuantity += Number(p.quantity);
        });
        let totalSoldQuantity = 0;
        sales.forEach(s => {
            totalSoldQuantity += Number(s.quantity);
        });
        const currentStock = totalPurchasedQuantity - totalSoldQuantity;

        const status = getItemStatus({ ...item, currentStock });
        const row = `
            <tr>
                <td>${item.code}</td>
                <td>${item.name}</td>
                <td>${getCategoryName(item.category)}</td>
                <td>${item.unit}</td>
                <td>${item.minStock}</td>
                <td>${currentStock}</td>
                <td><span class="badge ${status.class}">${status.text}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editItem('${item.code}')">
                        <i class='bx bx-edit'></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteItem('${item.code}')">
                        <i class='bx bx-trash'></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function getCategoryName(category) {
    const categories = {
        'raw': '원재료',
        'sub': '부자재',
        'product': '제품'
    };
    return categories[category] || category;
}

function getItemStatus(item) {
    if (!item.currentStock || item.currentStock <= 0) {
        return { class: 'badge-danger', text: '부족' };
    } else if (item.currentStock <= item.minStock) {
        return { class: 'badge-warning', text: '저재고' };
    }
    return { class: 'badge-success', text: '정상' };
}

function saveItem() {
    const form = document.getElementById('itemForm');
    const formData = new FormData(form);
    const itemData = Object.fromEntries(formData.entries());

    // Validate required fields
    if (!itemData.code || !itemData.name || !itemData.category || !itemData.unit || !itemData.minStock) {
        alert('모든 필수 항목을 입력해주세요.');
        return;
    }

    // Check if this is an edit or new item
    const existingItemIndex = state.items.findIndex(item => item.code === itemData.code);
    
    if (existingItemIndex === -1) {
        // New item - check for duplicate code
        const existingItem = state.items.find(item => item.code === itemData.code);
        if (existingItem) {
            alert('이미 존재하는 품목코드입니다.');
            return;
        }

        // Add new item
        const newItem = {
            ...itemData,
            currentStock: 0,
            createdAt: new Date().toISOString()
        };
        state.items.push(newItem);
        showToast('품목이 등록되었습니다.');
    } else {
        // Edit existing item
        const updatedItem = {
            ...state.items[existingItemIndex],
            ...itemData,
            updatedAt: new Date().toISOString()
        };
        state.items[existingItemIndex] = updatedItem;
        showToast('품목이 수정되었습니다.');
    }

    saveCompanyState();
    commonModal.hide();
    loadItemsTable();
    // 재고현황 탭이 열려있으면 테이블도 갱신
    if (state.currentPage === 'inventory') {
        loadInventoryTable();
    }
}

function editItem(code) {
    const item = state.items.find(item => item.code === code);
    if (!item) return;

    const content = `
        <form id="itemForm">
            <div class="mb-3">
                <label class="form-label">품목코드</label>
                <input type="text" class="form-control" name="code" value="${item.code}" readonly>
            </div>
            <div class="mb-3">
                <label class="form-label">품목명 <span class="text-danger">*</span></label>
                <input type="text" class="form-control" name="name" value="${item.name}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">분류 <span class="text-danger">*</span></label>
                <select class="form-control" name="category" required>
                    <option value="raw" ${item.category === 'raw' ? 'selected' : ''}>원재료</option>
                    <option value="sub" ${item.category === 'sub' ? 'selected' : ''}>부자재</option>
                    <option value="product" ${item.category === 'product' ? 'selected' : ''}>제품</option>
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">단위 <span class="text-danger">*</span></label>
                <input type="text" class="form-control" name="unit" value="${item.unit}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">최소재고 <span class="text-danger">*</span></label>
                <input type="number" class="form-control" name="minStock" value="${item.minStock}" required>
            </div>
        </form>
    `;
    showModal('품목 수정', content);
    
    const saveBtn = document.getElementById('modalSaveBtn');
    if (saveBtn) {
        saveBtn.style.display = 'block';
        saveBtn.textContent = '수정';
    }
}

function deleteItem(code) {
    if (confirm('정말로 이 품목을 삭제하시겠습니까?')) {
        state.items = state.items.filter(item => item.code !== code);
        saveCompanyState();
        loadItemsTable();
        showToast('품목이 삭제되었습니다.');
        // 재고현황 탭이 열려있으면 테이블도 갱신
        if (state.currentPage === 'inventory') {
            loadInventoryTable();
        }
    }
}

// Toast Notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }, 100);
}

// Partners Management
function loadPartners() {
    if (!isLoggedIn()) {
        navigateTo('login');
        return;
    }
    
    showLoading('거래처 목록을 불러오는 중...');
    
    // 비동기로 처리하여 UI 블로킹 방지
    setTimeout(() => {
        const content = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">거래처 관리</h5>
                    <div>
                        <button class="btn btn-success me-2" onclick="showBulkUploadModal()">
                            <i class='bx bx-upload'></i> 엑셀 일괄등록
                        </button>
                        <button class="btn btn-primary" onclick="showPartnerModal()">
                            <i class='bx bx-plus'></i> 거래처 등록
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead class="table-light sticky-top">
                                    <tr>
                                        <th>사업자등록번호</th>
                                        <th>상호명</th>
                                        <th>대표자</th>
                                        <th>업태</th>
                                        <th>종목</th>
                                        <th>연락처</th>
                                        <th>관리</th>
                                    </tr>
                                </thead>
                                <tbody id="partnersTableBody">
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div id="pagination-container" class="d-flex justify-content-center mt-3"></div>
                </div>
            </div>
        `;
        mainContent.innerHTML = content;
        
        loadPartnersTable();
        hideLoading();
    }, 50);
}

function loadPartnersTable() {
    const tbody = document.getElementById('partnersTableBody');
    if (!tbody) return;

    const page = state.partnersCurrentPage || 1;
    const itemsPerPage = 10;
    const totalItems = state.partners.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const pagedPartners = state.partners.slice(startIndex, endIndex);

    tbody.innerHTML = '';
    const fragment = document.createDocumentFragment();

    pagedPartners.forEach(partner => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${partner.businessNumber}</td>
            <td>${partner.name}</td>
            <td>${partner.representative}</td>
            <td>${partner.businessType || '-'}</td>
            <td>${partner.businessCategory || '-'}</td>
            <td>${partner.phone || '-'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editPartner('${partner.businessNumber}')">
                    <i class='bx bx-edit'></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deletePartner('${partner.businessNumber}')">
                    <i class='bx bx-trash'></i>
                </button>
            </td>
        `;
        fragment.appendChild(row);
    });

    tbody.appendChild(fragment);

    renderPagination('partners', totalPages, page);
}

function savePartner() {
    const form = document.getElementById('partnerForm');
    const formData = new FormData(form);
    const partnerData = Object.fromEntries(formData.entries());

    // Validate required fields
    if (!partnerData.businessNumber || !partnerData.name || !partnerData.representative) {
        alert('필수 항목을 모두 입력해주세요.');
        return;
    }

    // Validate business number format
    const businessNumberPattern = /^[0-9]{3}-[0-9]{2}-[0-9]{5}$/;
    if (!businessNumberPattern.test(partnerData.businessNumber)) {
        alert('사업자등록번호 형식이 올바르지 않습니다. (예: 000-00-00000)');
        return;
    }

    // 중복 체크 (사업자등록번호 기준)
    const cleanBusinessNumber = partnerData.businessNumber.replace(/-/g, '');
    const existingPartner = state.partners.find(
        partner => partner.businessNumber.replace(/-/g, '') === cleanBusinessNumber
    );

    if (existingPartner) {
        alert('이미 등록된 사업자등록번호입니다.');
        return;
    }

    // Add new partner
    const newPartner = {
        ...partnerData,
        createdAt: new Date().toISOString()
    };
    state.partners.push(newPartner);
    
    saveCompanyState();
    commonModal.hide();
    
    // 마지막 페이지로 이동하여 새 거래처 확인
    state.partnersCurrentPage = Math.ceil(state.partners.length / 10);
    loadPartnersTable();
    showToast('거래처가 등록되었습니다.');
}

function editPartner(businessNumber) {
    const partner = state.partners.find(partner => partner.businessNumber === businessNumber);
    if (!partner) return;

    const content = `
        <form id="partnerForm">
            <div class="mb-3">
                <label class="form-label">사업자등록번호 <span class="text-danger">*</span></label>
                <input type="text" class="form-control" name="businessNumber" id="editPartnerBusinessNumberInput" value="${partner.businessNumber}" readonly>
            </div>
            <div class="mb-3">
                <label class="form-label">상호명 <span class="text-danger">*</span></label>
                <input type="text" class="form-control" name="name" value="${partner.name}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">대표자명 <span class="text-danger">*</span></label>
                <input type="text" class="form-control" name="representative" value="${partner.representative}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">업태</label>
                <input type="text" class="form-control" name="businessType" value="${partner.businessType || ''}">
            </div>
            <div class="mb-3">
                <label class="form-label">종목</label>
                <input type="text" class="form-control" name="businessCategory" value="${partner.businessCategory || ''}">
            </div>
            <div class="mb-3">
                <label class="form-label">연락처</label>
                <input type="tel" class="form-control" name="phone" value="${partner.phone || ''}"
                    placeholder="000-0000-0000" pattern="[0-9]{3}-[0-9]{4}-[0-9]{4}">
                <div class="form-text">형식: 000-0000-0000</div>
            </div>
            <div class="mb-3">
                <label class="form-label">이메일</label>
                <input type="email" class="form-control" name="email" value="${partner.email || ''}">
            </div>
            <div class="mb-3">
                <label class="form-label">주소</label>
                <input type="text" class="form-control" name="address" value="${partner.address || ''}">
            </div>
        </form>
    `;
    showModal('거래처 수정', content);
    
    const saveBtn = document.getElementById('modalSaveBtn');
    if (saveBtn) {
        saveBtn.style.display = 'block';
        saveBtn.textContent = '수정';
    }
}

function deletePartner(businessNumber) {
    if (confirm('정말로 이 거래처를 삭제하시겠습니까?')) {
        state.partners = state.partners.filter(p => p.businessNumber !== businessNumber);
        saveCompanyState();
        loadPartnersTable();
        showToast('거래처가 삭제되었습니다.');
    }
}

function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        let partners = loadPartners();
        const existingBusinessNumbers = new Set(partners.map(p => p.businessNumber.replace(/-/g, '')));

        let addedCount = 0;
        let skippedCount = 0;

        json.forEach(row => {
            const businessNumber = row['등록번호'] || row['사업자번호'];
            if (businessNumber) {
                const businessNumberClean = String(businessNumber).replace(/-/g, '');
                if (!existingBusinessNumbers.has(businessNumberClean)) {
                    const newPartner = {
                        businessNumber: String(businessNumber),
                        name: row['상호(법인명)'] || row['거래처명'] || '',
                        ceo: row['대표자명'] || '',
                        phone: '',
                        email: row['이메일'] || '',
                        address: row['주소'] || '',
                        // Add other fields with default values if necessary
                        id: generateId(),
                        group: '',
                        contactPerson: '',
                        contactPhone: '',
                        fax: '',
                        industry: '',
                        category: '',
                        notes: '',
                        manager: '',
                        memo: '',
                        lastModified: new Date().toISOString(),
                        registrationDate: new Date().toISOString(),
                        bankName: '',
                        accountNumber: '',
                        accountHolder: ''
                    };
                    partners.push(newPartner);
                    existingBusinessNumbers.add(businessNumberClean);
                    addedCount++;
                } else {
                    skippedCount++;
                }
            }
        });

        const companyKey = getCurrentCompanyBusinessNumber();
        if (companyKey) {
            localStorage.setItem(`partners_${companyKey}`, JSON.stringify(partners));
        }

        loadPartnersTable();
        showToast(`${addedCount}개의 신규 거래처를 추가했습니다. (중복 ${skippedCount}개 제외)`);
    };

    reader.readAsArrayBuffer(file);
    
    // Reset file input to allow re-uploading the same file
    event.target.value = '';
}

// Purchase Management
function loadPurchases() {
    if (!isLoggedIn()) {
        navigateTo('login');
        return;
    }
    const content = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">매입 관리</h5>
                <div>
                    <button class="btn btn-success me-2" id="downloadPurchaseExcelBtn">
                        <i class='bx bx-download'></i> 엑셀 다운로드
                    </button>
                <button class="btn btn-primary" onclick="showPurchaseModal()">
                    <i class='bx bx-plus'></i> 매입 등록
                </button>
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th><input type="checkbox" id="purchaseCheckAll"></th>
                                <th>거래일자</th>
                                <th>거래처</th>
                                <th>부가세구분</th>
                                <th>품목명</th>
                                <th>수량</th>
                                <th>단가</th>
                                <th>공급가액</th>
                                <th>세액</th>
                                <th>관리</th>
                            </tr>
                        </thead>
                        <tbody id="purchasesTableBody">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    mainContent.innerHTML = content;
    loadPurchasesTable();
    // 엑셀 다운로드 버튼 이벤트
    document.getElementById('downloadPurchaseExcelBtn').addEventListener('click', downloadSelectedPurchasesExcel);
    // 전체 선택 체크박스 이벤트
    document.getElementById('purchaseCheckAll').addEventListener('change', function() {
        document.querySelectorAll('.purchase-check').forEach(cb => { cb.checked = this.checked; });
    });
}

function loadPurchasesTable() {
    const tbody = document.getElementById('purchasesTableBody');
    tbody.innerHTML = '';
    state.purchases.forEach(purchase => {
        const partner = state.partners.find(p => p.businessNumber === purchase.partner);
        const item = state.items.find(i => i.code === purchase.item);
        // 부가세구분 값 보정: purchase.taxType이 없으면 taxable로 간주
        let taxType = purchase.taxType;
        if (!taxType) taxType = 'taxable';
        const taxTypeText = taxType === 'taxable' ? '과세' : (taxType === 'taxFree' ? '면세' : '');
        const row = `
            <tr>
                <td><input type="checkbox" class="purchase-check" value="${purchase.id}"></td>
                <td>${purchase.date}</td>
                <td>${partner ? partner.name : 'Unknown'}</td>
                <td>${taxTypeText}</td>
                <td>${item ? item.name : 'Unknown'}</td>
                <td>${purchase.quantity}</td>
                <td>${formatCurrency(purchase.price)}</td>
                <td>${formatCurrency(purchase.supplyAmount)}</td>
                <td>${formatCurrency(purchase.taxAmount)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editPurchase('${purchase.id}')">
                        <i class='bx bx-edit'></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deletePurchase('${purchase.id}')">
                        <i class='bx bx-trash'></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function downloadSelectedPurchasesExcel() {
    // 선택된 거래 id 수집
    const checked = Array.from(document.querySelectorAll('.purchase-check:checked')).map(cb => cb.value);
    if (checked.length === 0) {
        alert('다운로드할 거래를 선택하세요.');
        return;
    }
    // 헤더 순서 및 필수/공란 필드 정의
    const headers = [
        '입고일자','구분','거래처명','사업자번호','부가세구분','프로젝트/현장','창고','품목월일','품목코드','품목명','규격','수량','단위','단가','매입금액','세액'
    ];
    const required = ['입고일자','거래처명','사업자번호','부가세구분','품목월일','품목명','수량','단가'];
    // 데이터 변환
    const rows = checked.map(id => {
        const p = state.purchases.find(x => x.id === id);
        if (!p) return Array(headers.length).fill('');
        const partner = state.partners.find(x => x.businessNumber === p.partner);
        const item = state.items.find(x => x.code === p.item);
        return [
            p.date || '', // 입고일자
            '', // 구분
            partner ? partner.name : '', // 거래처명
            partner ? partner.businessNumber : '', // 사업자번호
            p.taxType === 'taxable' ? '과세' : (p.taxType === 'taxFree' ? '면세' : ''), // 부가세구분
            '', // 프로젝트/현장
            '', // 창고
            p.date || '', // 품목월일
            item ? item.code : '', // 품목코드
            item ? item.name : '', // 품목명
            '', // 규격
            p.quantity || '', // 수량
            item ? item.unit : '', // 단위
            p.price || '', // 단가
            p.supplyAmount || '', // 매입금액
            p.taxAmount || '' // 세액
        ];
    });
    // 엑셀(xlsx) 변환 (라이브러리 없으면 CSV로)
    if (window.XLSX) {
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '매입내역');
        XLSX.writeFile(wb, '매입내역.xlsx');
    } else {
        // CSV fallback
        let csv = headers.join(',') + '\n';
        rows.forEach(r => { csv += r.map(v => '"'+String(v).replace(/"/g,'""')+'"').join(',') + '\n'; });
        const blob = new Blob([csv], {type:'text/csv'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = '매입내역.csv';
        a.click();
    }
}

// Sales Management
function loadSales() {
    if (!isLoggedIn()) {
        navigateTo('login');
        return;
    }
    const content = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">매출 관리</h5>
                <div>
                    <button class="btn btn-success me-2" id="downloadSalesExcelBtn">
                        <i class='bx bx-download'></i> 엑셀 다운로드
                    </button>
                <button class="btn btn-primary" onclick="showSalesModal()">
                    <i class='bx bx-plus'></i> 매출 등록
                </button>
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th><input type="checkbox" id="salesCheckAll"></th>
                                <th>거래일자</th>
                                <th>출고처</th>
                                <th>부가세구분</th>
                                <th>품목명</th>
                                <th>수량</th>
                                <th>단가</th>
                                <th>총액</th>
                                <th>관리</th>
                            </tr>
                        </thead>
                        <tbody id="salesTableBody">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    mainContent.innerHTML = content;
    loadSalesTable();

    // 엑셀 다운로드 버튼 이벤트
    document.getElementById('downloadSalesExcelBtn').addEventListener('click', downloadSelectedSalesExcel);
    // 전체 선택 체크박스 이벤트
    document.getElementById('salesCheckAll').addEventListener('change', function() {
        document.querySelectorAll('.sales-check').forEach(cb => { cb.checked = this.checked; });
    });
}

function loadSalesTable() {
    const tbody = document.getElementById('salesTableBody');
    tbody.innerHTML = '';

    state.sales.forEach(sale => {
        const partner = state.partners.find(p => p.businessNumber === sale.partner);
        const item = state.items.find(i => i.code === sale.item);
        let taxType = sale.taxType;
        if (!taxType) taxType = 'taxable';
        const taxTypeText = taxType === 'taxable' ? '과세' : (taxType === 'taxFree' ? '면세' : '');
        const row = `
            <tr>
                <td><input type="checkbox" class="sales-check" value="${sale.id}"></td>
                <td>${sale.date}</td>
                <td>${partner ? partner.name : 'Unknown'}</td>
                <td>${taxTypeText}</td>
                <td>${item ? item.name : 'Unknown'}</td>
                <td>${sale.quantity}</td>
                <td>${formatCurrency(sale.price)}</td>
                <td>${formatCurrency(sale.totalAmount)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editSale('${sale.id}')">
                        <i class='bx bx-edit'></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteSale('${sale.id}')">
                        <i class='bx bx-trash'></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function downloadSelectedSalesExcel() {
    const checked = Array.from(document.querySelectorAll('.sales-check:checked')).map(cb => cb.value);
    if (checked.length === 0) {
        alert('다운로드할 거래를 선택하세요.');
        return;
    }

    const headers = [
        '출고일자', '구분', '거래처명', '사업자번호', '부가세구분', '프로젝트/현장', '창고', '품목월일',
        '품목코드', '품목명', '규격', '수량', '단위', '단가', '매출금액', '세액'
    ];

    const rows = checked.map(id => {
        const s = state.sales.find(x => x.id === id);
        if (!s) return Array(headers.length).fill('');
        const partner = state.partners.find(x => x.businessNumber === s.partner);
        const item = state.items.find(x => x.code === s.item);
        return [
            s.date || '', // 출고일자
            '', // 구분
            partner ? partner.name : '', // 거래처명
            partner ? partner.businessNumber : '', // 사업자번호
            s.taxType === 'taxable' ? '과세' : (s.taxType === 'taxFree' ? '면세' : ''), // 부가세구분
            '', // 프로젝트/현장
            '', // 창고
            s.date || '', // 품목월일
            item ? item.code : '', // 품목코드
            item ? item.name : '', // 품목명
            '', // 규격
            s.quantity || '', // 수량
            item ? item.unit : '', // 단위
            s.price || '', // 단가
            s.supplyAmount || '', // 매출금액
            s.taxAmount || '' // 세액
        ];
    });

    if (window.XLSX) {
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '매출내역');
        XLSX.writeFile(wb, '매출내역.xlsx');
    } else {
        let csv = headers.join(',') + '\n';
        rows.forEach(r => { csv += r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',') + '\n'; });
        const blob = new Blob([csv], {type: 'text/csv'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = '매출내역.csv';
        a.click();
    }
}

// Inventory Status Page
function loadInventory() {
    if (!isLoggedIn()) {
        navigateTo('login');
        return;
    }
    const content = `
        <div class="card">
            <div class="card-header d-flex flex-column align-items-start">
                <h5 class="mb-2">재고현황</h5>
                <div style="width: 300px;">
                    <input id="inventoryItemSearch" class="form-control" placeholder="품목코드 또는 품목명 검색..." autocomplete="off">
                    <div id="inventoryItemDropdown" class="modern-search-dropdown"></div>
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>품목코드</th>
                                <th>품목명</th>
                                <th>총매입수량</th>
                                <th>총매입금액</th>
                                <th>평균매입단가</th>
                                <th>총판매수량</th>
                                <th>총매출금액</th>
                                <th>단위당이익</th>
                                <th>총이익</th>
                                <th>마진율(%)</th>
                                <th>현재재고</th>
                            </tr>
                        </thead>
                        <tbody id="inventoryTableBody">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    mainContent.innerHTML = content;
    setupInventoryItemSearch();
    loadInventoryTable();
}

let inventoryItemSearchValue = '';
function setupInventoryItemSearch() {
    const input = document.getElementById('inventoryItemSearch');
    const dropdown = document.getElementById('inventoryItemDropdown');
    let filtered = [];
    let selectedIdx = -1;
    function renderDropdown() {
        dropdown.innerHTML = '';
        if (filtered.length === 0) {
            dropdown.style.display = 'none';
            return;
        }
        filtered.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'modern-search-item' + (idx === selectedIdx ? ' active' : '');
            div.textContent = `${item.code} - ${item.name}`;
            div.tabIndex = 0;
            div.onmouseenter = () => { selectedIdx = idx; updateActive(); };
            div.onclick = () => selectItem(idx);
            dropdown.appendChild(div);
        });
        dropdown.style.display = 'block';
    }
    function updateActive() {
        Array.from(dropdown.children).forEach((el, idx) => {
            el.classList.toggle('active', idx === selectedIdx);
        });
    }
    function selectItem(idx) {
        if (filtered[idx]) {
            input.value = `${filtered[idx].code} - ${filtered[idx].name}`;
            inventoryItemSearchValue = filtered[idx].code;
            dropdown.style.display = 'none';
            loadInventoryTable();
        }
    }
    function filterList() {
        const val = input.value.trim().toLowerCase();
        if (!val) {
            filtered = state.items.map(i => ({ code: i.code, name: i.name }));
        } else {
            filtered = state.items.filter(i =>
                i.code.toLowerCase().includes(val) ||
                i.name.toLowerCase().includes(val)
            ).map(i => ({ code: i.code, name: i.name }));
        }
        selectedIdx = filtered.length > 0 ? 0 : -1;
        renderDropdown();
    }
    input.addEventListener('input', filterList);
    input.addEventListener('focus', filterList);
    input.addEventListener('keydown', (e) => {
        if (dropdown.style.display !== 'block') return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (filtered.length > 0) {
                selectedIdx = (selectedIdx + 1) % filtered.length;
                updateActive();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (filtered.length > 0) {
                selectedIdx = (selectedIdx - 1 + filtered.length) % filtered.length;
                updateActive();
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIdx >= 0) selectItem(selectedIdx);
        } else if (e.key === 'Escape') {
            dropdown.style.display = 'none';
        }
    });
    document.addEventListener('click', function docClick(e) {
        if (!input.parentNode.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
    // 전체 보기 초기화
    inventoryItemSearchValue = '';
    input.value = '';
}

function loadInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    tbody.innerHTML = '';
    // 품목코드 검색값 적용
    let itemsToShow = state.items;
    if (inventoryItemSearchValue) {
        itemsToShow = state.items.filter(i => i.code === inventoryItemSearchValue);
    }
    itemsToShow.forEach(item => {
        // 매입/매출 전체 집계
        const purchases = state.purchases.filter(p => p.item === item.code);
        const sales = state.sales.filter(s => s.item === item.code);
        let totalPurchasedQuantity = 0, totalPurchasedAmount = 0;
        purchases.forEach(p => {
            const quantity = Number(p.quantity);
            const price = Number(p.price);
            totalPurchasedQuantity += quantity;
            totalPurchasedAmount += quantity * price;
        });
        let totalSoldQuantity = 0, totalSalesAmount = 0;
        sales.forEach(s => {
            const quantity = Number(s.quantity);
            const price = Number(s.price);
            totalSoldQuantity += quantity;
            totalSalesAmount += quantity * price;
        });
        const avgPurchasePrice = totalPurchasedQuantity > 0 ? totalPurchasedAmount / totalPurchasedQuantity : 0;
        const avgSalesPrice = totalSoldQuantity > 0 ? totalSalesAmount / totalSoldQuantity : 0;
        // 단위당이익 = 매출단가 - 평균매입단가 (가중평균법 적용)
        const unitProfit = avgSalesPrice - avgPurchasePrice;
        // 총이익 = 단위당이익 × 총매출수량
        const totalProfit = unitProfit * totalSoldQuantity;
        const marginRate = totalSalesAmount > 0 ? (totalProfit / totalSalesAmount) * 100 : 0;
        let stock = 0;
        purchases.forEach(p => { stock += Number(p.quantity); });
        sales.forEach(s => { stock -= Number(s.quantity); });

        let unitProfitText = '-';
        let totalProfitText = formatCurrency(0);
        let marginRateText = '-';

        if (totalSoldQuantity > 0) {
            const avgSalesPrice = totalSalesAmount / totalSoldQuantity;
            const unitProfit = avgSalesPrice - avgPurchasePrice;
            const totalProfit = unitProfit * totalSoldQuantity;
            const marginRate = totalSalesAmount > 0 ? (totalProfit / totalSalesAmount) * 100 : 0;
            
            unitProfitText = formatCurrency(unitProfit);
            totalProfitText = formatCurrency(totalProfit);
            marginRateText = marginRate.toFixed(1);
        }

        const row = `
            <tr>
                <td>${item.code}</td>
                <td>${item.name}</td>
                <td>${totalPurchasedQuantity}</td>
                <td>${formatCurrency(totalPurchasedAmount)}</td>
                <td>${formatCurrency(avgPurchasePrice)}</td>
                <td>${totalSoldQuantity}</td>
                <td>${formatCurrency(totalSalesAmount)}</td>
                <td>${unitProfitText}</td>
                <td>${totalProfitText}</td>
                <td>${marginRateText}</td>
                <td>${stock}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// Chart Initialization
function initializeCharts() {
    // Sales Chart
    const salesCtx = document.getElementById('salesChart').getContext('2d');
    new Chart(salesCtx, {
        type: 'line',
        data: {
            labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
            datasets: [{
                label: '매출액',
                data: [0, 0, 0, 0, 0, 0],
                borderColor: '#3498db',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Inventory Chart
    const inventoryCtx = document.getElementById('inventoryChart').getContext('2d');
    new Chart(inventoryCtx, {
        type: 'doughnut',
        data: {
            labels: ['정상', '저재고', '부족'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#2ecc71', '#f1c40f', '#e74c3c']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW'
    }).format(amount);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function saveCompanyState() {
    const businessNumber = getCurrentCompanyBusinessNumber();
    if (businessNumber) {
        saveCompanyData(businessNumber);
    }
}

function createModernSearchDropdown(input, items, onSelect) {
    const dropdown = document.createElement('div');
    dropdown.className = 'searchable-select-dropdown';
    dropdown.style.display = 'none';
    
    let filtered = [...items];
    let selectedIdx = -1;
    
    function renderDropdown() {
        dropdown.innerHTML = '';
        if (filtered.length === 0) {
            dropdown.style.display = 'none';
            return;
        }
        
        filtered.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'modern-search-item' + (idx === selectedIdx ? ' active' : '');
            div.textContent = item.text;
            div.tabIndex = 0;
            div.onmouseenter = () => { selectedIdx = idx; updateActive(); };
            div.onclick = () => selectItem(idx);
            dropdown.appendChild(div);
        });
        dropdown.style.display = 'block';
    }
    
    function updateActive() {
        Array.from(dropdown.children).forEach((el, idx) => {
            el.classList.toggle('active', idx === selectedIdx);
        });
    }
    
    function selectItem(idx) {
        if (filtered[idx]) {
            onSelect(filtered[idx]);
            dropdown.style.display = 'none';
        }
    }
    
    function filterList() {
        const val = input.value.trim().toLowerCase();
        if (!val) {
            filtered = [...items];
        } else {
            filtered = items.filter(item =>
                item.text.toLowerCase().includes(val) ||
                item.value.toLowerCase().includes(val)
            );
        }
        selectedIdx = filtered.length > 0 ? 0 : -1;
        renderDropdown();
    }
    
    input._dropdownFilterList = filterList;
    
    input.addEventListener('input', filterList);
    input.addEventListener('focus', filterList);
    input.addEventListener('keydown', (e) => {
        if (dropdown.style.display !== 'block') return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (filtered.length > 0) {
                selectedIdx = (selectedIdx + 1) % filtered.length;
                updateActive();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (filtered.length > 0) {
                selectedIdx = (selectedIdx - 1 + filtered.length) % filtered.length;
                updateActive();
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIdx >= 0) selectItem(selectedIdx);
        } else if (e.key === 'Escape') {
            dropdown.style.display = 'none';
        }
    });
    
    document.addEventListener('click', function docClick(e) {
        if (!input.parentNode.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
    
    input.parentNode.style.position = 'relative';
    input.parentNode.appendChild(dropdown);
}

function showModal(title, content) {
    const modalTitle = document.querySelector('#commonModal .modal-title');
    const modalBody = document.querySelector('#commonModal .modal-body');
    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    commonModal.show();
}

// Export functions for use in HTML
window.showItemModal = () => {
    const content = `
        <form id="itemForm">
            <div class="mb-3">
                <label class="form-label">품목코드 <span class="text-danger">*</span></label>
                <input type="text" class="form-control" name="code" required>
            </div>
            <div class="mb-3">
                <label class="form-label">품목명 <span class="text-danger">*</span></label>
                <input type="text" class="form-control" name="name" required>
            </div>
            <div class="mb-3">
                <label class="form-label">분류 <span class="text-danger">*</span></label>
                <select class="form-control" name="category" required>
                    <option value="raw">원재료</option>
                    <option value="sub">부자재</option>
                    <option value="product">제품</option>
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">단위 <span class="text-danger">*</span></label>
                <input type="text" class="form-control" name="unit" required>
            </div>
            <div class="mb-3">
                <label class="form-label">최소재고 <span class="text-danger">*</span></label>
                <input type="number" class="form-control" name="minStock" required>
            </div>
        </form>
    `;
    showModal('품목 등록', content);

    const saveBtn = document.getElementById('modalSaveBtn');
    if (saveBtn) {
        saveBtn.style.display = 'block';
        saveBtn.textContent = '등록';
    }
};

window.showPartnerModal = () => {
    const content = `
        <form id="partnerForm">
            <div class="mb-3">
                <label class="form-label">사업자등록번호 <span class="text-danger">*</span></label>
                <input type="text" class="form-control" name="businessNumber" id="partnerBusinessNumberInput" required 
                    placeholder="000-00-00000" maxlength="12">
                <div class="form-text">형식: 000-00-00000</div>
            </div>
            <div class="mb-3">
                <label class="form-label">상호명 <span class="text-danger">*</span></label>
                <input type="text" class="form-control" name="name" required>
            </div>
            <div class="mb-3">
                <label class="form-label">대표자명 <span class="text-danger">*</span></label>
                <input type="text" class="form-control" name="representative" required>
            </div>
            <div class="mb-3">
                <label class="form-label">업태</label>
                <input type="text" class="form-control" name="businessType">
            </div>
            <div class="mb-3">
                <label class="form-label">종목</label>
                <input type="text" class="form-control" name="businessCategory">
            </div>
            <div class="mb-3">
                <label class="form-label">연락처</label>
                <input type="tel" class="form-control" name="phone" 
                    placeholder="000-0000-0000" pattern="[0-9]{3}-[0-9]{4}-[0-9]{4}">
                <div class="form-text">형식: 000-0000-0000</div>
            </div>
            <div class="mb-3">
                <label class="form-label">이메일</label>
                <input type="email" class="form-control" name="email">
            </div>
            <div class="mb-3">
                <label class="form-label">주소</label>
                <input type="text" class="form-control" name="address">
            </div>
        </form>
    `;
    showModal('거래처 등록', content);
    
    // 사업자등록번호 자동 하이픈 추가
    const businessNumberInput = document.getElementById('partnerBusinessNumberInput');
    if (businessNumberInput) {
        businessNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 남기기
            if (value.length > 0) {
                if (value.length <= 3) {
                    value = value;
                } else if (value.length <= 5) {
                    value = value.slice(0, 3) + '-' + value.slice(3);
                } else {
                    value = value.slice(0, 3) + '-' + value.slice(3, 5) + '-' + value.slice(5, 10);
                }
            }
            e.target.value = value;
        });
    }

    const saveBtn = document.getElementById('modalSaveBtn');
    if (saveBtn) {
        saveBtn.style.display = 'block';
        saveBtn.textContent = '등록';
    }
};

window.showPurchaseModal = (purchaseToEdit = null) => {
    // 1. 품목이 없으면 안내 메시지 표시 후 종료
    if (!state.items || state.items.length === 0) {
        showModal('매입 등록', `
            <div class="alert alert-warning text-center my-4">
                매입 등록을 위해 먼저 <b>품목</b>을 등록해 주세요.
            </div>
        `);
        // 등록/수정 버튼 숨기기
        const saveBtn = document.getElementById('modalSaveBtn');
        if(saveBtn) saveBtn.style.display = 'none';
        return;
    }

    const isEdit = purchaseToEdit !== null;
    const title = isEdit ? '매입 수정' : '매입 등록';

    // 2. 모달 HTML 정의
    const content = `
        <form id="purchaseForm" autocomplete="off">
            <input type="hidden" name="purchaseId" value="${isEdit ? purchaseToEdit.id : ''}">
            <div class="row mb-2">
                <div class="col-md-6 mb-2">
                    <label class="form-label">거래일자 <span class="text-danger">*</span></label>
                    <div class="date-input-group d-flex align-items-center gap-1">
                        <input type="text" maxlength="4" class="form-control date-year" id="purchaseYear" placeholder="YYYY" autocomplete="off">
                        -
                        <input type="text" maxlength="2" class="form-control date-month" id="purchaseMonth" placeholder="MM" autocomplete="off">
                        -
                        <input type="text" maxlength="2" class="form-control date-day" id="purchaseDay" placeholder="DD" autocomplete="off">
                    </div>
                </div>
                <div class="col-md-6 mb-2">
                    <label class="form-label">거래처 <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" name="partnerSearch" placeholder="거래처명 또는 사업자번호 검색" autocomplete="off" required>
                    <div class="searchable-select-dropdown" id="partnerDropdown"></div>
                </div>
                </div>
            <div class="mb-3">
                <label class="form-label">품목/수량/단가 <span class="text-danger">*</span></label>
                <div>
                <table class="table table-bordered table-sm mb-0 align-middle items-table" style="background:#f8fafc;">
                    <thead class="table-light">
                        <tr style="text-align:center;vertical-align:middle;border-bottom: 2px solid #dee2e6;">
                            <th style="width:25%">품목</th>
                            <th style="width:10%">수량</th>
                            <th style="width:15%">단가</th>
                            <th style="width:20%">부가세구분</th>
                            <th style="width:18%">합계</th>
                            <th style="width:12%"><button type="button" class="btn btn-outline-primary btn-sm add-row-btn" id="addPurchaseRow" title="행 추가" ${isEdit ? 'disabled' : ''}><i class='bx bx-plus'></i></button></th>
                        </tr>
                    </thead>
                    <tbody id="purchaseItemsBody"></tbody>
                </table>
                </div>
                </div>
            <div class="row mt-2 pt-2 justify-content-end text-end border-top">
                <div class="col-auto">
                    <div class="text-muted small">공급가액</div>
                    <div class="fw-bold" id="supplyAmount">₩0</div>
                </div>
                <div class="col-auto">
                    <div class="text-muted small">부가세</div>
                    <div class="fw-bold" id="taxAmount">₩0</div>
                </div>
                <div class="col-auto ms-4">
                    <div class="text-muted small">총액</div>
                    <div class="fw-bold fs-5" id="totalAmount">₩0</div>
                </div>
            </div>
        </form>
    `;
    
    // 3. 모달 표시 및 버튼 설정
    showModal(title, content);
    
    // 4. 모달 버튼 설정 (중요!)
    const saveBtn = document.getElementById('modalSaveBtn');
    if (saveBtn) {
        saveBtn.style.display = 'block';
        // 이벤트 리스너 클린업: 기존의 onclick을 제거합니다.
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

        if (isEdit) {
            newSaveBtn.textContent = '수정';
            newSaveBtn.addEventListener('click', updatePurchase);
        } else {
            newSaveBtn.textContent = '등록';
            newSaveBtn.addEventListener('click', savePurchase);
        }
    }
    
    window.editingPurchaseId = isEdit ? purchaseToEdit.id : null; // 호환성을 위해 유지

    // 5. 모달 내부 요소 가져오기
    const tbody = document.getElementById('purchaseItemsBody');
    const plusBtn = document.getElementById('addPurchaseRow');
    const partnerInput = document.querySelector('input[name="partnerSearch"]');
    const yearInput = document.getElementById('purchaseYear');
    const monthInput = document.getElementById('purchaseMonth');
    const dayInput = document.getElementById('purchaseDay');
    
    // 6. 행 추가/삭제 및 계산 로직
    let rowIdx = 0;
    const addPurchaseRow = (itemVal = '', qtyVal = '', priceVal = '', taxTypeVal = 'taxable') => {
        if (!tbody) return;
        const tr = document.createElement('tr');
        tr.style.background = '#fff';
        
        let itemDisplayText = '';
        const item = state.items.find(i => i.code === itemVal);
        if (item) {
            itemDisplayText = `${item.name} (${item.code})`;
        }

        tr.innerHTML = `
            <td><input type="text" class="form-control itemSearch" data-idx="${rowIdx}" placeholder="품목명 또는 코드 검색" autocomplete="off" value="${itemDisplayText}" ${isEdit ? 'readonly' : ''}><div class="searchable-select-dropdown"></div></td>
            <td><input type="number" class="form-control quantityInput" data-idx="${rowIdx}" min="1" placeholder="수량" value="${qtyVal}"></td>
            <td><input type="number" class="form-control priceInput" data-idx="${rowIdx}" min="0" placeholder="단가" value="${priceVal}"></td>
            <td><select class="form-select taxTypeSelect" data-idx="${rowIdx}"><option value="taxable" ${taxTypeVal==='taxable'?'selected':''}>과세</option><option value="taxFree" ${taxTypeVal==='taxFree'?'selected':''}>면세</option></select></td>
            <td class="rowSum text-end" data-idx="${rowIdx}">₩0</td>
            <td style="text-align:center;"><button type="button" class="btn btn-outline-danger btn-sm removeRowBtn" title="행 삭제" ${isEdit ? 'disabled' : ''}><i class='bx bx-minus'></i></button></td>
        `;
        tbody.appendChild(tr);

        const itemInput = tr.querySelector('.itemSearch');
        const updatePurchaseTotals = () => updateTotals('purchase');
        tr.querySelector('.quantityInput').addEventListener('input', updatePurchaseTotals);
        tr.querySelector('.priceInput').addEventListener('input', updatePurchaseTotals);
        tr.querySelector('.taxTypeSelect').addEventListener('change', updatePurchaseTotals);
        
        if (!isEdit) {
            itemInput.addEventListener('input', updatePurchaseTotals);
    setTimeout(() => {
    createModernSearchDropdown(
        itemInput,
        state.items.map(i => ({ value: i.code, text: `${i.name} (${i.code})` })),
                (item) => {
                    itemInput.value = item.text;
                        updatePurchaseTotals();
                }
            );
            itemInput.addEventListener('focus', () => {
                if (typeof itemInput._dropdownFilterList === 'function') {
                    itemInput._dropdownFilterList();
                }
            });
        }, 50);
        }

        if (tbody.children.length === 1 && !isEdit) {
            setTimeout(() => itemInput.focus(), 100);
        }
        rowIdx++;
        updatePurchaseTotals();
    };

    // 7. 이벤트 핸들러 바인딩
    createModernSearchDropdown(
        partnerInput,
        state.partners.map(p => ({ value: p.businessNumber, text: `${p.name} (${p.businessNumber})` })),
        (item) => { 
            window.selectedPartnerBusinessNumber = item.value;
            partnerInput.value = item.text;
        }
    );

    if (!isEdit) {
    if (plusBtn) {
        plusBtn.onclick = () => addPurchaseRow();
    }
    if (tbody) {
        tbody.onclick = function(e) {
            if (e.target.closest('.removeRowBtn')) {
                e.target.closest('tr')?.remove();
                    updateTotals('purchase');
                }
            };
        }
    }
    
    // 8. 데이터 채우기 및 초기화
    let year, month, day;
    if (isEdit && purchaseToEdit.date) {
        [year, month, day] = purchaseToEdit.date.split('-');
        const partnerObj = state.partners.find(p => p.businessNumber === purchaseToEdit.partner);
        if(partnerObj) {
            partnerInput.value = `${partnerObj.name} (${partnerObj.businessNumber})`;
            window.selectedPartnerBusinessNumber = partnerObj.businessNumber;
        }
    } else {
        const now = new Date();
        year = now.getFullYear();
        month = String(now.getMonth() + 1).padStart(2, '0');
        day = String(now.getDate()).padStart(2, '0');
    }
    yearInput.value = year;
    monthInput.value = month;
    dayInput.value = day;

    tbody.innerHTML = '';
    rowIdx = 0;
    if (isEdit) {
        addPurchaseRow(purchaseToEdit.item, purchaseToEdit.quantity, purchaseToEdit.price, purchaseToEdit.taxType);
    } else {
    addPurchaseRow();
    }
};

function deletePurchase(id) {
    if (confirm('정말로 이 매입을 삭제하시겠습니까?')) {
        state.purchases = state.purchases.filter(p => p.id !== id);
        saveCompanyState();
        loadPurchasesTable();
        showToast('매입이 삭제되었습니다.');
    }
}

function updatePurchase() {
    const form = document.getElementById('purchaseForm');
    const editingId = form.querySelector('input[name="purchaseId"]').value;

    if (!editingId) {
        alert('수정할 항목의 ID를 찾을 수 없습니다.');
        return;
    }

    const index = state.purchases.findIndex(p => p.id === editingId);
    if (index === -1) {
        alert('수정할 매입 항목을 찾을 수 없습니다.');
        return;
    }

    const year = document.getElementById('purchaseYear').value;
    const month = document.getElementById('purchaseMonth').value.padStart(2, '0');
    const day = document.getElementById('purchaseDay').value.padStart(2, '0');
    const date = `${year}-${month}-${day}`;
    
    const partner = window.selectedPartnerBusinessNumber;

    if (!date || !partner) {
        alert('거래일자와 거래처를 입력해주세요.');
        return;
    }

    const tr = document.querySelector('#purchaseItemsBody tr');
    if (!tr) {
        alert('매입 품목 정보를 찾을 수 없습니다.');
        return;
    }

    const quantity = Number(tr.querySelector('.quantityInput').value);
    const price = Number(tr.querySelector('.priceInput').value);
    const taxType = tr.querySelector('.taxTypeSelect').value;
    
    if (!quantity || price === undefined || price === null) {
        alert('수량과 단가를 올바르게 입력해주세요.');
        return;
    }

    const supplyAmount = quantity * price;
    const taxAmount = taxType === 'taxable' ? supplyAmount * 0.1 : 0;
    const totalAmount = supplyAmount + taxAmount;

    const updatedPurchase = {
        ...state.purchases[index],
        date,
        partner,
        quantity,
        price,
        supplyAmount,
        taxAmount,
        totalAmount,
        taxType,
        updatedAt: new Date().toISOString()
    };
    
    state.purchases[index] = updatedPurchase;
    
    saveCompanyState();
    commonModal.hide();
    loadPurchasesTable();
    showToast('매입이 수정되었습니다.');

    window.editingPurchaseId = null;
    window.selectedPartnerBusinessNumber = null;
}

function editPurchase(id) {
    const purchase = state.purchases.find(p => p.id === id);
    if (purchase) {
        showPurchaseModal(purchase);
    }
}

function editSale(id) {
    const sale = state.sales.find(s => s.id === id);
    if (!sale) return;
    
    showSalesModal(sale); // Pass sale object to pre-fill the form
}

function deleteSale(id) {
    if (confirm('정말로 이 매출을 삭제하시겠습니까?')) {
        state.sales = state.sales.filter(s => s.id !== id);
        saveCompanyState();
        loadSalesTable();
        showToast('매출이 삭제되었습니다.');
    }
}

// ... 기존 코드 ...
function updateTotals(type = 'purchase') {
    let supply = 0, tax = 0, total = 0;
    const containerId = type === 'purchase' ? '#purchaseItemsBody' : '#salesItemsBody';
    
    document.querySelectorAll(`${containerId} tr`).forEach(tr => {
        const qty = Number(tr.querySelector('.quantityInput').value) || 0;
        const price = Number(tr.querySelector('.priceInput').value) || 0;
        const taxType = tr.querySelector('.taxTypeSelect').value;
        const sum = qty * price;
        tr.querySelector('.rowSum').textContent = formatCurrency(sum);
        supply += sum;
        if (taxType === 'taxable') tax += sum * 0.1;
    });
    total = supply + tax;
    document.getElementById('supplyAmount').textContent = formatCurrency(supply);
    document.getElementById('taxAmount').textContent = formatCurrency(tax);
    document.getElementById('totalAmount').textContent = formatCurrency(total);
}
window.updateTotals = updateTotals;

function savePurchase() {
    // 신규 등록만 처리
    const year = document.getElementById('purchaseYear').value;
    const month = document.getElementById('purchaseMonth').value.padStart(2, '0');
    const day = document.getElementById('purchaseDay').value.padStart(2, '0');
    const date = `${year}-${month}-${day}`;
    
    const partner = window.selectedPartnerBusinessNumber;

    if (!date || !partner) {
        alert('거래일자와 거래처를 입력해주세요.');
        return;
    }

    const items = [];
    let hasError = false;
    document.querySelectorAll('#purchaseItemsBody tr').forEach(tr => {
        const itemText = tr.querySelector('.itemSearch').value.trim();
        let itemObj;
        if(itemText){
            const codeMatch = itemText.match(/\(([^)]+)\)$/);
            if (codeMatch) {
                itemObj = state.items.find(i => i.code === codeMatch[1]);
            } else {
                itemObj = state.items.find(i => i.name === itemText || i.code === itemText);
            }
        }
        
        const item = itemObj ? itemObj.code : '';
        const quantity = Number(tr.querySelector('.quantityInput').value);
        const price = Number(tr.querySelector('.priceInput').value);
        
        if (!item && !quantity && (price === undefined || price === null)) return; // Skip empty rows
        
        if (!item || !quantity || price === undefined || price === null) {
             hasError = true;
        }
        
        items.push({ 
            item, 
            quantity, 
            price, 
            taxType: tr.querySelector('.taxTypeSelect').value 
        });
    });

    if (hasError || items.length === 0) {
        alert('모든 품목의 품목, 수량, 단가를 올바르게 입력해주세요.');
        return;
    }

    items.forEach(({item, quantity, price, taxType}) => {
        const supplyAmount = quantity * price;
        const taxAmount = taxType === 'taxable' ? supplyAmount * 0.1 : 0;
        const totalAmount = supplyAmount + taxAmount;
        const newPurchase = {
            id: generateId(),
            date,
            partner,
            item,
            quantity,
            price,
            supplyAmount,
            taxAmount,
            totalAmount,
            taxType,
            createdAt: new Date().toISOString()
        };
        state.purchases.push(newPurchase);
    });
    
    showToast('매입이 등록되었습니다.');
    saveCompanyState();
    commonModal.hide();
    loadPurchasesTable();
    window.editingPurchaseId = null;
    window.selectedPartnerBusinessNumber = null;
}
window.savePurchase = savePurchase;

    // ... 기존 코드 ...
    setTimeout(() => {
        createModernSearchDropdown(
            itemInput,
            state.items.map(i => ({ value: i.code, text: `${i.name} (${i.code})` })),
            (item) => {
                itemInput.value = `${item.text}`;
                updateTotals();
            }
        );
        // 드롭다운 항상 보이게 포커스 시 강제 표시 (filterList 직접 호출)
        itemInput.addEventListener('focus', function() {
            if (typeof itemInput._dropdownFilterList === 'function') {
                itemInput._dropdownFilterList();
            } else {
                const event = new Event('input', { bubbles: true });
                itemInput.dispatchEvent(event);
            }
        });
    }, 50);
    // ... 기존 코드 ...

    window.showSalesModal = (saleToEdit = null) => {
        if (!state.items || state.items.length === 0) {
            showModal('매출 등록', `
                <div class="alert alert-warning text-center my-4">
                    매출 등록을 위해 먼저 <b>품목</b>을 등록해 주세요.
                </div>
            `);
            return;
        }

        const isEdit = saleToEdit !== null;
        const title = isEdit ? '매출 수정' : '매출 등록';

        const content = `
            <form id="salesForm" autocomplete="off">
                <div class="row mb-2">
                    <div class="col-md-6 mb-2">
                        <label class="form-label">거래일자 <span class="text-danger">*</span></label>
                        <div class="date-input-group d-flex align-items-center gap-1">
                            <input type="text" maxlength="4" class="form-control date-year" id="salesYear" placeholder="YYYY" autocomplete="off">
                            -
                            <input type="text" maxlength="2" class="form-control date-month" id="salesMonth" placeholder="MM" autocomplete="off">
                            -
                            <input type="text" maxlength="2" class="form-control date-day" id="salesDay" placeholder="DD" autocomplete="off">
                    </div>
                    </div>
                    <div class="col-md-6 mb-2">
                        <label class="form-label">출고처 <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" name="partnerSearch" placeholder="거래처명 또는 사업자번호 검색" autocomplete="off" required>
                        <div class="searchable-select-dropdown" id="partnerDropdown"></div>
                    </div>
                    </div>
                    <div class="mb-3">
                    <label class="form-label">품목/수량/단가 <span class="text-danger">*</span></label>
                    <div>
                    <table class="table table-bordered table-sm mb-0 align-middle items-table" style="background:#f8fafc;">
                        <thead class="table-light">
                            <tr style="text-align:center;vertical-align:middle;border-bottom: 2px solid #dee2e6;">
                                <th style="width:25%">품목</th>
                                <th style="width:10%">수량</th>
                                <th style="width:15%">단가</th>
                                <th style="width:20%">부가세구분</th>
                                <th style="width:18%">합계</th>
                                <th style="width:12%"><button type="button" class="btn btn-outline-primary btn-sm add-row-btn" id="addSalesRow" title="행 추가" ${isEdit ? 'disabled' : ''}><i class='bx bx-plus'></i></button></th>
                            </tr>
                        </thead>
                        <tbody id="salesItemsBody"></tbody>
                    </table>
                    </div>
                </div>
                <div class="row mt-2 pt-2 justify-content-end text-end border-top">
                    <div class="col-auto">
                        <div class="text-muted small">공급가액</div>
                        <div class="fw-bold" id="supplyAmount">₩0</div>
            </div>
                    <div class="col-auto">
                        <div class="text-muted small">부가세</div>
                        <div class="fw-bold" id="taxAmount">₩0</div>
                    </div>
                    <div class="col-auto ms-4">
                        <div class="text-muted small">총액</div>
                        <div class="fw-bold fs-5" id="totalAmount">₩0</div>
                    </div>
                </div>
            </form>
        `;

        showModal(title, content);
        
        const saveBtn = document.getElementById('modalSaveBtn');
        if (saveBtn) {
            saveBtn.style.display = 'block';
            saveBtn.textContent = isEdit ? '수정' : '등록';
        }

        window.editingSaleId = isEdit ? saleToEdit.id : null; 

        const yearInput = document.getElementById('salesYear');
        const monthInput = document.getElementById('salesMonth');
        const dayInput = document.getElementById('salesDay');
        const partnerInput = document.querySelector('input[name="partnerSearch"]');
        const tbody = document.getElementById('salesItemsBody');
        
        // Set Date
        let year, month, day;
        if (isEdit && saleToEdit.date) {
            [year, month, day] = saleToEdit.date.split('-');
        } else {
            const now = new Date();
            year = now.getFullYear();
            month = String(now.getMonth() + 1).padStart(2, '0');
            day = String(now.getDate()).padStart(2, '0');
        }
        yearInput.value = year;
        monthInput.value = month;
        dayInput.value = day;

        let rowIdx = 0;

        const addSalesRow = (itemCode = '', qtyVal = '', priceVal = '', taxTypeVal = 'taxable') => {
            if (!tbody) return;
            const tr = document.createElement('tr');
            tr.style.background = '#fff';

            let itemDisplayText = '';
            if (isEdit) {
                const item = state.items.find(i => i.code === itemCode);
                itemDisplayText = item ? `${item.name} (${item.code})` : '';
            }
            
            tr.innerHTML = `
                <td><input type="text" class="form-control itemSearch" data-idx="${rowIdx}" placeholder="품목명 또는 코드 검색" autocomplete="off" value="${itemDisplayText}" ${isEdit ? 'readonly' : ''}><div class="searchable-select-dropdown"></div></td>
                <td><input type="number" class="form-control quantityInput" data-idx="${rowIdx}" min="1" placeholder="수량" value="${qtyVal}"></td>
                <td><input type="number" class="form-control priceInput" data-idx="${rowIdx}" min="0" placeholder="단가" value="${priceVal}"></td>
                <td><select class="form-select taxTypeSelect" data-idx="${rowIdx}"><option value="taxable" ${taxTypeVal === 'taxable' ? 'selected' : ''}>과세</option><option value="taxFree" ${taxTypeVal === 'taxFree' ? 'selected' : ''}>면세</option></select></td>
                <td class="rowSum text-end" data-idx="${rowIdx}">₩0</td>
                <td style="text-align:center;"><button type="button" class="btn btn-outline-danger btn-sm removeRowBtn" title="행 삭제" ${isEdit ? 'disabled' : ''}><i class='bx bx-minus'></i></button></td>
            `;
            tbody.appendChild(tr);

            const itemInput = tr.querySelector('.itemSearch');
            const updateSalesTotals = () => updateTotals('sales');
            tr.querySelector('.quantityInput').addEventListener('input', updateSalesTotals);
            tr.querySelector('.priceInput').addEventListener('input', updateSalesTotals);
            tr.querySelector('.taxTypeSelect').addEventListener('change', updateSalesTotals);
            
            if (!isEdit) {
                itemInput.addEventListener('input', updateSalesTotals);
    setTimeout(() => {
                    createModernSearchDropdown(
                        itemInput,
                        state.items.map(i => ({ value: i.code, text: `${i.name} (${i.code})` })),
                        (item) => {
                            itemInput.value = item.text;
                            updateSalesTotals();
                        }
                    );
                    itemInput.addEventListener('focus', () => {
                        if (typeof itemInput._dropdownFilterList === 'function') {
                            itemInput._dropdownFilterList();
                        }
                    });
                }, 50);
            }

            if (tbody.children.length === 1 && !isEdit) {
                setTimeout(() => itemInput.focus(), 100);
            }
            rowIdx++;
            updateSalesTotals();
        };

        const partnerObj = isEdit ? state.partners.find(p => p.businessNumber === saleToEdit.partner) : null;
        if(partnerObj) {
            partnerInput.value = `${partnerObj.name} (${partnerObj.businessNumber})`;
            window.selectedPartnerBusinessNumber = partnerObj.businessNumber;
        }

        createModernSearchDropdown(
            partnerInput,
            state.partners.map(p => ({ value: p.businessNumber, text: `${p.name} (${p.businessNumber})` })),
            (item) => {
                window.selectedPartnerBusinessNumber = item.value;
                partnerInput.value = item.text;
            }
        );

        if (!isEdit) {
            const plusBtn = document.getElementById('addSalesRow');
            if (plusBtn) plusBtn.onclick = () => addSalesRow();
            if (tbody) {
                tbody.onclick = function (e) {
                    if (e.target.closest('.removeRowBtn')) {
                        e.target.closest('tr')?.remove();
                        updateTotals('sales');
                    }
                };
            }
        }
        
        tbody.innerHTML = '';
        rowIdx = 0;
        if (isEdit) {
            addSalesRow(saleToEdit.item, saleToEdit.quantity, saleToEdit.price, saleToEdit.taxType);
            } else {
            addSalesRow();
        }
    };

    function deleteSale(id) {
        if (confirm('정말로 이 매출을 삭제하시겠습니까?')) {
            state.sales = state.sales.filter(s => s.id !== id);
            saveCompanyState();
            loadSalesTable();
            showToast('매출이 삭제되었습니다.');
        }
    }

    // ... 기존 코드 ...
    function updateTotals(type = 'purchase') {
        let supply = 0, tax = 0, total = 0;
        const containerId = type === 'purchase' ? '#purchaseItemsBody' : '#salesItemsBody';
        
        document.querySelectorAll(`${containerId} tr`).forEach(tr => {
            const qty = Number(tr.querySelector('.quantityInput').value) || 0;
            const price = Number(tr.querySelector('.priceInput').value) || 0;
            const taxType = tr.querySelector('.taxTypeSelect').value;
            const sum = qty * price;
            tr.querySelector('.rowSum').textContent = formatCurrency(sum);
            supply += sum;
            if (taxType === 'taxable') tax += sum * 0.1;
        });
        total = supply + tax;
        document.getElementById('supplyAmount').textContent = formatCurrency(supply);
        document.getElementById('taxAmount').textContent = formatCurrency(tax);
        document.getElementById('totalAmount').textContent = formatCurrency(total);
    }
    window.updateTotals = updateTotals;

    function savePurchase() {
    const yearInput = document.getElementById('purchaseYear');
    const monthInput = document.getElementById('purchaseMonth');
    const dayInput = document.getElementById('purchaseDay');
        const year = yearInput.value;
        const month = monthInput.value.padStart(2, '0');
        const day = dayInput.value.padStart(2, '0');
        const date = `${year}-${month}-${day}`;
    // 거래처 businessNumber 사용
    const partner = window.selectedPartnerBusinessNumber;
    if (!date || !partner) {
            alert('필수 항목을 모두 입력해주세요.');
            return;
        }
    const items = [];
    let hasError = false;
    document.querySelectorAll('#purchaseItemsBody tr').forEach(tr => {
        const itemText = tr.querySelector('.itemSearch').value.trim();
        let itemObj = state.items.find(i => i.code === itemText);
        if (!itemObj) itemObj = state.items.find(i => i.name === itemText);
        if (!itemObj) {
            const codeMatch = itemText.match(/\(([^)]+)\)$/);
            if (codeMatch) {
                itemObj = state.items.find(i => i.code === codeMatch[1]);
            }
        }
        const item = itemObj ? itemObj.code : '';
        const quantity = Number(tr.querySelector('.quantityInput').value);
        const price = Number(tr.querySelector('.priceInput').value);
        const taxType = tr.querySelector('.taxTypeSelect').value;
        if (!item && !quantity && !price) return;
        if (!item || !quantity || !price) hasError = true;
        items.push({ item, quantity, price, taxType });
    });
    if (hasError || items.length === 0) {
        alert('모든 품목, 수량, 단가, 부가세구분을 입력해주세요.');
        return;
    }
    // 각 품목별로 매입 등록
    items.forEach(({item, quantity, price, taxType}) => {
        const supplyAmount = quantity * price;
        const taxAmount = taxType === 'taxable' ? supplyAmount * 0.1 : 0;
        const totalAmount = supplyAmount + taxAmount;
        const newPurchase = {
            id: generateId(),
            date,
            partner, // businessNumber로 저장
            item,
            quantity,
            price,
            supplyAmount,
            taxAmount,
            totalAmount,
            taxType,
            createdAt: new Date().toISOString()
        };
        state.purchases.push(newPurchase);
    });
    saveCompanyState();
            commonModal.hide();
    loadPurchasesTable();
    showToast('매입이 등록되었습니다.');
}
    window.savePurchase = savePurchase;

    window.saveSales = function() {
        const editingId = window.editingSaleId;
        const year = document.getElementById('salesYear').value;
        const month = document.getElementById('salesMonth').value.padStart(2, '0');
        const day = document.getElementById('salesDay').value.padStart(2, '0');
        const date = `${year}-${month}-${day}`;
        const partner = window.selectedPartnerBusinessNumber;
        
        if (!date || !partner) {
            alert('거래일자와 출고처를 입력해주세요.');
            return;
        }

        if (editingId) {
            // Edit existing sale
            const index = state.sales.findIndex(s => s.id === editingId);
            if (index === -1) return;
            
            const tr = document.querySelector('#salesItemsBody tr');
            const quantity = Number(tr.querySelector('.quantityInput').value);
            const price = Number(tr.querySelector('.priceInput').value);
            const taxType = tr.querySelector('.taxTypeSelect').value;
            const isTaxable = taxType === 'taxable';

            if (!quantity || price === undefined || price === null) {
                alert('수량과 단가를 올바르게 입력해주세요.');
                return;
            }

            const supplyAmount = quantity * price;
            const taxAmount = isTaxable ? supplyAmount * 0.1 : 0;
            const totalAmount = supplyAmount + taxAmount;

            const updatedSale = {
                ...state.sales[index],
                date,
                partner,
                quantity,
                price,
                supplyAmount,
                taxAmount,
                totalAmount,
                taxType,
                updatedAt: new Date().toISOString()
            };
            
            state.sales[index] = updatedSale;
            showToast('매출이 수정되었습니다.');

        } else {
            // Add new sales
            const items = [];
            let hasError = false;
            document.querySelectorAll('#salesItemsBody tr').forEach(tr => {
                const itemText = tr.querySelector('.itemSearch').value.trim();
                let itemObj;
                if(itemText){
                    const codeMatch = itemText.match(/\(([^)]+)\)$/);
                    if (codeMatch) {
                        itemObj = state.items.find(i => i.code === codeMatch[1]);
                    }
                }
                const item = itemObj ? itemObj.code : '';
                const quantity = Number(tr.querySelector('.quantityInput').value);
                const price = Number(tr.querySelector('.priceInput').value);
                const taxType = tr.querySelector('.taxTypeSelect').value;
                if (!item && !quantity && !price) return; // Skip empty rows
                if (!item || !quantity || price === undefined || price === null) hasError = true;
                items.push({ item, quantity, price, taxType });
            });

            if (hasError || items.length === 0) {
                alert('모든 품목의 품목, 수량, 단가를 올바르게 입력해주세요.');
                return;
            }

            items.forEach(({item, quantity, price, taxType}) => {
                const supplyAmount = quantity * price;
                const taxAmount = taxType === 'taxable' ? supplyAmount * 0.1 : 0;
                const totalAmount = supplyAmount + taxAmount;
                const newSale = {
                    id: generateId(),
                    date,
                    partner,
                    item,
                    quantity,
                    price,
                    supplyAmount,
                    taxAmount,
                    totalAmount,
                    taxType,
                    createdAt: new Date().toISOString()
                };
                state.sales.push(newSale);
            });
            showToast('매출이 등록되었습니다.');
        }

        saveCompanyState();
        commonModal.hide();
        loadSalesTable();
        window.editingSaleId = null;
        window.selectedPartnerBusinessNumber = null;
    }

    // ... 기존 코드 ...
    setTimeout(() => {
        createModernSearchDropdown(
            itemInput,
            state.items.map(i => ({ value: i.code, text: `${i.name} (${i.code})` })),
            (item) => {
                itemInput.value = `${item.text}`;
                updateTotals();
            }
        );
        // 드롭다운 항상 보이게 포커스 시 강제 표시 (filterList 직접 호출)
        itemInput.addEventListener('focus', function() {
            if (typeof itemInput._dropdownFilterList === 'function') {
                itemInput._dropdownFilterList();
            } else {
                const event = new Event('input', { bubbles: true });
                itemInput.dispatchEvent(event);
            }
        });
    }, 50);
    // ... 기존 코드 ...

    // Login Management
    function loadLogin() {
        if (isLoggedIn()) {
            navigateTo('dashboard');
            return;
        }
        const content = `
            <div class="row justify-content-center">
                <div class="col-md-6 col-lg-4">
                    <div class="card">
                        <div class="card-header text-center">
                            <h4>사용자 로그인</h4>
                        </div>
                        <div class="card-body">
                            <form id="loginForm">
                                <div class="mb-3">
                                    <label class="form-label">사업자등록번호</label>
                                    <input type="text" class="form-control" name="businessNumber" id="businessNumberInput" required 
                                        placeholder="000-00-00000" maxlength="12">
                                    <div class="form-text">형식: 000-00-00000</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">아이디</label>
                                    <input type="text" class="form-control" name="userId" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">비밀번호</label>
                                    <input type="password" class="form-control" name="password" required>
                                </div>
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary">로그인</button>
                                    <button type="button" class="btn btn-outline-secondary" onclick="showSignupModal()">회원가입</button>
                                </div>
                            </form>
                            <hr>
                            <div class="text-center">
                                <button type="button" class="btn btn-link text-secondary" onclick="showAdminLoginModal()">관리자 로그인</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        mainContent.innerHTML = content;
        
        // 사업자등록번호 자동 하이픈 추가
        const businessNumberInput = document.getElementById('businessNumberInput');
        businessNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 남기기
            if (value.length > 0) {
                if (value.length <= 3) {
                    value = value;
                } else if (value.length <= 5) {
                    value = value.slice(0, 3) + '-' + value.slice(3);
                } else {
                    value = value.slice(0, 3) + '-' + value.slice(3, 5) + '-' + value.slice(5, 10);
                }
            }
            e.target.value = value;
        });
        
        // 로그인 폼 이벤트 리스너
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const userId = formData.get('userId');
            const businessNumber = formData.get('businessNumber');
            const password = formData.get('password');
            
            if (userId && businessNumber && password) {
                // 사업자등록번호 형식 검증
                const businessNumberPattern = /^[0-9]{3}-[0-9]{2}-[0-9]{5}$/;
                if (!businessNumberPattern.test(businessNumber)) {
                    alert('사업자등록번호 형식이 올바르지 않습니다. (예: 000-00-00000)');
                    return;
                }
                
                // 승인된 사용자인지 확인
                const approvedUsers = getApprovedUsers();
                const approvedUser = approvedUsers.find(user => 
                    user.businessNumber === businessNumber && 
                    user.userId === userId && 
                    user.password === password
                );
                
                if (!approvedUser) {
                    // 승인 대기 중인지 확인
                    const pendingUsers = getPendingUsers();
                    const pendingUser = pendingUsers.find(user => 
                        user.businessNumber === businessNumber && user.userId === userId
                    );
                    
                    if (pendingUser) {
                        alert('회원가입이 승인 대기 중입니다. 관리자 승인 후 로그인이 가능합니다.');
                    } else {
                        alert('사업자등록번호, 아이디, 비밀번호를 확인해주세요.');
                    }
                    return;
                }
                
                // 승인된 사용자 로그인 처리
                localStorage.setItem('loginUserId', userId);
                localStorage.setItem('loginBusinessNumber', businessNumber);
                localStorage.setItem('isLoggedIn', 'true');
                
                // 기업별 데이터 로드
                loadCompanyData(businessNumber);
                
                showToast('로그인되었습니다.');
                navigateTo('dashboard');
                renderLogoutBtn(); // 로그인 후 로그아웃 버튼 렌더링
            } else {
                alert('아이디, 사업자등록번호, 비밀번호를 모두 입력해주세요.');
            }
        });
    }

    function renderLogoutBtn() {
        // 기존 로그아웃 버튼 제거
        const existingLogout = document.querySelector('.logout-container');
        if (existingLogout) {
            existingLogout.remove();
        }
        
        // 로그인 상태일 때만 로그아웃 버튼 표시
        if (isLoggedIn()) {
            const logoutContainer = document.createElement('div');
            logoutContainer.className = 'logout-container';
            
            // 관리자인 경우 관리자 패널 버튼 추가
            if (isAdmin()) {
                const adminBtn = document.createElement('button');
                adminBtn.className = 'btn btn-outline-warning logout-btn mb-2';
                adminBtn.innerHTML = '<i class="bx bx-cog"></i> <span>관리자 패널</span>';
                adminBtn.onclick = showAdminPanel;
                logoutContainer.appendChild(adminBtn);
            }
            
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'btn btn-outline-danger logout-btn';
            logoutBtn.innerHTML = '<i class="bx bx-log-out"></i> <span>로그아웃</span>';
            logoutBtn.onclick = logout;
            logoutContainer.appendChild(logoutBtn);
            
            // 사이드바 하단에 추가
            const sidebar = document.getElementById('sidebar');
            sidebar.appendChild(logoutContainer);
        }
    }

    function isLoggedIn() {
        return localStorage.getItem('isLoggedIn') === 'true';
    }

    function logout() {
        if (confirm('로그아웃하시겠습니까?')) {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('loginUserId');
            localStorage.removeItem('loginBusinessNumber');
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('adminViewingBusinessNumber');

            // state 초기화
            state = {
                items: [],
                partners: [],
                purchases: [],
                sales: [],
                currentPage: 'login',
                sidebarCollapsed: state.sidebarCollapsed
            };
            
            showToast('로그아웃되었습니다.');
            navigateTo('login');
        }
    }

    function getCompanyNameFromBNo(businessNumber) {
        if (!businessNumber) return null;
        const approvedUsers = getApprovedUsers();
        const user = approvedUsers.find(u => u.businessNumber === businessNumber);
        return user ? user.companyName : null;
    }

    function updatePageTitle(baseTitle) {
        if (!isAdmin()) return; // 관리자가 아닌 경우 업데이트하지 않음
        
        const businessNumber = getCurrentCompanyBusinessNumber();
        const companyName = getCompanyNameFromBNo(businessNumber);
        
        // 페이지 제목 업데이트
        const titleElement = document.querySelector('.card-header h5');
        if (titleElement) {
            if (companyName) {
                titleElement.textContent = `${baseTitle} - ${companyName}`;
            } else {
                titleElement.textContent = baseTitle;
            }
    }
}

function showBulkUploadModal() {
    const content = `
        <div class="bulk-upload-container">
            <div class="alert alert-info">
                <h6><i class='bx bx-info-circle'></i> 엑셀 일괄등록 안내</h6>
                <ul class="mb-0">
                    <li>엑셀 파일의 첫 번째 행은 헤더로 인식됩니다.</li>
                    <li>필수 컬럼: <strong>법인명</strong>, <strong>등록번호</strong></li>
                    <li>선택 컬럼: <strong>대표자명</strong>, <strong>이메일</strong>, <strong>주소</strong></li>
                    <li>사업자등록번호가 중복되는 경우 등록되지 않습니다.</li>
                </ul>
            </div>
            
            <div class="mb-3">
                <label class="form-label">엑셀 파일 선택</label>
                <input type="file" class="form-control" id="bulkUploadFile" accept=".xlsx,.xls" onchange="handleBulkUpload(event)">
                <div class="form-text">지원 형식: .xlsx, .xls</div>
            </div>
            
            <div id="uploadPreview" class="mt-3" style="display: none;">
                <h6>업로드 미리보기</h6>
                <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                    <table class="table table-sm table-bordered">
                        <thead class="table-light sticky-top">
                            <tr>
                                <th>법인명</th>
                                <th>등록번호</th>
                                <th>대표자명</th>
                                <th>이메일</th>
                                <th>주소</th>
                                <th>상태</th>
                            </tr>
                        </thead>
                        <tbody id="uploadPreviewBody"></tbody>
                    </table>
                </div>
                <div class="mt-3">
                    <button class="btn btn-primary" onclick="confirmBulkUpload()">
                        <i class='bx bx-check'></i> 일괄등록 실행
                    </button>
                    <button class="btn btn-secondary ms-2" onclick="cancelBulkUpload()">
                        <i class='bx bx-x'></i> 취소
                    </button>
                </div>
            </div>
        </div>
    `;
    
    showModal('거래처 엑셀 일괄등록', content);
    
    // 모달 저장 버튼 숨기기 (일괄등록에서는 불필요)
    const saveBtn = document.getElementById('modalSaveBtn');
    if (saveBtn) {
        saveBtn.style.display = 'none';
    }
}

function handleBulkUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);

            if (json.length === 0) {
                alert('엑셀 파일에 데이터가 없습니다.');
                return;
            }

            // 기존 거래처 사업자등록번호 목록 (중복 체크용)
            const existingBusinessNumbers = new Set(
                state.partners.map(p => p.businessNumber.replace(/-/g, ''))
            );

            // 데이터 처리 및 미리보기 생성
            const processedData = [];
            let validCount = 0;
            let duplicateCount = 0;
            let invalidCount = 0;

            json.forEach((row, index) => {
                const companyName = row['법인명'] || row['상호(법인명)'] || row['거래처명'] || '';
                const businessNumber = row['등록번호'] || row['사업자번호'] || '';
                const representative = row['대표자명'] || row['대표자'] || '';
                const email = row['이메일'] || '';
                const address = row['주소'] || '';

                // 사업자등록번호 정리 (하이픈 제거)
                const cleanBusinessNumber = String(businessNumber).replace(/-/g, '');

                let status = 'valid';
                let statusText = '등록 가능';
                let statusClass = 'text-success';

                // 유효성 검사
                if (!companyName || !cleanBusinessNumber) {
                    status = 'invalid';
                    statusText = '필수 정보 누락';
                    statusClass = 'text-danger';
                    invalidCount++;
                } else if (existingBusinessNumbers.has(cleanBusinessNumber)) {
                    status = 'duplicate';
                    statusText = '중복 (기존 등록)';
                    statusClass = 'text-warning';
                    duplicateCount++;
                } else {
                    validCount++;
                    existingBusinessNumbers.add(cleanBusinessNumber); // 중복 방지를 위해 추가
                }

                processedData.push({
                    companyName,
                    businessNumber: cleanBusinessNumber,
                    representative,
                    email,
                    address,
                    status,
                    statusText,
                    statusClass
                });
            });

            // 미리보기 표시
            const previewBody = document.getElementById('uploadPreviewBody');
            previewBody.innerHTML = processedData.map(item => `
                <tr>
                    <td>${item.companyName}</td>
                    <td>${item.businessNumber}</td>
                    <td>${item.representative}</td>
                    <td>${item.email}</td>
                    <td>${item.address}</td>
                    <td class="${item.statusClass}">${item.statusText}</td>
                </tr>
            `).join('');

            // 통계 표시
            const previewDiv = document.getElementById('uploadPreview');
            previewDiv.style.display = 'block';
            
            // 통계 정보 추가
            const statsHtml = `
                <div class="alert alert-info mb-3">
                    <div class="row text-center">
                        <div class="col-md-4">
                            <div class="text-success fw-bold">${validCount}</div>
                            <small>등록 가능</small>
                        </div>
                        <div class="col-md-4">
                            <div class="text-warning fw-bold">${duplicateCount}</div>
                            <small>중복 제외</small>
                        </div>
                        <div class="col-md-4">
                            <div class="text-danger fw-bold">${invalidCount}</div>
                            <small>오류</small>
                        </div>
                    </div>
                </div>
            `;
            previewDiv.insertAdjacentHTML('afterbegin', statsHtml);

            // 전역 변수에 처리된 데이터 저장
            window.bulkUploadData = processedData.filter(item => item.status === 'valid');

        } catch (error) {
            console.error('엑셀 파일 처리 오류:', error);
            alert('엑셀 파일을 처리하는 중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
        }
    };

    reader.readAsArrayBuffer(file);
}

function confirmBulkUpload() {
    if (!window.bulkUploadData || window.bulkUploadData.length === 0) {
        alert('등록할 데이터가 없습니다.');
        return;
    }

    if (confirm(`총 ${window.bulkUploadData.length}개의 거래처를 등록하시겠습니까?`)) {
        showLoading('거래처를 등록하는 중...');
        
        // 비동기로 처리하여 UI 블로킹 방지
        setTimeout(() => {
            let addedCount = 0;
            
            window.bulkUploadData.forEach(item => {
                // 사업자등록번호에 하이픈 추가
                const formattedBusinessNumber = item.businessNumber.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3');
                
                const newPartner = {
                    businessNumber: formattedBusinessNumber,
                    name: item.companyName,
                    representative: item.representative,
                    email: item.email,
                    address: item.address,
                    phone: '',
                    businessType: '',
                    businessCategory: '',
                    createdAt: new Date().toISOString()
                };
                
                state.partners.push(newPartner);
                addedCount++;
            });

            saveCompanyState();
            commonModal.hide();
            
            state.partnersCurrentPage = Math.ceil(state.partners.length / 10);
            loadPartnersTable();
            
            hideLoading();
            showToast(`${addedCount}개의 거래처가 일괄등록되었습니다.`);
            
            // 전역 변수 정리
            window.bulkUploadData = null;
        }, 100);
    }
}

function cancelBulkUpload() {
    // 파일 입력 초기화
    const fileInput = document.getElementById('bulkUploadFile');
    if (fileInput) {
        fileInput.value = '';
    }
    
    // 미리보기 숨기기
    const previewDiv = document.getElementById('uploadPreview');
    if (previewDiv) {
        previewDiv.style.display = 'none';
    }
    
    // 전역 변수 정리
    window.bulkUploadData = null;
}

// 전역 함수로 등록
window.showBulkUploadModal = showBulkUploadModal;
window.handleBulkUpload = handleBulkUpload;
window.confirmBulkUpload = confirmBulkUpload;
window.cancelBulkUpload = cancelBulkUpload;
window.showLoading = showLoading;
window.hideLoading = hideLoading;

function renderPagination(key, totalPages, currentPage) {
    const container = document.getElementById('pagination-container');
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let paginationHTML = '<nav><ul class="pagination">';

    // Previous button
    paginationHTML += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="event.preventDefault(); changePage('${key}', ${currentPage - 1})">이전</a>
    </li>`;

    // Page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (currentPage <= 3) {
        endPage = Math.min(5, totalPages);
    }
    if (currentPage > totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
    }
    
    if (startPage > 1) {
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="event.preventDefault(); changePage('${key}', 1)">1</a></li>`;
        if (startPage > 2) {
            paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<li class="page-item ${i === currentPage ? 'active' : ''}">
            <a class="page-link" href="#" onclick="event.preventDefault(); changePage('${key}', ${i})">${i}</a>
        </li>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="event.preventDefault(); changePage('${key}', ${totalPages})">${totalPages}</a></li>`;
    }

    // Next button
    paginationHTML += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="event.preventDefault(); changePage('${key}', ${currentPage + 1})">다음</a>
    </li>`;

    paginationHTML += '</ul></nav>';
    container.innerHTML = paginationHTML;
}

function changePage(key, page) {
    const items = state[key];
    if (!items) return;
    const totalPages = Math.ceil(items.length / 10);
    if (page < 1 || page > totalPages) return;

    state[key + 'CurrentPage'] = page;
    
    switch(key) {
        case 'partners':
            loadPartnersTable();
            break;
    }
}
window.changePage = changePage;