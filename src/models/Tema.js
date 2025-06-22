import mongoose from 'mongoose';

const temaSchema = new mongoose.Schema({
  dosen_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Dosen', required: true },
  title: { type: String, required: true },
  description: { type: String },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Tema', temaSchema);
