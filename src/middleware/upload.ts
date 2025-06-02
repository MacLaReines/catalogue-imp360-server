import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const customName = req.body.name; // Nom personnalisé
    const ext = path.extname(file.originalname);
    const finalName = customName ? `${customName}${ext}` : file.originalname;
    cb(null, finalName);
  },
});

export const upload = multer({ storage });
