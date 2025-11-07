const express = require('express');
const router = express.Router();

/**
 * GET /api/announcements
 * processing_status='성공'인 공고 목록 조회 (검색 기능 포함)
 */
router.get('/announcements', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      title,
      site_type,
      created_from,
      created_to,
      announcement_from,
      announcement_to
    } = req.query;

    const offset = (page - 1) * limit;

    // WHERE 조건 동적 생성
    const conditions = ['processing_status = ?'];
    const params = ['성공'];

    // 제목 검색
    if (title && title.trim()) {
      conditions.push('title LIKE ?');
      params.push(`%${title.trim()}%`);
    }

    // site_type 필터
    if (site_type && site_type.trim()) {
      conditions.push('site_type = ?');
      params.push(site_type.trim());
    }

    // 생성일 검색 (created_at)
    if (created_from) {
      conditions.push('DATE(created_at) >= ?');
      params.push(created_from);
    }
    if (created_to) {
      conditions.push('DATE(created_at) <= ?');
      params.push(created_to);
    }

    // 공고일 검색 (announcement_date)
    if (announcement_from) {
      conditions.push('announcement_date >= ?');
      params.push(announcement_from);
    }
    if (announcement_to) {
      conditions.push('announcement_date <= ?');
      params.push(announcement_to);
    }

    const whereClause = conditions.join(' AND ');

    const query = `
      SELECT
        id,
        site_type,
        site_code,
        SUBSTRING(content_md, 1, 100) as content_summary,
        title,
        origin_url,
        sbvt_id,
        announcement_date,
        created_at
      FROM announcement_pre_processing
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), parseInt(offset));
    const [rows] = await req.db.query(query, params);

    // 전체 개수 조회
    const countQuery = `SELECT COUNT(*) as total FROM announcement_pre_processing WHERE ${whereClause}`;
    const countParams = params.slice(0, -2); // LIMIT, OFFSET 제외
    const [countResult] = await req.db.query(countQuery, countParams);

    res.json({
      success: true,
      data: rows,
      pagination: {
        currentPage: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      },
      filters: {
        title,
        site_type,
        created_from,
        created_to,
        announcement_from,
        announcement_to
      }
    });
  } catch (error) {
    console.error('공고 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '공고 목록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * GET /api/announcements/search
 * 키워드로 공고 제목 검색 (LIKE 검색)
 */
router.get('/announcements/search', async (req, res) => {
  try {
    const { keyword, limit = 100 } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'keyword 파라미터가 필요합니다.'
      });
    }

    const query = `
      SELECT
        id,
        title,
        site_type,
        site_code,
        announcement_date,
        sbvt_id,
        SUBSTRING(content_md, 1, 100) as content_summary
      FROM announcement_pre_processing
      WHERE processing_status = '성공'
        AND title LIKE ?
      ORDER BY created_at DESC
      LIMIT ?
    `;

    const searchPattern = `%${keyword}%`;
    const [rows] = await req.db.query(query, [searchPattern, parseInt(limit)]);

    res.json({
      success: true,
      data: rows,
      count: rows.length,
      keyword: keyword
    });
  } catch (error) {
    console.error('공고 검색 실패:', error);
    res.status(500).json({
      success: false,
      message: '공고 검색 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * GET /api/announcements/:id
 * 공고 상세 조회 (content_md, combined_content 포함)
 */
router.get('/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        id,
        title,
        site_type,
        site_code,
        content_md,
        combined_content,
        announcement_date,
        origin_url,
        sbvt_id
      FROM announcement_pre_processing
      WHERE id = ?
    `;

    const [rows] = await req.db.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '공고를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('공고 상세 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '공고 상세 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * GET /api/subvention/:sbvtId
 * SUBVENTION_MASTER 조회
 */
router.get('/subvention/:sbvtId', async (req, res) => {
  try {
    const { sbvtId } = req.params;

    const query = `
      SELECT *
      FROM SUBVENTION_MASTER
      WHERE SBVT_ID = ?
    `;

    const [rows] = await req.db.query(query, [sbvtId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'SUBVENTION_MASTER 데이터를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('SUBVENTION_MASTER 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: 'SUBVENTION_MASTER 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * POST /api/exclusion-keywords
 * 제외 키워드 등록 및 관련 SUBVENTION_MASTER 비활성화
 */
router.post('/exclusion-keywords', async (req, res) => {
  const connection = await req.db.getConnection();

  try {
    const { keyword, description } = req.body;

    if (!keyword || keyword.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '키워드는 필수 입력 항목입니다.'
      });
    }

    // 트랜잭션 시작
    await connection.beginTransaction();

    // 1. EXCLUSION_KEYWORDS 테이블에 키워드 등록
    const insertQuery = `
      INSERT INTO EXCLUSION_KEYWORDS (KEYWORD, DESCRIPTION, IS_ACTIVE, EXCLUSION_COUNT)
      VALUES (?, ?, 1, 0)
    `;

    const [insertResult] = await connection.query(insertQuery, [
      keyword.trim(),
      description || null
    ]);

    // 2. 키워드로 공고 검색 (title LIKE)
    const searchQuery = `
      SELECT id, sbvt_id, title
      FROM announcement_pre_processing
      WHERE processing_status = '성공'
        AND title LIKE ?
    `;

    const searchPattern = `%${keyword.trim()}%`;
    const [announcements] = await connection.query(searchQuery, [searchPattern]);

    // 3. announcement_pre_processing의 processing_status를 '제외'로 변경하고 exclusion_reason, exclusion_keyword 업데이트
    let updatedAnnouncementCount = 0;
    if (announcements.length > 0) {
      const announcementIds = announcements.map(a => a.id);

      const updateAnnouncementQuery = `
        UPDATE announcement_pre_processing
        SET processing_status = '제외',
            exclusion_keyword = ?,
            exclusion_reason = '제외 키워드 등록'
        WHERE id IN (?)
      `;

      const [updateAnnouncementResult] = await connection.query(updateAnnouncementQuery, [keyword.trim(), announcementIds]);
      updatedAnnouncementCount = updateAnnouncementResult.affectedRows;
    }

    // 4. sbvt_id가 있는 공고들의 SUBVENTION_MASTER 비활성화
    let deactivatedCount = 0;
    const announcementsWithSbvtId = announcements.filter(a => a.sbvt_id !== null);

    if (announcementsWithSbvtId.length > 0) {
      const sbvtIds = announcementsWithSbvtId.map(a => a.sbvt_id);

      const deactivationReason = `제외 키워드 [${keyword.trim()}] 등록`;

      const updateSubventionQuery = `
        UPDATE SUBVENTION_MASTER
        SET IS_ACTIVE = 0,
            DEACTIVATION_REASON = ?,
            DEACTIVATED_AT = NOW()
        WHERE SBVT_ID IN (?)
          AND IS_ACTIVE = 1
      `;

      const [updateSubventionResult] = await connection.query(updateSubventionQuery, [deactivationReason, sbvtIds]);
      deactivatedCount = updateSubventionResult.affectedRows;
    }

    // 트랜잭션 커밋
    await connection.commit();

    res.json({
      success: true,
      message: '제외 키워드가 성공적으로 등록되었습니다.',
      data: {
        exclusionId: insertResult.insertId,
        keyword: keyword.trim(),
        affectedAnnouncements: announcements.length,
        updatedAnnouncementCount: updatedAnnouncementCount,
        deactivatedCount: deactivatedCount
      }
    });
  } catch (error) {
    // 트랜잭션 롤백
    await connection.rollback();

    // 중복 키워드 에러 처리
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: '이미 등록된 키워드입니다.'
      });
    }

    console.error('키워드 등록 실패:', error);
    res.status(500).json({
      success: false,
      message: '키워드 등록 중 오류가 발생했습니다.',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

/**
 * GET /api/exclusion-keywords
 * 등록된 제외 키워드 목록 조회
 */
router.get('/exclusion-keywords', async (req, res) => {
  try {
    const query = `
      SELECT
        EXCLUSION_ID,
        KEYWORD,
        DESCRIPTION,
        IS_ACTIVE,
        EXCLUSION_COUNT,
        CREATED_AT
      FROM EXCLUSION_KEYWORDS
      WHERE IS_ACTIVE = 1
      ORDER BY CREATED_AT DESC
    `;

    const [rows] = await req.db.query(query);

    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('키워드 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '키워드 목록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;
