import Jurusan from '../models/Jurusan.js';
import Tema from '../models/Tema.js';

export const getAllJurusan = async (req, res) => {
  try {
    const data = await Jurusan.find().populate('tema_id', 'title');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createJurusan = async (req, res) => {
  try {
    const { tema_id, name } = req.body;

    const tema = await Tema.findById(tema_id);
    if (!tema) return res.status(404).json({ error: 'Tema tidak ditemukan' });

    const jurusan = new Jurusan({ tema_id, name });
    await jurusan.save();

    res.status(201).json({ message: 'Jurusan created' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getJurusanById = async (req, res) => {
  try {
    const jurusan = await Jurusan.findById(req.params.id).populate('tema_id', 'title');
    if (!jurusan) return res.status(404).json({ error: 'Jurusan tidak ditemukan' });
    res.json(jurusan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
