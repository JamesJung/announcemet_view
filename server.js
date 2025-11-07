const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3003;

// MySQL 연결 풀 생성
const pool = mysql.createPool({
  host: '192.168.0.95',
  port: 3309,
  user: 'root',
  password: 'b3UvSDS232GbdZ42',
  database: 'subvention',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Promise 기반 풀 생성
const promisePool = pool.promise();

// 연결 테스트
promisePool.query('SELECT 1')
  .then(() => {
    console.log('✓ MySQL 데이터베이스 연결 성공');
  })
  .catch((err) => {
    console.error('✗ MySQL 연결 실패:', err.message);
  });

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// DB 풀을 요청 객체에 추가
app.use((req, res, next) => {
  req.db = promisePool;
  next();
});

// API 라우트 연결
app.use('/api', apiRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('서버 에러:', err);
  res.status(500).json({
    success: false,
    message: '서버 내부 오류가 발생했습니다.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  공고 조회 시스템 서버 실행 중`);
  console.log(`  포트: ${PORT}`);
  console.log(`  URL: http://localhost:${PORT}`);
  console.log(`========================================\n`);
});
