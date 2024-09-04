const express = require('express');
const jwt = require('jsonwebtoken');
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

router.post('/login', async (req, res) => {
    const { userId, password } = req.body;
    const user = await prisma.Users.findFirst({ where: { userId } });

    if (!user) {
        res.status(404).send('가입되지 않은 사용자입니다.');
        return;
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
        res.status(403).send('비밀번호가 일치하지 않습니다.');
        return;
    }

    const accessToken = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    tokenObject[refreshToken] = userId;

    await prisma.Users.update({
        where: { userId },
        data: { accessToken, refreshToken }
    });

    res.cookie('accessToken', accessToken);
    res.cookie('refreshToken', refreshToken);

    res.status(200).json({
        status: 200,
        data: {
            accessToken, refreshToken,
            Id: await prisma.Users.findMany({
                where: {
                    userId: userId
                },
                select: {
                    id: true
                }
            })
        }
    });
});

module.exports = router