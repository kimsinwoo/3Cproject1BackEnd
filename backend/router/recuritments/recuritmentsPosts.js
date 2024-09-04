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

router.get('/recruitmentsPosts', async (req, res) => {
    const Posts = await prisma.Recruitment.findMany();
    res.status(200).json({
        status: 200,
        data: {
            Posts
        }
    })
})

module.exports = router