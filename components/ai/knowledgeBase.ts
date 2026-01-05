export interface KnowledgeBaseItem {
  influencers: string[];
  analysis: string;
}

export const ParameterKnowledge: Record<string, KnowledgeBaseItem> = {
  // Quality Parameters
  Blaine: {
    influencers: ['Separator Speed', 'Mill Draft', 'Grinding Aid', 'Clinker Hardness'],
    analysis:
      'Blaine (kehalusan) berbanding lurus dengan Separator Speed. Jika Blaine rendah, cek efisiensi separator atau tambah dosis Grinding Aid.',
  },
  Residue: {
    influencers: ['Separator Speed', 'Mill Ventilation', 'Dam Ring Height'],
    analysis:
      'Residue tinggi menandakan separasi kurang optimal. Pertimbangkan menaikkan Separator Speed atau mengurangi ventilasi udara.',
  },
  SO3: {
    influencers: ['Gypsum Feed Rate', 'Clinker SO3', 'Temperatur Mill'],
    analysis:
      'Kadar SO3 mengontrol setting time. Jika fluktuatif, periksa kestabilan feeding Gypsum dan temperatur mill (dehidrasi gipsum).',
  },

  // Operational Parameters
  Feed: {
    influencers: ['Mill Sound Level', 'Bucket Elevator Amps', 'Separator Return'],
    analysis:
      'Feed rate harus disesuaikan dengan Mill Load. Jika Sound Level tinggi (mill kosong), feed bisa dinaikkan untuk optimasi produksi.',
  },
  'Mill Motor': {
    influencers: ['Ball Charge', 'Material Hardness', 'Liner Condition'],
    analysis:
      'Ampere motor mencerminkan beban giling. Penurunan drastis bisa indikasi "coating" pada liner atau grinding media aus.',
  },
  Separator: {
    influencers: ['System Fan Speed', 'Reject Rate', 'Product Quality Target'],
    analysis:
      'Separator adalah kontrol utama kualitas. Speed tinggi meningkatkan Blaine tapi bisa menurunkan intlet pressure jika fan tidak diadjust.',
  },
  Vibration: {
    influencers: ['Mill Filling Level', 'Bolts Loosening', 'Gear Alignment'],
    analysis:
      'Vibrasi tinggi biasanya karena mill terlalu kosong (impact ball ke liner) atau masalah mekanikal pada drive train.',
  },
  Temperature: {
    influencers: ['Water Injection', 'Clinker Temp', 'Mill Ventilation'],
    analysis:
      'Temperatur semen > 110°C bisa menyebabkan false set (gypsum dehydration). Cek sistem water spray atau tambah ventilasi.',
  },
};

export const getKnowledge = (paramName: string): KnowledgeBaseItem => {
  // Case insensitive partial match
  const key = Object.keys(ParameterKnowledge).find((k) =>
    paramName.toLowerCase().includes(k.toLowerCase())
  );
  return key
    ? ParameterKnowledge[key]
    : {
        influencers: ['Operasi Hulu', 'Kondisi Mesin', 'Human Factors'],
        analysis:
          'Parameter ini dipengaruhi oleh stabilitas operasi equipment terkait dan konsistensi material input.',
      };
};
