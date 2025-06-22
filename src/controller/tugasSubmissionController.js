import TugasSubmission from '../models/TugasSubmission.js';
import Tugas from '../models/Tugas.js';
import Materi from '../models/Materi.js';
import Jurusan from '../models/Jurusan.js';
import Mahasiswa from '../models/Mahasiswa.js';

// ✅ SUBMIT TUGAS MAHASISWA
export const submitTugas = async (req, res) => {
  try {
    const { tugas_id, answers } = req.body;

    const tugas = await Tugas.findById(tugas_id);
    if (!tugas) return res.status(404).json({ error: 'Tugas tidak ditemukan' });

    const mahasiswa = await Mahasiswa.findOne({ user_id: req.user.id });
    if (!mahasiswa) return res.status(404).json({ error: 'Mahasiswa tidak ditemukan' });

    const materi = await Materi.findById(tugas.materi_id).populate('tema_id');
    const jurusanYangBoleh = await Jurusan.find({ tema_id: materi.tema_id._id }).distinct('name');

    if (!jurusanYangBoleh.includes(mahasiswa.fakultas)) {
      return res.status(403).json({ error: 'Tugas ini tidak tersedia untuk jurusan kamu' });
    }

    let submission = await TugasSubmission.findOne({
      tugas_id,
      mahasiswa_id: mahasiswa._id
    });

    if (submission) {
      if (submission.status === 'graded') {
        return res.status(400).json({ message: 'Tugas sudah dinilai. Tidak bisa submit ulang.' });
      }
      submission.answers = answers;
      submission.submitted_at = new Date();
      submission.status = 'submitted';
    } else {
      submission = new TugasSubmission({
        tugas_id,
        mahasiswa_id: mahasiswa._id,
        answers,
        submitted_at: new Date(),
        status: 'submitted',
      });
    }

    await submission.save();
    res.status(201).json({ message: 'Tugas submitted', submission });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ GET SEMUA SUBMISSION (untuk dosen/admin)
export const getAllSubmissions = async (req, res) => {
  try {
    const submissions = await TugasSubmission.find()
      .populate('tugas_id', 'description')
      .populate('mahasiswa_id', 'name nim');
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ GET SUBMISSION BY ID (detail)
export const getSubmissionById = async (req, res) => {
  try {
    const submission = await TugasSubmission.findById(req.params.id)
      .populate('tugas_id', 'description')
      .populate('mahasiswa_id', 'name nim');

    if (!submission) return res.status(404).json({ error: 'Submission tidak ditemukan' });

    res.json({
      mahasiswa: {
        nama: submission.mahasiswa_id.name,
        nim: submission.mahasiswa_id.nim
      },
      soal: submission.tugas_id.description,
      jawaban: submission.answer_text || submission.file_path || '',
      nilai: submission.grade || null,
      feedback: submission.feedback || '',
      status: submission.status,
      submitted_at: submission.submitted_at
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ UPDATE PENILAIAN TUGAS (dosen)
export const updateSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, feedback, answer_text } = req.body;

    const submission = await TugasSubmission.findById(id);
    if (!submission) return res.status(404).json({ message: 'Submission tidak ditemukan' });

    if (grade !== undefined) submission.grade = grade;
    if (feedback) submission.feedback = feedback;
    if (answer_text) submission.answer_text = answer_text;
    submission.status = 'graded';

    await submission.save();
    res.json({
      message: 'Submission berhasil dinilai',
      submission: {
        tugas_id: submission.tugas_id,
        mahasiswa_id: submission.mahasiswa_id,
        grade: submission.grade,
        feedback: submission.feedback,
        status: submission.status,
        submitted_at: submission.submitted_at
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal update submission', error: err.message });
  }
};

// ✅ GET SEMUA SUBMISSION SAYA (mahasiswa)
export const getMySubmissions = async (req, res) => {
  try {
    const user_id = req.user.id;
    const mahasiswa = await Mahasiswa.findOne({ user_id });
    if (!mahasiswa) return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });

    const submissions = await TugasSubmission.find({ mahasiswa_id: mahasiswa._id })
      .populate('tugas_id', 'description due_date')
      .sort({ submitted_at: -1 });

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil hasil tugas', error: err.message });
  }
};

// ✅ GET SUBMISSION BERDASARKAN TUGAS (khusus dosen)
export const getSubmissionsByTugas = async (req, res) => {
  try {
    const { tugas_id } = req.params;
    const submissions = await TugasSubmission.find({ tugas_id })
      .populate('mahasiswa_id', 'name nim fakultas');
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil submissions', error: err.message });
  }
};

// ✅ GET TUGAS YANG BELUM DIKERJAKAN OLEH MAHASISWA
export const getTugasForMahasiswa = async (req, res) => {
  try {
    const mahasiswa = await Mahasiswa.findOne({ user_id: req.user.id });
    if (!mahasiswa) return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });

    const temaIdList = await Jurusan.find({
      name: { $regex: new RegExp(`^${mahasiswa.fakultas}$`, 'i') }
    }).distinct('tema_id');

    if (!temaIdList.length) return res.status(404).json({ message: 'Tidak ada tema untuk jurusan ini' });

    const materiIdList = await Materi.find({ tema_id: { $in: temaIdList } }).distinct('_id');

    const semuaTugas = await Tugas.find({ materi_id: { $in: materiIdList } })
      .populate('materi_id', 'title')
      .sort({ created_at: -1 });

    const tugasYangSudahDikerjakan = await TugasSubmission.find({
      mahasiswa_id: mahasiswa._id
    }).distinct('tugas_id');

    const tugasBelumDikerjakan = semuaTugas.filter(
  (tugas) => !tugasYangSudahDikerjakan.some((doneId) => tugas._id.equals(doneId))
)

    res.json(tugasBelumDikerjakan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};