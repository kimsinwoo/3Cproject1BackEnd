const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();
const cors = require('cors');

app.use(express.json());
app.use(cookieParser());
app.use(express.json());
app.use(cors());

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { userId, password, check_password, name } = req.body;
        const isExisUser = await prisma.Users.findFirst({ where: { userId } });

        if (isExisUser) {
            return res.status(409).json({
                status: 409,
                message: "이미 존재하는 아이디 입니다."
            });
        }

        if (password !== check_password || password.length < 6) {
            return res.status(410).json({
                status: 410,
                message: "비밀번호가 6자 이상이여야 하고, 비밀번호 확인과 일치하여야 합니다."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.Users.create({
            data: {
                userId,
                password: hashedPassword,
                name
            },
        });

        res.status(200).json({
            status: 200,
            message: "회원가입에 성공하였습니다."
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "서버 오류" });
    }
});

module.exports = router