const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const OpenAI = require('openai')
const cors = require('cors');
require('dotenv').config();

app.use(express.json());
app.use(cookieParser());
app.use(express.json());
app.use(cors());

const tokenObject = {};

app.post('/register', async (req, res) => {
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

app.post('/login', async (req, res) => {
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
    res.cookie('userId', userId)

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

app.post('/recruitments', async (req, res) => {
    const { title, content, isDone, authorId } = req.body; // title, content, isDone를 body에서 가져옴 

    if (!authorId) {
        return res.status(400).json({ error: '로그인을 해주세요.' });
    }

    try {
        // Prisma를 이용해 Recruitment 레코드 생성
        await prisma.Recruitment.create({
            data: {
                title,
                content,
                isDone: isDone || false,
                authorId
            }
        });
        res.status(201).json({ message: 'Recruitment created successfully' });
    } catch (error) {
        console.error('Error creating recruitment:', error);  // 오류 로그 출력
        res.status(500).json({ error: 'Error creating recruitment' });
    }
})

app.get('/recruitmentsPosts', async (req, res) => {
    try {
        const Posts = await prisma.Recruitment.findMany();
        console.log(Posts);
        res.status(200).json({ Posts });
    } catch (error) {
        console.error('Error fetching recruitment posts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

app.post('/userData', async (req, res) => {
    try {
        const { Id } = req.body;
    
        const userWithPosts = await prisma.Users.findMany({
            where: {
                userId: Id
            },
            select: {
                name: true,
                recruitments: {
                    select: {
                        id: true,
                        title: true,
                        content: true,
                        isDone: true
                    }
                }
            }
        });
    
        res.json(userWithPosts);
    
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while fetching users.');
    }
})

app.post('/isDone', async (req, res) => {
    const { postsId } = req.body;

    try {
        const parsedPostsId = parseInt(postsId, 10);

        // postsId와 userId가 일치하는지 확인
        const existingPost = await prisma.Recruitment.findFirst({
            where: {
                id: parsedPostsId,
            }
        });

        // 해당 postsId와 userId가 일치하는 게시물이 없을 때
        if (!existingPost) {
            return res.status(404).json({
                message: "해당 게시물을 찾을 수 없거나 권한이 없습니다."
            });
        }

        // isDone 상태 업데이트 (id 기준)
        await prisma.Recruitment.update({
            where: {
                id: parsedPostsId
            },
            data: {
                isDone: true
            }
        });

        // 성공 응답
        res.status(200).json({
            message: "모집이 완료되었습니다."
        });

    } catch (error) {
        console.error(error);  // 오류를 콘솔에 출력

        // error.status가 없는 경우 대비
        const statusCode = error.status || 500;
        res.status(statusCode).send(`Error: ${error.message || '알 수 없는 오류 발생'}`);
    }
});

app.post('/recuritmentsDelete', async (req, res) => {
    const { postsId } = req.body;

    try {
        const parsedPostsId = parseInt(postsId, 10);

        // postsId와 userId가 일치하는지 확인
        const existingPost = await prisma.Recruitment.findFirst({
            where: {
                id: parsedPostsId,
            }
        });

        // 해당 postsId와 userId가 일치하는 게시물이 없을 때
        if (!existingPost) {
            return res.status(404).json({
                message: "해당 게시물을 찾을 수 없거나 권한이 없습니다."
            });
        }

        const postsToDelete = await prisma.Recruitment.findMany({
            where: {
                id: postsId
            },
            select: {
                id: true,
                title: true,
                content: true,
                createAt: true,
                isDone: true,
                authorId: true,
            }
        });
        
        // 삭제할 데이터가 있는지 확인 후 삭제
        if (postsToDelete.length > 0) {
            await prisma.Recruitment.deleteMany({
                where: {
                    id: postsId
                }
            });
            
            res.status(200).json({
                message: "삭제되었습니다.",
                deletedPosts: postsToDelete
            });
        } else {
            res.status(404).json({
                message: "해당 ID의 게시물을 찾을 수 없습니다."
            });
        }

    } catch (error) {
        console.error(error);
        return
    }
})

app.listen(3030, () => {
    console.log(`http://localhost:3030에 서버가 실행 되었습니다.`);
});
