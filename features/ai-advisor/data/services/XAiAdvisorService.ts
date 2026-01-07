import { IAiAdvisorService } from '../../domain/repositories/IAiAdvisorService';
import { DowntimeLog } from '../../domain/entities/DowntimeLog';

export class XAiAdvisorService implements IAiAdvisorService {
  private endpoint: string;

  constructor() {
    // We use the proxy endpoint.
    // In dev: vite.config.ts proxies /api/xai -> https://api.x.ai AND injects the key.
    // In prod: api/xai.js handles the request and injects the key from PocketBase.
    this.endpoint = '/api/xai';
  }

  async analyzeRootCause(current: DowntimeLog, history: DowntimeLog[]): Promise<string> {
    const context = history
      .map((h) => `- Date: ${h.date}, Problem: ${h.problem}, Action: ${h.action}`)
      .join('\n');

    const prompt = `
      Sebagai Senior Process Engineer semen, analisa masalah berikut:
      Unit: ${current.unit}
      Problem: ${current.problem}
      Action Taken: ${current.action}

      History Masalah Serupa di Unit ini:
      ${context}

      Berikan:
      1. Akar Masalah (Root Cause) yang paling mungkin.
      2. Rekomendasi Solusi Permanen agar tidak berulang.
      Jawab singkat, padat, teknis, dalam Bahasa Indonesia.
    `;

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No Authorization header here; injected by proxy/backend
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a helpful expert assistant.' },
            { role: 'user', content: prompt },
          ],
          model: 'grok-4-1-fast-reasoning',
          stream: false,
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error('xAI API Error:', err);
        if (response.status === 401 || response.status === 403) {
          return `Gagal menganalisa: API Key tidak valid atau kuota habis (${response.status}). Mohon cek di x.AI.`;
        }
        return `Gagal menganalisa: Server merespon ${response.status}.`;
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('xAI Network Error:', error);
      return 'Terjadi kesalahan koneksi ke layanan AI.';
    }
  }
  async generateShiftReport(
    data: import('../../domain/entities/ShiftData').ShiftData
  ): Promise<string> {
    const prompt = `
      Buatkan Laporan Serah Terima Shift (Shift Handover Report) yang profesional untuk pabrik semen.
      
      Detail Shift:
      Tanggal: ${data.date}
      Shift: ${data.shift}
      Unit: ${data.unit}

      Data Operasi:
      ${data.parameters.map((p) => `- ${p.parameterName}: ${p.average.toFixed(2)} ${p.unit} (Min: ${p.min}, Max: ${p.max})`).join('\n')}

      Status Silo:
      ${data.silos.map((s) => `- ${s.siloName}: Akhir ${s.endLevel} ton`).join('\n')}

      Kendala Operasi (Downtime):
      ${data.downtimes.length > 0 ? data.downtimes.map((d) => `- [${d.startTime}-${d.endTime}] ${d.problem} (Action: ${d.action})`).join('\n') : 'Tidak ada downtime signifikan.'}

      Catatan Tambahan:
      ${data.information.map((i) => `- ${i.info}`).join('\n')}

      Instruksi:
      1. Buat narasi kronologis singkat tentang performa shift ini.
      2. Highlight anomali parameter atau masalah utama.
      3. Berikan rekomendasi prioritas untuk shift berikutnya.
      4. Gunakan format Markdown.
    `;

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No Authorization header here; injected by proxy/backend
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a Senior Process Engineer generating a formal operations report.',
            },
            { role: 'user', content: prompt },
          ],
          model: 'grok-4-1-fast-reasoning',
          stream: false,
          temperature: 0.2, // Low temp for factual reporting
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error('xAI API Error:', err);
        if (response.status === 401 || response.status === 403) {
          return `Gagal membuat laporan: API Key tidak valid atau kuota habis (${response.status}). Mohon cek di x.AI.`;
        }
        return `Gagal membuat laporan: Server merespon ${response.status}.`;
      }

      const resData = await response.json();
      return resData.choices[0].message.content;
    } catch (error) {
      console.error('xAI Network Error:', error);
      return 'Terjadi kesalahan koneksi saat membuat laporan.';
    }
  }

  async optimizeParameters(
    snapshots: import('../../domain/entities/OptimizationEntities').ParameterSnapshot[],
    unit: string
  ): Promise<import('../../domain/entities/OptimizationEntities').OptimizationRecommendation[]> {
    if (snapshots.length === 0) return [];

    // Import knowledge base logic locally
    const { getKnowledge } = await import('../../../../components/ai/knowledgeBase');

    // Filter relevant snapshots (non-zero) to save tokens
    const relevantSnapshots = snapshots.filter((s) => s.currentValue !== 0);

    const context = relevantSnapshots
      .map((s) => {
        const kb = getKnowledge(s.parameterName);
        return `- ${s.parameterName}: ${s.currentValue} ${s.unit} (Note: ${kb.analysis})`;
      })
      .join('\n');

    const prompt = `
      Anda adalah AI Advisor untuk optimasi parameter pabrik semen.
      Unit: ${unit}

      Tugas: Analisa setpoint parameter saat ini dan berikan rekomendasi optimasi.
      
      Data Parameter Saat Ini:
      ${context}

      Instruksi:
      1. Identifikasi parameter yang nilainya berpotensi tidak optimal (terlalu tinggi/rendah/null).
      2. Berikan rekomendasi spesifik (Increase/Decrease/Maintain).
      3. Jelaskan alasannya secara teknis (relation to quality/production).
      4. Berikan prediksi dampak jika rekomendasi dijalankan.

      Format Output JSON Array:
      [
        {
          "parameterName": "Nama Param",
          "currentValue": 123,
          "recommendedAction": "Increase",
          "targetValue": 125,
          "reasoning": "Alasan singkat...",
          "impactPrediction": "Dampak positif..."
        }
      ]
      HANYA JSON VALID, TANPA MARKDOWN BACKTICKS.
    `;

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No Authorization header here; injected by proxy/backend
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a JSON-speaking process optimization expert.' },
            { role: 'user', content: prompt },
          ],
          model: 'grok-4-1-fast-reasoning',
          stream: false,
          temperature: 0.1,
          // xAI might not strictly support response_format: {type: 'json_object'} yet like OpenAI,
          // but we keep it or rely on the system prompt.
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(`API Key tidak valid/kuota habis (${response.status})`);
        }
        throw new Error(`Server returned ${response.status}`);
      }

      const resData = await response.json();
      const content = resData.choices[0].message.content;

      // Parse JSON
      let recommendations:
        | import('../../domain/entities/OptimizationEntities').OptimizationRecommendation[]
        | any = [];
      try {
        // Clean markdown code blocks if any
        const cleanContent = content.replace(/```json\n?|```/g, '');
        recommendations = JSON.parse(cleanContent);

        if (!Array.isArray(recommendations) && recommendations.recommendations) {
          recommendations = recommendations.recommendations;
        }
      } catch (e) {
        console.error('Failed to parse AI optimization JSON', e);
        return [];
      }

      return recommendations;
    } catch (error) {
      console.error('xAI Optimization Error:', error);
      return [];
    }
  }
}
