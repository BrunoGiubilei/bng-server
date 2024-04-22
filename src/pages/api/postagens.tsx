import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from 'nextjs-cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Roda o middleware de CORS
  await NextCors(req, res, {
    methods: ['POST', 'PUT'],
    origin: 'http://localhost:5173',
    optionsSuccessStatus: 200,
  });

  // Verificar a presença do token
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Token não fornecido' });
    return;
  }

  const [, token] = authHeader.split(' ');

  try {
    jwt.verify(token, 'your-secret-key');
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
    return;
  }

  // Aqui começa o seu código de manipulação de API
  const { method } = req;

  switch (method) {
    case 'POST':
      // Código para tratar requisição POST
      const newPostagem = await prisma.postagens.create({
        data: req.body,
      });
      res.json(newPostagem);
      break;
    case 'PUT':
      // Código para tratar requisição PUT
      const updatedPostagem = await prisma.postagens.update({
        where: { id: req.body.id },
        data: req.body,
      });
      res.json(updatedPostagem);
      break;
    default:
      res.setHeader('Allow', ['POST', 'PUT']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export default handler;
