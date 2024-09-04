const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();
const cors = require('cors');

app.use(express.json());
app.use(cookieParser());
app.use(express.json());
app.use(cors());

const router = express.Router();

router.post('/recruitments', async (req, res) => {
    const { title, content, isDone } = req.body
    const accessToken = req.cookies.accessToken
    if (!accessToken) {
        return res.status(403).json({
            status: 403,
            message: '현재 세션이 만료 되었거나 로그인이 되어있지 않습니다.'
        })
    } else if (!title) {
        return res.status(409).json({
            status: 409,
            message: '제목을 입력하고 다시 시도해주세요.'
        })
    }
    await prisma.Recruitment.create({
        data: {
            title,
            content,
            isDone
        }
    })
})

module.exports = router