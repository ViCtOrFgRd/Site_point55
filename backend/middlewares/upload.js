const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Criar diretório de uploads se não existir (pasta raiz do projeto)
const uploadDir = path.join(__dirname, '../../image');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração de storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Gerar nome único com timestamp
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Filtro para permitir apenas imagens
const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const fileFilter = (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens (JPEG, PNG, WebP, GIF) são permitidas'), false);
  }
};

const isValidSignature = (buffer, mimetype) => {
  if (!buffer || buffer.length < 12) {
    return false;
  }

  if (mimetype === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimetype === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  if (mimetype === 'image/gif') {
    return (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38 &&
      (buffer[4] === 0x37 || buffer[4] === 0x39) &&
      buffer[5] === 0x61
    );
  }

  if (mimetype === 'image/webp') {
    return (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    );
  }

  return false;
};

const validateFileSignature = async (file) => {
  const handle = await fs.promises.open(file.path, 'r');
  try {
    const buffer = Buffer.alloc(12);
    await handle.read(buffer, 0, 12, 0);
    return isValidSignature(buffer, file.mimetype);
  } finally {
    await handle.close();
  }
};

const cleanupInvalidFile = async (file) => {
  if (!file?.path) return;
  try {
    await fs.promises.unlink(file.path);
  } catch (error) {
    console.error('Erro ao remover arquivo invalido:', error);
  }
};

// Configuração do multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

const withSignatureValidation = (handler) => async (req, res, next) => {
  handler(req, res, async (error) => {
    if (error) {
      return next(error);
    }

    const files = [];
    if (req.file) {
      files.push(req.file);
    }
    if (Array.isArray(req.files)) {
      files.push(...req.files);
    }

    try {
      for (const file of files) {
        const valid = await validateFileSignature(file);
        if (!valid) {
          await cleanupInvalidFile(file);
          const signatureError = new Error('Arquivo invalido. Assinatura nao corresponde ao tipo informado.');
          signatureError.status = 400;
          return next(signatureError);
        }
      }

      return next();
    } catch (validationError) {
      return next(validationError);
    }
  });
};

const uploadMiddleware = {
  single: (field) => withSignatureValidation(upload.single(field)),
  array: (field, maxCount) => withSignatureValidation(upload.array(field, maxCount)),
  fields: (fields) => withSignatureValidation(upload.fields(fields)),
};

module.exports = uploadMiddleware;
