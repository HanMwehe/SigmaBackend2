import Tema from '../models/Tema.js';
import Dosen from '../models/Dosen.js';
import Mahasiswa from '../models/Mahasiswa.js';
import Jurusan from '../models/Jurusan.js';
export const getAllTema = async (req, res) => {
  try {
    const data = await Tema.find().populate('dosen_id', 'name');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createTema = async (req, res) => {
  try {
    const { title, description } = req.body;

    // Cari Dosen berdasarkan user login
    const dosen = await Dosen.findOne({ user_id: req.user.id });
    if (!dosen) return res.status(404).json({ error: 'Dosen tidak ditemukan' });

    const tema = new Tema({
      dosen_id: dosen._id,
      title,
      description,
    });
    await tema.save();

    res.status(201).json({ message: 'Tema created' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getTemaById = async (req, res) => {
  try {
    const tema = await Tema.findById(req.params.id).populate('dosen_id', 'name');
    if (!tema) return res.status(404).json({ error: 'Tema tidak ditemukan' });
    res.json(tema);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Ambil semua tema untuk mahasiswa (tanpa dosen_id dan _id)
export const getTemaForMahasiswa = async (req, res) => {
  try {
    const mahasiswa = await Mahasiswa.findOne({ user_id: req.user.id });
    if (!mahasiswa) return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });

    const temaIdList = await Jurusan.find({ name: mahasiswa.fakultas }).distinct('tema_id');

    if (!temaIdList.length)
      return res.status(404).json({ message: 'Tidak ada tema yang cocok dengan jurusan mahasiswa' });

    const tema = await Tema.find({ _id: { $in: temaIdList } }, 'title description created_at');
    res.json(tema);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil tema', error: err.message });
  }
};
