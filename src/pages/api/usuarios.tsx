import { NextApiRequest, NextApiResponse } from 'next'
import NextCors from 'nextjs-cors';
import { PrismaClient, Usuario } from '@prisma/client'
import jwt from 'jsonwebtoken';
import CryptoJS from 'crypto-js';

const prisma = new PrismaClient()

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  // Roda o middleware de CORS
  await NextCors(req, res, {
    methods: ['GET', 'POST', 'PUT'],
    origin: 'http://localhost:5173',
    optionsSuccessStatus: 200,
  });

  const { method } = req
  
  switch (method) {
    case 'GET':
      const usuarios = await prisma.usuario.findMany();
      res.json(usuarios);
      break
    case 'POST':
      // Authenticate a usuario or Create a new usuario
      if (req.body.email && req.body.senha) {
        const { email, senha } = req.body;
        const usuario = await prisma.usuario.findUnique({ where: { email } });
        if (!usuario) {
          res.status(401).json({ error: 'Usuário não encontrado' });
          return;
        }
        
        let senhac = CryptoJS.SHA256(usuario.senha+'babanassaosaborosas').toString();
        const isValid = (senha === senhac ? true : false);
        if (!isValid) {
          res.status(401).json({ error: 'Senha inválida' });
          return;
        }
        const token = jwt.sign({ id: usuario.id }, 'your-secret-key');
        res.json({ token });
      } else {
        const newUsuario = await prisma.usuario.create({
          data: req.body,
        })
        res.json(newUsuario)
      }
      break
    case 'PUT':
      // Update a usuario
      const updatedUsuario = await prisma.usuario.update({
        where: { id: req.body.id },
        data: req.body,
      })
      res.json(updatedUsuario)
      break
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
