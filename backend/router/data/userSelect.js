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

router.post('/userData', async (req, res) => {
    try {
        const { id } = req.body;
        const userId = parseInt(id, 10);
        const userWithPosts = await prisma.Users.findMany({
            where: {
                id: userId
            },
            select: {
                name: true,     // 사용자의 이름
                recruitments: { // 사용자가 작성한 모집 글
                    select: {
                        title: true,    // 모집 글 제목
                        content: true,  // 모집 글 내용
                        isDone: true    // 모집 완료 여부
                    }
                }
            }
        });
        res.status(200).json({
            userWithPosts
        })
    } catch (e) {
        console.log(e)
        return
    }
})

module.exports = router