const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const SCORE_FILE = path.join(__dirname, "scores.json");
const MAX_LEADERBOARD = 10;
const ADMIN_CODE = process.env.ADMIN_CODE || "omokterry";

app.use(express.json({ limit: "10kb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.get("/", (req, res) => res.redirect("/move2d_update.html"));
app.use(express.static(__dirname));

async function readScores() {
  try {
    const raw = await fs.readFile(SCORE_FILE, "utf8");
    const scores = JSON.parse(raw);
    return Array.isArray(scores) ? scores : [];
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeScores(scores) {
  await fs.writeFile(SCORE_FILE, JSON.stringify(scores, null, 2) + "\n", "utf8");
}

function cleanNickname(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 12);
}

function publicScore(score) {
  return {
    nickname: score.nickname,
    clearTimeMs: score.clearTimeMs,
    hints: score.hints,
    clearedAt: score.clearedAt,
  };
}

app.get("/api/leaderboard", async (req, res, next) => {
  try {
    const scores = await readScores();
    scores.sort((a, b) => a.clearTimeMs - b.clearTimeMs || a.hints - b.hints);
    res.json(scores.slice(0, MAX_LEADERBOARD).map(publicScore));
  } catch (err) {
    next(err);
  }
});

app.post("/api/scores", async (req, res, next) => {
  try {
    const nickname = cleanNickname(req.body.nickname);
    const clearTimeMs = Number(req.body.clearTimeMs);
    const hints = Math.max(0, Math.floor(Number(req.body.hints) || 0));

    if (!nickname) {
      return res.status(400).json({ error: "닉네임을 입력하세요." });
    }
    if (!Number.isFinite(clearTimeMs) || clearTimeMs <= 0) {
      return res.status(400).json({ error: "클리어 시간이 올바르지 않습니다." });
    }

    const scores = await readScores();
    const entry = {
      nickname,
      clearTimeMs: Math.floor(clearTimeMs),
      hints,
      clearedAt: new Date().toISOString(),
    };

    scores.push(entry);
    scores.sort((a, b) => a.clearTimeMs - b.clearTimeMs || a.hints - b.hints);
    await writeScores(scores);

    res.status(201).json(publicScore(entry));
  } catch (err) {
    next(err);
  }
});

app.post("/api/leaderboard/reset", async (req, res, next) => {
  try {
    const adminCode = cleanNickname(req.body.adminCode || req.body.nickname);
    if (adminCode !== ADMIN_CODE) {
      return res.status(403).json({ error: "관리자 권한이 필요합니다." });
    }

    await writeScores([]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "서버 오류가 발생했습니다." });
});

app.listen(PORT, () => {
  console.log(`Leaderboard server running at http://localhost:${PORT}/move2d.html`);
});
