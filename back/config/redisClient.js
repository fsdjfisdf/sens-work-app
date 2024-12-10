const redis = require("redis");

const client = redis.createClient({
  url: "redis://localhost:6379", // Redis 서버 주소
});

// Redis 연결 오류 처리
client.on("error", (err) => {
  console.error("Redis Client Error", err);
  process.exit(1); // 심각한 오류 시 프로세스 종료
});

// Redis 연결
const connectRedis = async () => {
  try {
    await client.connect();
    console.log("Redis connected successfully");
  } catch (err) {
    console.error("Failed to connect to Redis:", err);
    process.exit(1); // 심각한 오류 시 프로세스 종료
  }
};

connectRedis();

module.exports = client;
