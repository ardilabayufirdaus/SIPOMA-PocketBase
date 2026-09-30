import { pb } from '../../utils/pocketbase-simple';
import { logger } from '../../utils/logger';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const chatbotService = {
  async getSystemContext() {
    try {
      // Fetch Master Data (Full lists as they are usually small)
      const plantUnits = await pb.collection('plant_units').getFullList({ sort: 'unit' });
      const workInstructions = await pb
        .collection('work_instructions')
        .getFullList({ sort: 'activity' });
      const picSettings = await pb.collection('pic_settings').getFullList();
      const picList = picSettings.map((p) => p.pic).join(', ');
      const parameterSettings = await pb.collection('parameter_settings').getFullList({
        limit: 15, // Limit to most important ones to save tokens
        sort: '-created',
      });

      // Fetch Recent Operational Data (last 3-5 records per collection)
      const recentDowntime = await pb
        .collection('ccr_downtime_data')
        .getList(1, 5, { sort: '-date' });
      const recentSilo = await pb.collection('ccr_silo_data').getList(1, 5, { sort: '-date' });
      const recentCapacity = await pb
        .collection('monitoring_production_capacity')
        .getList(1, 5, { sort: '-date' });
      const recentFooter = await pb.collection('ccr_footer_data').getList(1, 5, { sort: '-date' });
      const recentInformation = await pb
        .collection('ccr_information')
        .getList(1, 5, { sort: '-date' });
      const recentMoisture = await pb
        .collection('moisture_monitoring')
        .getList(1, 5, { sort: '-date' });

      // Constructing the context string
      const context = `
SYSTEM CONTEXT: SIPOMA (Sistem Informasi Produksi & Monitoring)
App Purpose: Industrial Plant Operations Management.

Available PICs (Person In Charge):
${picList}

Available Plant Units:
${plantUnits.map((u) => `- ${u.unit} (${u.category}): ${u.description || ''}`).join('\n')}

Recent Work Instructions (WI):
${workInstructions
  .slice(0, 5)
  .map((wi) => `- ${wi.activity}: ${wi.doc_title} (${wi.link})`)
  .join('\n')}

Key Parameter Settings:
${parameterSettings.map((p) => `- ${p.parameter} (${p.unit}): Target range ${p.min_value || 'N/A'} - ${p.max_value || 'N/A'}`).join('\n')}

Recent Downtime Issues:
${recentDowntime.items.map((d) => `- ${d.date} ${d.start_time}: ${d.problem} (Unit: ${d.unit}, PIC: ${d.pic})`).join('\n')}

Current Silo Status (Latest):
${recentSilo.items.map((s) => `- Silo ${s.silo_name || s.silo_id}: ${s.percentage || 'N/A'}% filled`).join('\n')}

Production Capacity Info:
${recentCapacity.items.map((c) => `- ${c.date}: ${c.actual_capacity || 'N/A'} tons (Target: ${c.target_capacity || 'N/A'})`).join('\n')}

Summary Operational Footer Data:
${recentFooter.items.map((f) => `- ${f.date} (${f.plant_unit || 'N/A'}): Total ${f.total || 'N/A'}, Avg ${f.average || 'N/A'}`).join('\n')}

General Plant Information:
${recentInformation.items.map((i) => `- ${i.date}: ${i.info_text || i.description || 'N/A'}`).join('\n')}

Moisture Monitoring (Latest):
${recentMoisture.items.map((m) => `- ${m.date}: ${m.value || 'N/A'}% (Unit: ${m.unit || 'N/A'})`).join('\n')}

Instructions for AI:
1. You are SIPOMA Assistant, an expert in these plant operations.
2. Use the data above to answer specifically.
3. If data is missing for a specific date or unit, say you don't have that specific record but explain what the general process is based on Work Instructions.
4. Keep answers professional, concise, and helpful. Use Bahasa Indonesia.
`;
      return context;
    } catch (error) {
      logger.error('Failed to gather chatbot context:', error);
      return 'Anda adalah asisten SIPOMA. Maaf, saat ini saya mengalami kendala mengakses database terbaru.';
    }
  },

  async sendMessage(messages: Message[]) {
    try {
      const lastUserMsg =
        [...messages]
          .reverse()
          .find((m) => m.role === 'user')
          ?.content.trim()
          .toLowerCase() || '';
      const isSimpleGreeting =
        /^(halo|hai|hi|hello|selamat\s+(pagi|siang|sore|malam)|ping|test)\b/i.test(lastUserMsg);

      const systemPrompt = isSimpleGreeting
        ? 'Anda adalah SIPOMA Assistant, asisten AI operasional pabrik semen SIPOMA. Jawab dengan ramah, sopan, dan singkat dalam Bahasa Indonesia.'
        : await this.getSystemContext();

      const response = await fetch('/api/xai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen2.5:1.5b',
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          stream: false,
          options: {
            num_thread: 1,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('AI API responded with error:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
        });
        throw new Error(`AI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      logger.error('Chatbot message error:', error);
      throw error;
    }
  },
};
