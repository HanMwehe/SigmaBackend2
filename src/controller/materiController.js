import Materi from '../models/Materi.js';
import Tema from '../models/Tema.js';

export const getAllMateri = async (req, res) => {
  try {
    const data = await Materi.find().populate('tema_id', 'title');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createMateri = async (req, res) => {
  try {
    const { tema_id, title, content } = req.body;

    const tema = await Tema.findById(tema_id);
    if (!tema) return res.status(404).json({ error: 'Tema tidak ditemukan' });

    const materi = new Materi({
      tema_id,
      title,
      content,
    });
    await materi.save();

    res.status(201).json({ message: 'Materi created' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getMateriById = async (req, res) => {
  try {
    const materi = await Materi.findById(req.params.id).populate('tema_id', 'title');
    if (!materi) return res.status(404).json({ error: 'Materi tidak ditemukan' });
    res.json(materi);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getMateriByTema = async (req, res) => {
  try {
    const materi = await Materi.find({ tema_id: req.params.id }).populate("dosen_id")
    res.json(materi)
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil materi", error })
  }
}
