// 전역 상태 관리
const state = {
  currentPage: 1,
  totalPages: 1,
  selectedAnnouncement: null,
  allKeywords: [], // 제외 키워드 전체 목록
  currentView: 'active', // 'active', 'excluded', 'keywords'
  filters: {
    title: '',
    site_type: '',
    date_type: '',
    date_from: '',
    date_to: ''
  }
};

// DOM 요소
const elements = {
  loadingIndicator: document.getElementById('loadingIndicator'),
  errorMessage: document.getElementById('errorMessage'),
  tableBody: document.getElementById('tableBody'),
  pagination: document.getElementById('pagination'),
  totalCount: document.getElementById('totalCount'),
  refreshBtn: document.getElementById('refreshBtn'),
  // 검색 폼
  searchForm: document.getElementById('searchForm'),
  searchTitle: document.getElementById('searchTitle'),
  searchSiteType: document.getElementById('searchSiteType'),
  searchDateType: document.getElementById('searchDateType'),
  searchDateFrom: document.getElementById('searchDateFrom'),
  searchDateTo: document.getElementById('searchDateTo'),
  resetBtn: document.getElementById('resetBtn'),
  // 제외 키워드 모달
  modal: document.getElementById('keywordModal'),
  modalCloseBtn: document.getElementById('modalCloseBtn'),
  cancelBtn: document.getElementById('cancelBtn'),
  searchBtn: document.getElementById('searchBtn'),
  registerBtn: document.getElementById('registerBtn'),
  keywordInput: document.getElementById('keywordInput'),
  searchResultsList: document.getElementById('searchResultsList'),
  searchResultCount: document.getElementById('searchResultCount'),
  // 상세 모달
  detailModal: document.getElementById('detailModal'),
  detailModalCloseBtn: document.getElementById('detailModalCloseBtn'),
  detailCloseBtn: document.getElementById('detailCloseBtn'),
  detailTitle: document.getElementById('detailTitle'),
  detailSiteInfo: document.getElementById('detailSiteInfo'),
  detailDate: document.getElementById('detailDate'),
  detailContentMd: document.getElementById('detailContentMd'),
  detailCombinedContent: document.getElementById('detailCombinedContent'),
  // SUBVENTION_MASTER 모달
  subventionModal: document.getElementById('subventionModal'),
  subventionModalCloseBtn: document.getElementById('subventionModalCloseBtn'),
  subventionCloseBtn: document.getElementById('subventionCloseBtn'),
  subventionData: document.getElementById('subventionData'),
  // 제외 키워드 관리 모달
  manageKeywordsBtn: document.getElementById('manageKeywordsBtn'),
  manageKeywordsModal: document.getElementById('manageKeywordsModal'),
  manageKeywordsModalCloseBtn: document.getElementById('manageKeywordsModalCloseBtn'),
  manageKeywordsCloseBtn: document.getElementById('manageKeywordsCloseBtn'),
  keywordsList: document.getElementById('keywordsList'),
  keywordsCount: document.getElementById('keywordsCount'),
  keywordSearchInput: document.getElementById('keywordSearchInput'),
  // 메뉴 네비게이션
  navActive: document.getElementById('navActive'),
  navExcluded: document.getElementById('navExcluded'),
  navKeywords: document.getElementById('navKeywords'),
  // 뷰 컨테이너
  announcementView: document.getElementById('announcementView'),
  keywordsView: document.getElementById('keywordsView'),
  keywordsGrid: document.getElementById('keywordsGrid'),
  // 키워드 상세 모달
  keywordDetailModal: document.getElementById('keywordDetailModal'),
  keywordDetailModalCloseBtn: document.getElementById('keywordDetailModalCloseBtn'),
  keywordDetailCloseBtn: document.getElementById('keywordDetailCloseBtn'),
  keywordDetailTitle: document.getElementById('keywordDetailTitle'),
  keywordDetailName: document.getElementById('keywordDetailName'),
  keywordDetailCount: document.getElementById('keywordDetailCount'),
  keywordDetailTableBody: document.getElementById('keywordDetailTableBody'),
  // 토스트
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toastMessage')
};

// 유틸리티 함수
function showLoading() {
  elements.loadingIndicator.classList.remove('hidden');
  elements.errorMessage.classList.add('hidden');
}

function hideLoading() {
  elements.loadingIndicator.classList.add('hidden');
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.classList.remove('hidden');
  hideLoading();
}

function showToast(message) {
  elements.toastMessage.textContent = message;
  elements.toast.classList.remove('hidden');

  setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 3000);
}

// API 호출 함수
async function fetchAnnouncements(page = 1, limit = 50, filters = {}) {
  try {
    // 쿼리 파라미터 생성
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    // 검색 조건 추가
    if (filters.title) params.append('title', filters.title);
    if (filters.site_type) params.append('site_type', filters.site_type);

    // 날짜 타입에 따른 파라미터 추가
    if (filters.date_type && filters.date_from && filters.date_to) {
      if (filters.date_type === 'created') {
        params.append('created_from', filters.date_from);
        params.append('created_to', filters.date_to);
      } else if (filters.date_type === 'announcement') {
        params.append('announcement_from', filters.date_from);
        params.append('announcement_to', filters.date_to);
      }
    }

    const response = await fetch(`/api/announcements?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`HTTP 오류: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '데이터를 불러오는데 실패했습니다.');
    }

    return result;
  } catch (error) {
    console.error('공고 목록 조회 실패:', error);
    throw error;
  }
}

async function searchAnnouncements(keyword) {
  try {
    const response = await fetch(`/api/announcements/search?keyword=${encodeURIComponent(keyword)}&limit=100`);

    if (!response.ok) {
      throw new Error(`HTTP 오류: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '공고 검색에 실패했습니다.');
    }

    return result;
  } catch (error) {
    console.error('공고 검색 실패:', error);
    throw error;
  }
}

async function fetchAnnouncementDetail(id) {
  try {
    const response = await fetch(`/api/announcements/${id}`);

    if (!response.ok) {
      throw new Error(`HTTP 오류: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '공고 상세 조회에 실패했습니다.');
    }

    return result.data;
  } catch (error) {
    console.error('공고 상세 조회 실패:', error);
    throw error;
  }
}

async function fetchSubventionMaster(sbvtId) {
  try {
    const response = await fetch(`/api/subvention/${sbvtId}`);

    if (!response.ok) {
      throw new Error(`HTTP 오류: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'SUBVENTION_MASTER 조회에 실패했습니다.');
    }

    return result.data;
  } catch (error) {
    console.error('SUBVENTION_MASTER 조회 실패:', error);
    throw error;
  }
}

async function registerExclusionKeyword(keyword) {
  try {
    const response = await fetch('/api/exclusion-keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ keyword })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '키워드 등록에 실패했습니다.');
    }

    return result;
  } catch (error) {
    console.error('키워드 등록 실패:', error);
    throw error;
  }
}

async function fetchExclusionKeywords() {
  try {
    const response = await fetch('/api/exclusion-keywords');

    if (!response.ok) {
      throw new Error(`HTTP 오류: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '제외 키워드 목록 조회에 실패했습니다.');
    }

    return result;
  } catch (error) {
    console.error('제외 키워드 목록 조회 실패:', error);
    throw error;
  }
}

async function deleteExclusionKeyword(id) {
  try {
    const response = await fetch(`/api/exclusion-keywords/${id}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '제외 키워드 삭제에 실패했습니다.');
    }

    return result;
  } catch (error) {
    console.error('제외 키워드 삭제 실패:', error);
    throw error;
  }
}

async function fetchExcludedAnnouncements(page = 1, limit = 50, filters = {}) {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (filters.title) params.append('title', filters.title);
    if (filters.site_type) params.append('site_type', filters.site_type);

    if (filters.date_type && filters.date_from && filters.date_to) {
      if (filters.date_type === 'created') {
        params.append('created_from', filters.date_from);
        params.append('created_to', filters.date_to);
      } else if (filters.date_type === 'announcement') {
        params.append('announcement_from', filters.date_from);
        params.append('announcement_to', filters.date_to);
      }
    }

    const response = await fetch(`/api/announcements/excluded?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`HTTP 오류: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '제외 공고 목록 조회에 실패했습니다.');
    }

    return result;
  } catch (error) {
    console.error('제외 공고 목록 조회 실패:', error);
    throw error;
  }
}

async function fetchKeywordAnnouncements(keyword) {
  try {
    const response = await fetch(`/api/exclusion-keywords/${encodeURIComponent(keyword)}/announcements`);

    if (!response.ok) {
      throw new Error(`HTTP 오류: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '키워드별 제외 공고 조회에 실패했습니다.');
    }

    return result;
  } catch (error) {
    console.error('키워드별 제외 공고 조회 실패:', error);
    throw error;
  }
}

// 테이블 렌더링
function renderTable(data) {
  if (!data || data.length === 0) {
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-message">데이터가 없습니다.</td>
      </tr>
    `;
    return;
  }

  elements.tableBody.innerHTML = data.map(item => {
    const isRegistered = item.sbvt_id !== null;
    const statusBadge = isRegistered
      ? '<span class="badge badge-registered">등록됨</span>'
      : '<span class="badge badge-pending">미등록</span>';

    const statusButton = isRegistered
      ? `<button class="btn btn-info view-subvention-btn" data-sbvt-id="${item.sbvt_id}">등록정보</button>`
      : '-';

    return `
      <tr>
        <td>${item.site_type || '-'}</td>
        <td>${item.site_code || '-'}</td>
        <td>
          ${escapeHtml(item.title) || '-'}
        </td>
        <td>
          ${item.origin_url
            ? `<a href="${escapeHtml(item.origin_url)}" target="_blank" class="url-link" rel="noopener noreferrer">링크 열기</a>`
            : '-'
          }
        </td>
        <td>${item.announcement_date || '-'}</td>
        <td>
          <button class="btn btn-detail detail-btn" data-id="${item.id}">상세</button>
        </td>
        <td>
          ${statusBadge}<br/>
          ${statusButton}
        </td>
        <td>
          <button class="btn btn-action exclude-btn" data-id="${item.id}" data-title="${escapeHtml(item.title)}">제외 키워드 등록</button>
        </td>
      </tr>
    `;
  }).join('');

  // 상세 버튼 이벤트 리스너 추가
  document.querySelectorAll('.detail-btn').forEach(btn => {
    btn.addEventListener('click', handleDetailClick);
  });

  // 등록정보 버튼 이벤트 리스너 추가
  document.querySelectorAll('.view-subvention-btn').forEach(btn => {
    btn.addEventListener('click', handleViewSubventionClick);
  });

  // 제외 키워드 등록 버튼 이벤트 리스너 추가
  document.querySelectorAll('.exclude-btn').forEach(btn => {
    btn.addEventListener('click', handleExcludeClick);
  });
}

// 제외 공고 테이블 렌더링
function renderExcludedTable(data) {
  if (!data || data.length === 0) {
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-message">데이터가 없습니다.</td>
      </tr>
    `;
    return;
  }

  elements.tableBody.innerHTML = data.map(item => {
    return `
      <tr>
        <td>${item.site_type || '-'}</td>
        <td>${item.site_code || '-'}</td>
        <td>${escapeHtml(item.title) || '-'}</td>
        <td>
          ${item.origin_url
            ? `<a href="${escapeHtml(item.origin_url)}" target="_blank" class="url-link" rel="noopener noreferrer">링크 열기</a>`
            : '-'
          }
        </td>
        <td>${item.announcement_date || '-'}</td>
        <td>
          <button class="btn btn-detail detail-btn" data-id="${item.id}">상세</button>
        </td>
        <td>
          <span class="keyword-badge">${escapeHtml(item.exclusion_keyword || '-')}</span><br/>
          <small class="exclusion-reason">${escapeHtml(item.exclusion_reason || '-')}</small>
        </td>
      </tr>
    `;
  }).join('');

  // 상세 버튼 이벤트 리스너 추가
  document.querySelectorAll('.detail-btn').forEach(btn => {
    btn.addEventListener('click', handleDetailClick);
  });
}

// HTML 이스케이프 함수
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// 페이지네이션 렌더링
function renderPagination(pagination) {
  if (!pagination || pagination.totalPages <= 1) {
    elements.pagination.innerHTML = '';
    return;
  }

  const { currentPage, totalPages, total } = pagination;
  state.currentPage = currentPage;
  state.totalPages = totalPages;

  // 전체 개수 업데이트
  elements.totalCount.textContent = `전체: ${total.toLocaleString()}건`;

  let html = '<button id="firstPage" ' + (currentPage === 1 ? 'disabled' : '') + '>처음</button>';
  html += '<button id="prevPage" ' + (currentPage === 1 ? 'disabled' : '') + '>이전</button>';

  // 페이지 번호 버튼 (현재 페이지 주변 5개)
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-number ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }

  html += '<button id="nextPage" ' + (currentPage === totalPages ? 'disabled' : '') + '>다음</button>';
  html += '<button id="lastPage" ' + (currentPage === totalPages ? 'disabled' : '') + '>마지막</button>';
  html += `<span class="page-info">${currentPage} / ${totalPages} 페이지</span>`;

  elements.pagination.innerHTML = html;

  // 페이지네이션 이벤트 리스너
  document.getElementById('firstPage')?.addEventListener('click', () => loadAnnouncements(1));
  document.getElementById('prevPage')?.addEventListener('click', () => loadAnnouncements(currentPage - 1));
  document.getElementById('nextPage')?.addEventListener('click', () => loadAnnouncements(currentPage + 1));
  document.getElementById('lastPage')?.addEventListener('click', () => loadAnnouncements(totalPages));

  document.querySelectorAll('.page-number').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const page = parseInt(e.target.dataset.page);
      loadAnnouncements(page);
    });
  });
}

// 공고 목록 로드
async function loadAnnouncements(page = 1) {
  try {
    showLoading();
    let result;

    if (state.currentView === 'active') {
      result = await fetchAnnouncements(page, 50, state.filters);
      renderTable(result.data);
    } else if (state.currentView === 'excluded') {
      result = await fetchExcludedAnnouncements(page, 50, state.filters);
      renderExcludedTable(result.data);
    }

    if (result) {
      renderPagination(result.pagination);
    }

    hideLoading();
  } catch (error) {
    showError(error.message);
  }
}

// 제외 키워드 뷰 렌더링
async function loadKeywordsView() {
  try {
    showLoading();
    const result = await fetchExclusionKeywords();

    if (!result.data || result.data.length === 0) {
      elements.keywordsGrid.innerHTML = '<div class="empty-message">등록된 제외 키워드가 없습니다.</div>';
      hideLoading();
      return;
    }

    elements.keywordsGrid.innerHTML = result.data.map(item => {
      const count = item.ACTUAL_EXCLUSION_COUNT || 0;
      return `
        <div class="keyword-card">
          <div class="keyword-card-header">
            <h3 class="keyword-card-title">${escapeHtml(item.KEYWORD)}</h3>
            <span class="keyword-card-count">${count}건</span>
          </div>
          <div class="keyword-card-footer">
            <small>등록일: ${item.CREATED_AT ? new Date(item.CREATED_AT).toLocaleDateString('ko-KR') : '-'}</small>
            <button class="btn btn-detail keyword-detail-btn" data-keyword="${escapeHtml(item.KEYWORD)}" data-count="${count}">상세</button>
          </div>
        </div>
      `;
    }).join('');

    // 상세 버튼 이벤트 리스너
    document.querySelectorAll('.keyword-detail-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const keyword = e.target.dataset.keyword;
        const count = e.target.dataset.count;
        openKeywordDetailModal(keyword, count);
      });
    });

    hideLoading();
  } catch (error) {
    showError(error.message);
  }
}

// 뷰 전환
function switchView(view) {
  state.currentView = view;

  // 네비게이션 버튼 활성화 상태 변경
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.remove('active');
  });

  if (view === 'active') {
    elements.navActive.classList.add('active');
    elements.announcementView.classList.remove('hidden');
    elements.keywordsView.classList.add('hidden');
    updateTableHeader(false);
    loadAnnouncements(1);
  } else if (view === 'excluded') {
    elements.navExcluded.classList.add('active');
    elements.announcementView.classList.remove('hidden');
    elements.keywordsView.classList.add('hidden');
    updateTableHeader(true);
    loadAnnouncements(1);
  } else if (view === 'keywords') {
    elements.navKeywords.classList.add('active');
    elements.announcementView.classList.add('hidden');
    elements.keywordsView.classList.remove('hidden');
    loadKeywordsView();
  }
}

// 테이블 헤더 업데이트
function updateTableHeader(isExcluded) {
  const thead = elements.tableBody.closest('table').querySelector('thead tr');

  if (isExcluded) {
    thead.innerHTML = `
      <th>사이트 유형</th>
      <th>사이트 코드</th>
      <th>제목</th>
      <th>원본 URL</th>
      <th>공고일자</th>
      <th>상세</th>
      <th>제외 키워드</th>
    `;
  } else {
    thead.innerHTML = `
      <th>사이트 유형</th>
      <th>사이트 코드</th>
      <th>제목</th>
      <th>원본 URL</th>
      <th>공고일자</th>
      <th>상세</th>
      <th>등록 상태</th>
      <th>작업</th>
    `;
  }
}

// 상세 버튼 클릭 핸들러
async function handleDetailClick(event) {
  const id = event.target.dataset.id;
  await openDetailModal(id);
}

// 등록정보 버튼 클릭 핸들러
async function handleViewSubventionClick(event) {
  const sbvtId = event.target.dataset.sbvtId;
  await openSubventionModal(sbvtId);
}

// 제외 키워드 등록 버튼 클릭 핸들러
function handleExcludeClick(event) {
  const id = event.target.dataset.id;
  const title = event.target.dataset.title;

  openKeywordModal({ id, title });
}

// 검색 폼 제출 핸들러
function handleSearchSubmit(event) {
  event.preventDefault();

  // 검색 조건 수집
  state.filters = {
    title: elements.searchTitle.value.trim(),
    site_type: elements.searchSiteType.value,
    date_type: elements.searchDateType.value,
    date_from: elements.searchDateFrom.value,
    date_to: elements.searchDateTo.value
  };

  // 첫 페이지로 이동하여 검색 실행
  state.currentPage = 1;
  loadAnnouncements(1);
}

// 검색 조건 초기화 핸들러
function handleReset() {
  // 폼 초기화
  elements.searchTitle.value = '';
  elements.searchSiteType.value = '';
  elements.searchDateType.value = '';
  elements.searchDateFrom.value = '';
  elements.searchDateTo.value = '';

  // 상태 초기화
  state.filters = {
    title: '',
    site_type: '',
    date_type: '',
    date_from: '',
    date_to: ''
  };

  // 첫 페이지로 이동하여 전체 목록 로드
  state.currentPage = 1;
  loadAnnouncements(1);
}

// 제외 키워드 모달 열기
function openKeywordModal(announcement) {
  state.selectedAnnouncement = announcement;

  // 선택된 제목을 키워드 기본값으로 설정
  elements.keywordInput.value = announcement.title || '';

  // 검색 결과 초기화
  elements.searchResultsList.innerHTML = '<div class="empty-message">키워드를 입력하고 \'찾기\' 버튼을 클릭하세요.</div>';
  elements.searchResultCount.textContent = '';

  // 모달 표시
  elements.modal.classList.remove('hidden');
}

// 공고 상세 모달 열기
async function openDetailModal(id) {
  try {
    // 로딩 표시
    elements.detailTitle.textContent = '로딩 중...';
    elements.detailSiteInfo.textContent = '';
    elements.detailDate.textContent = '';
    elements.detailContentMd.textContent = '';
    elements.detailCombinedContent.textContent = '';
    elements.detailModal.classList.remove('hidden');

    // 상세 정보 조회
    const data = await fetchAnnouncementDetail(id);

    // 정보 표시
    elements.detailTitle.textContent = data.title || '-';
    elements.detailSiteInfo.textContent = `${data.site_type || '-'} | ${data.site_code || '-'}`;
    elements.detailDate.textContent = data.announcement_date || '-';
    elements.detailContentMd.textContent = data.content_md || '내용이 없습니다.';
    elements.detailCombinedContent.textContent = data.combined_content || '내용이 없습니다.';
  } catch (error) {
    console.error('상세 정보 조회 실패:', error);
    alert(error.message);
    closeDetailModal();
  }
}

// SUBVENTION_MASTER 모달 열기
async function openSubventionModal(sbvtId) {
  try {
    // 로딩 표시
    elements.subventionData.innerHTML = '<div class="empty-message">로딩 중...</div>';
    elements.subventionModal.classList.remove('hidden');

    // SUBVENTION_MASTER 조회
    const data = await fetchSubventionMaster(sbvtId);

    // 데이터 표시
    let html = '';
    for (const [key, value] of Object.entries(data)) {
      const displayValue = value !== null && value !== undefined ? escapeHtml(String(value)) : '-';
      html += `
        <div class="subvention-field">
          <div class="subvention-field-label">${escapeHtml(key)}</div>
          <div class="subvention-field-value">${displayValue}</div>
        </div>
      `;
    }
    elements.subventionData.innerHTML = html;
  } catch (error) {
    console.error('SUBVENTION_MASTER 조회 실패:', error);
    alert(error.message);
    closeSubventionModal();
  }
}

// 키워드로 공고 검색
async function handleSearch() {
  const keyword = elements.keywordInput.value.trim();

  if (!keyword) {
    alert('검색할 키워드를 입력해주세요.');
    elements.keywordInput.focus();
    return;
  }

  try {
    // 로딩 표시
    elements.searchResultsList.innerHTML = '<div class="empty-message">검색 중...</div>';
    elements.searchResultCount.textContent = '';

    const result = await searchAnnouncements(keyword);

    if (!result.data || result.data.length === 0) {
      elements.searchResultsList.innerHTML = '<div class="empty-message">검색 결과가 없습니다.</div>';
      elements.searchResultCount.textContent = '0건';
      return;
    }

    // 검색 결과 개수 표시
    elements.searchResultCount.textContent = `${result.count}건`;

    // 검색 결과 렌더링
    elements.searchResultsList.innerHTML = result.data.map(item => {
      const isRegistered = item.sbvt_id !== null;
      const statusBadge = isRegistered
        ? '<span class="badge badge-registered">등록됨</span>'
        : '<span class="badge badge-pending">미등록</span>';

      return `
        <div class="search-item">
          <div class="search-item-title">${escapeHtml(item.title)}</div>
          <div class="search-item-meta">
            ${item.site_type || '-'} | ${item.site_code || '-'}
            ${item.announcement_date ? `| ${item.announcement_date}` : ''}
            | ${statusBadge}
          </div>
          ${item.content_summary ? `<div class="search-item-summary">${escapeHtml(item.content_summary)}</div>` : ''}
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('공고 검색 실패:', error);
    elements.searchResultsList.innerHTML = '<div class="empty-message">검색 중 오류가 발생했습니다.</div>';
    alert(error.message);
  }
}

// 제외 키워드 모달 닫기
function closeKeywordModal() {
  elements.modal.classList.add('hidden');
  state.selectedAnnouncement = null;
}

// 상세 모달 닫기
function closeDetailModal() {
  elements.detailModal.classList.add('hidden');
}

// SUBVENTION_MASTER 모달 닫기
function closeSubventionModal() {
  elements.subventionModal.classList.add('hidden');
}

// 제외 키워드 목록 렌더링
function renderKeywordsList(keywords) {
  if (!keywords || keywords.length === 0) {
    elements.keywordsList.innerHTML = '<div class="empty-message">검색 결과가 없습니다.</div>';
    elements.keywordsCount.textContent = '0건';
    return;
  }

  // 개수 표시
  elements.keywordsCount.textContent = `${keywords.length}건`;

  // 키워드 목록 렌더링
  elements.keywordsList.innerHTML = keywords.map(item => {
    const createdAt = item.CREATED_AT ? new Date(item.CREATED_AT).toLocaleString('ko-KR') : '-';
    return `
      <div class="keyword-item">
        <div class="keyword-item-header">
          <div class="keyword-item-title">${escapeHtml(item.KEYWORD)}</div>
          <button class="btn btn-action delete-keyword-btn" data-id="${item.EXCLUSION_ID}" data-keyword="${escapeHtml(item.KEYWORD)}">삭제</button>
        </div>
        <div class="keyword-item-meta">
          등록일: ${createdAt}
          ${item.EXCLUSION_COUNT ? ` | 제외된 공고: ${item.EXCLUSION_COUNT}건` : ''}
        </div>
      </div>
    `;
  }).join('');

  // 삭제 버튼 이벤트 리스너 추가
  document.querySelectorAll('.delete-keyword-btn').forEach(btn => {
    btn.addEventListener('click', handleDeleteKeyword);
  });
}

// 제외 키워드 검색
function filterKeywords() {
  const searchTerm = elements.keywordSearchInput.value.trim().toLowerCase();

  if (!searchTerm) {
    // 검색어가 없으면 전체 목록 표시
    renderKeywordsList(state.allKeywords);
    return;
  }

  // 검색어로 필터링
  const filtered = state.allKeywords.filter(item =>
    item.KEYWORD.toLowerCase().includes(searchTerm)
  );

  renderKeywordsList(filtered);
}

// 제외 키워드 관리 모달 열기
async function openManageKeywordsModal() {
  try {
    // 로딩 표시
    elements.keywordsList.innerHTML = '<div class="empty-message">로딩 중...</div>';
    elements.keywordsCount.textContent = '';
    elements.keywordSearchInput.value = '';
    elements.manageKeywordsModal.classList.remove('hidden');

    // 제외 키워드 목록 조회
    const result = await fetchExclusionKeywords();

    if (!result.data || result.data.length === 0) {
      state.allKeywords = [];
      elements.keywordsList.innerHTML = '<div class="empty-message">등록된 제외 키워드가 없습니다.</div>';
      elements.keywordsCount.textContent = '0건';
      return;
    }

    // 전체 목록 저장
    state.allKeywords = result.data;

    // 목록 렌더링
    renderKeywordsList(state.allKeywords);
  } catch (error) {
    console.error('제외 키워드 목록 조회 실패:', error);
    elements.keywordsList.innerHTML = '<div class="empty-message">목록을 불러오는 중 오류가 발생했습니다.</div>';
    alert(error.message);
  }
}

// 제외 키워드 관리 모달 닫기
function closeManageKeywordsModal() {
  elements.manageKeywordsModal.classList.add('hidden');
}

// 키워드 상세 모달 열기
async function openKeywordDetailModal(keyword, count) {
  try {
    // 모달 정보 설정
    elements.keywordDetailName.textContent = keyword;
    elements.keywordDetailCount.textContent = count + '건';
    elements.keywordDetailTableBody.innerHTML = '<tr><td colspan="6" class="empty-message">로딩 중...</td></tr>';
    elements.keywordDetailModal.classList.remove('hidden');

    // 키워드별 제외 공고 조회
    const result = await fetchKeywordAnnouncements(keyword);

    if (!result.data || result.data.length === 0) {
      elements.keywordDetailTableBody.innerHTML = '<tr><td colspan="6" class="empty-message">제외된 공고가 없습니다.</td></tr>';
      return;
    }

    // 테이블 렌더링
    elements.keywordDetailTableBody.innerHTML = result.data.map(item => {
      return `
        <tr>
          <td>${item.site_type || '-'}</td>
          <td>${item.site_code || '-'}</td>
          <td>${escapeHtml(item.title) || '-'}</td>
          <td>
            ${item.origin_url
              ? `<a href="${escapeHtml(item.origin_url)}" target="_blank" class="url-link" rel="noopener noreferrer">링크 열기</a>`
              : '-'
            }
          </td>
          <td>${item.announcement_date || '-'}</td>
          <td><small>${escapeHtml(item.exclusion_reason || '-')}</small></td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('키워드별 제외 공고 조회 실패:', error);
    alert(error.message);
    closeKeywordDetailModal();
  }
}

// 키워드 상세 모달 닫기
function closeKeywordDetailModal() {
  elements.keywordDetailModal.classList.add('hidden');
}

// 제외 키워드 삭제 핸들러
async function handleDeleteKeyword(event) {
  const id = event.target.dataset.id;
  const keyword = event.target.dataset.keyword;

  if (!confirm(`제외 키워드 "${keyword}"를 삭제하시겠습니까?`)) {
    return;
  }

  try {
    event.target.disabled = true;
    event.target.textContent = '삭제 중...';

    await deleteExclusionKeyword(id);

    showToast('제외 키워드가 삭제되었습니다.');

    // 목록 새로고침
    await openManageKeywordsModal();
  } catch (error) {
    alert(error.message);
    event.target.disabled = false;
    event.target.textContent = '삭제';
  }
}

// 키워드 등록
async function handleRegister() {
  const keyword = elements.keywordInput.value.trim();

  if (!keyword) {
    alert('제외 키워드를 입력해주세요.');
    elements.keywordInput.focus();
    return;
  }

  try {
    elements.registerBtn.disabled = true;
    elements.registerBtn.textContent = '등록 중...';

    const result = await registerExclusionKeyword(keyword);

    // 성공 메시지 생성
    let message = `제외 키워드 "${keyword}"가 성공적으로 등록되었습니다.\n\n`;
    message += `📊 처리 결과:\n`;
    message += `- 검색된 공고: ${result.data.affectedAnnouncements}건\n`;
    message += `- 공고 상태 변경: ${result.data.updatedAnnouncementCount}건 (성공 → 제외)\n`;

    if (result.data.deactivatedCount > 0) {
      message += `- SUBVENTION_MASTER 비활성화: ${result.data.deactivatedCount}건\n`;
      message += `  (사유: 제외 키워드 [${keyword}] 등록)`;
    } else {
      message += `- SUBVENTION_MASTER 비활성화: 0건`;
    }

    alert(message);
    closeKeywordModal();

    // 목록 새로고침
    await loadAnnouncements(state.currentPage);
  } catch (error) {
    alert(error.message);
  } finally {
    elements.registerBtn.disabled = false;
    elements.registerBtn.textContent = '등록';
  }
}

// 이벤트 리스너 설정
function setupEventListeners() {
  // 검색 폼
  elements.searchForm.addEventListener('submit', handleSearchSubmit);
  elements.resetBtn.addEventListener('click', handleReset);

  // 새로고침 버튼
  elements.refreshBtn.addEventListener('click', () => {
    loadAnnouncements(state.currentPage);
  });

  // 제외 키워드 모달 닫기
  elements.modalCloseBtn.addEventListener('click', closeKeywordModal);
  elements.cancelBtn.addEventListener('click', closeKeywordModal);

  // 제외 키워드 모달 배경 클릭 시 닫기
  elements.modal.addEventListener('click', (e) => {
    if (e.target === elements.modal) {
      closeKeywordModal();
    }
  });

  // 상세 모달 닫기
  elements.detailModalCloseBtn.addEventListener('click', closeDetailModal);
  elements.detailCloseBtn.addEventListener('click', closeDetailModal);

  // 상세 모달 배경 클릭 시 닫기
  elements.detailModal.addEventListener('click', (e) => {
    if (e.target === elements.detailModal) {
      closeDetailModal();
    }
  });

  // SUBVENTION_MASTER 모달 닫기
  elements.subventionModalCloseBtn.addEventListener('click', closeSubventionModal);
  elements.subventionCloseBtn.addEventListener('click', closeSubventionModal);

  // SUBVENTION_MASTER 모달 배경 클릭 시 닫기
  elements.subventionModal.addEventListener('click', (e) => {
    if (e.target === elements.subventionModal) {
      closeSubventionModal();
    }
  });

  // 제외 키워드 관리 버튼
  elements.manageKeywordsBtn.addEventListener('click', openManageKeywordsModal);

  // 제외 키워드 관리 모달 닫기
  elements.manageKeywordsModalCloseBtn.addEventListener('click', closeManageKeywordsModal);
  elements.manageKeywordsCloseBtn.addEventListener('click', closeManageKeywordsModal);

  // 제외 키워드 관리 모달 배경 클릭 시 닫기
  elements.manageKeywordsModal.addEventListener('click', (e) => {
    if (e.target === elements.manageKeywordsModal) {
      closeManageKeywordsModal();
    }
  });

  // 키워드 상세 모달 닫기
  elements.keywordDetailModalCloseBtn.addEventListener('click', closeKeywordDetailModal);
  elements.keywordDetailCloseBtn.addEventListener('click', closeKeywordDetailModal);

  // 키워드 상세 모달 배경 클릭 시 닫기
  elements.keywordDetailModal.addEventListener('click', (e) => {
    if (e.target === elements.keywordDetailModal) {
      closeKeywordDetailModal();
    }
  });

  // 메뉴 네비게이션 버튼
  elements.navActive.addEventListener('click', () => switchView('active'));
  elements.navExcluded.addEventListener('click', () => switchView('excluded'));
  elements.navKeywords.addEventListener('click', () => switchView('keywords'));

  // ESC 키로 모든 모달 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!elements.modal.classList.contains('hidden')) {
        closeKeywordModal();
      }
      if (!elements.detailModal.classList.contains('hidden')) {
        closeDetailModal();
      }
      if (!elements.subventionModal.classList.contains('hidden')) {
        closeSubventionModal();
      }
      if (!elements.manageKeywordsModal.classList.contains('hidden')) {
        closeManageKeywordsModal();
      }
      if (!elements.keywordDetailModal.classList.contains('hidden')) {
        closeKeywordDetailModal();
      }
    }
  });

  // 검색 버튼
  elements.searchBtn.addEventListener('click', handleSearch);

  // 키워드 등록
  elements.registerBtn.addEventListener('click', handleRegister);

  // 제외 키워드 검색 (실시간)
  elements.keywordSearchInput.addEventListener('input', filterKeywords);

  // 엔터 키로 검색
  elements.keywordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  });
}

// 초기화
function init() {
  setupEventListeners();
  loadAnnouncements(1);
}

// DOM 로드 완료 시 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
