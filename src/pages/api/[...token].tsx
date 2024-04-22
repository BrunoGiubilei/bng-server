import { NextApiRequest, NextApiResponse } from 'next'
import NextCors from 'nextjs-cors';
import { PrismaClient } from '@prisma/client'
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
      // Get all usuarios or a specific usuario if a token is provided
      const queryToken = req.query.token !== undefined ? req.query.token : '';
      const endpoint = queryToken[0];
      const token = queryToken[1];
      const isValid = jwt.verify(token, 'your-secret-key');
      
      if (isValid) {
        if (token) {
          const decoded = jwt.decode(token);
          let id: number = 0;
      
          if (decoded instanceof Object && 'id' in decoded) {
            id = decoded.id;
          }
          
          if (endpoint === 'usuarios') {
            const usuario = await prisma.usuario.findUnique({ where: { id: id } });
            let usuariosSemSenha = {};

            if (usuario) {
              usuariosSemSenha = {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                isAdmin: usuario.isAdmin
              };
            }

            res.json(usuariosSemSenha);
          } else if (endpoint === 'postagens') {
            const postagens = await prisma.postagens.findMany();
            const postagensDoUsuario = postagens.filter(postagem => postagem.userId === id && postagem.dataExclusao === null);

            res.json(postagensDoUsuario);
          }
        }
      } else {
        res.status(401).json({ error: 'Token inválido' });
      }      
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
